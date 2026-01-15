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
    const metricId = searchParams.get('metricId');
    const domain = searchParams.get('domain');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Build query
    let query = supabase
      .from('user_metric_entries')
      .select(`
        *,
        metric_definitions (
          id,
          domain,
          sub_domain,
          name,
          unit,
          value_type
        )
      `)
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (metricId) {
      query = query.eq('metric_definition_id', metricId);
    }

    if (domain) {
      query = query.eq('metric_definitions.domain', domain);
    }

    if (startDate) {
      query = query.gte('recorded_at', startDate);
    }

    if (endDate) {
      query = query.lte('recorded_at', endDate);
    }

    const { data: entries, error } = await query;

    if (error) {
      console.error('Error fetching entries:', error);
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
    }

    // Transform to camelCase
    const transformedEntries = entries?.map(entry => ({
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
      metricDefinition: entry.metric_definitions ? {
        id: entry.metric_definitions.id,
        domain: entry.metric_definitions.domain,
        subDomain: entry.metric_definitions.sub_domain,
        name: entry.metric_definitions.name,
        unit: entry.metric_definitions.unit,
        valueType: entry.metric_definitions.value_type,
      } : undefined,
    })) || [];

    return NextResponse.json({ entries: transformedEntries });
  } catch (error) {
    console.error('Error in metrics entries GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { metricDefinitionId, value, unit, source, recordedAt, notes, rawData } = body;

    if (!metricDefinitionId || value === undefined) {
      return NextResponse.json(
        { error: 'metricDefinitionId and value are required' }, 
        { status: 400 }
      );
    }

    // Verify the metric definition exists
    const { data: metricDef, error: metricError } = await supabase
      .from('metric_definitions')
      .select('id, unit')
      .eq('id', metricDefinitionId)
      .single();

    if (metricError || !metricDef) {
      return NextResponse.json({ error: 'Invalid metric definition' }, { status: 400 });
    }

    // Insert the entry
    const { data: entry, error: insertError } = await supabase
      .from('user_metric_entries')
      .insert({
        user_id: user.id,
        metric_definition_id: metricDefinitionId,
        value: parseFloat(value),
        unit: unit || metricDef.unit,
        source: source || 'manual',
        recorded_at: recordedAt || new Date().toISOString(),
        notes: notes || null,
        raw_data: rawData || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting entry:', insertError);
      return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
    }

    return NextResponse.json({
      entry: {
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
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error in metrics entries POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
