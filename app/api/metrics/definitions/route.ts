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

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('unit_system, glucose_unit, lipids_unit')
      .eq('id', user.id)
      .single();

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
    let scoring: Record<string, unknown> = {};
    
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

      const { data: tests } = await supabase
        .from('metric_tests')
        .select('id, metric_definition_id')
        .in('metric_definition_id', metricIds)
        .eq('is_active', true);

      const testIds = tests?.map(test => test.id) || [];
      if (testIds.length > 0) {
        const { data: scoringRows } = await supabase
          .from('metric_scoring')
          .select('*')
          .in('metric_test_id', testIds);

        if (scoringRows && tests) {
          const testById = new Map(tests.map(test => [test.id, test.metric_definition_id]));
          scoringRows.forEach(row => {
            const metricDefinitionId = testById.get(row.metric_test_id);
            if (!metricDefinitionId) return;
            scoring[metricDefinitionId] = {
              id: row.id,
              metricDefinitionId,
              optimalRangeMin: row.optimal_range_min,
              optimalRangeMax: row.optimal_range_max,
              curveType: row.score_curve || row.curve_type,
              curveParams: row.curve_params,
              createdAt: row.created_at,
            };
          });
        }
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
      canonicalUnit: def.canonical_unit,
      unitType: def.unit_type,
      testType: def.test_type,
      isCalculated: def.is_calculated || def.is_derived,
      valueType: def.value_type,
      measurementSources: def.measurement_sources || [],
      frequencyHint: def.frequency_hint,
      sortOrder: def.sort_order,
      createdAt: def.created_at,
    })) || [];

    return NextResponse.json({
      definitions: transformedDefinitions,
      latestEntries,
      scoring,
      unitSystem: profile?.unit_system || 'metric',
      unitPreferences: {
        glucoseUnit: profile?.glucose_unit || 'mg/dL',
        lipidsUnit: profile?.lipids_unit || 'mg/dL',
      },
    });
  } catch (error) {
    console.error('Error in metrics definitions API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
