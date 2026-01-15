import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get('domain');

    // Build query for definitions
    let definitionsQuery = supabase
      .from('metric_definitions')
      .select('*')
      .order('sort_order', { ascending: true });

    if (domain) {
      definitionsQuery = definitionsQuery.eq('domain', domain);
    }

    const { data: definitions, error: definitionsError } = await definitionsQuery;

    if (definitionsError) {
      console.error('Error fetching definitions:', definitionsError);
      return NextResponse.json({ error: 'Failed to fetch definitions' }, { status: 500 });
    }

    // Get latest entries for each metric for this user
    const metricIds = definitions?.map(d => d.id) || [];
    
    let latestEntries: Record<string, unknown> = {};
    
    if (metricIds.length > 0) {
      // Get the latest entry for each metric definition
      const { data: entries, error: entriesError } = await supabase
        .from('user_metric_entries')
        .select('*')
        .eq('user_id', user.id)
        .in('metric_definition_id', metricIds)
        .order('recorded_at', { ascending: false });

      if (!entriesError && entries) {
        // Group by metric_definition_id and take the first (latest) for each
        entries.forEach(entry => {
          if (!latestEntries[entry.metric_definition_id]) {
            latestEntries[entry.metric_definition_id] = {
              id: entry.id,
              userId: entry.user_id,
              metricDefinitionId: entry.metric_definition_id,
              value: entry.value,
              unit: entry.unit,
              source: entry.source,
              recordedAt: entry.recorded_at,
              notes: entry.notes,
              rawData: entry.raw_data,
              createdAt: entry.created_at,
            };
          }
        });
      }
    }

    // Transform definitions to camelCase
    const transformedDefinitions = definitions?.map(def => ({
      id: def.id,
      domain: def.domain,
      subDomain: def.sub_domain,
      name: def.name,
      description: def.description,
      whatItTellsYou: def.what_it_tells_you,
      unit: def.unit,
      valueType: def.value_type,
      measurementSources: def.measurement_sources || [],
      frequencyHint: def.frequency_hint,
      sortOrder: def.sort_order,
      createdAt: def.created_at,
    })) || [];

    return NextResponse.json({
      definitions: transformedDefinitions,
      latestEntries,
    });
  } catch (error) {
    console.error('Error in metrics definitions API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
