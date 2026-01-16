import { createClient } from '@/lib/supabase/server';
import { toCanonicalValue, inferUnitType } from '@/lib/units';
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
          canonical_unit,
          unit_type,
          test_type,
          is_calculated,
          is_derived,
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
        canonicalUnit: entry.metric_definitions.canonical_unit,
        unitType: entry.metric_definitions.unit_type,
        testType: entry.metric_definitions.test_type,
        isCalculated: entry.metric_definitions.is_calculated || entry.metric_definitions.is_derived,
        valueType: entry.metric_definitions.value_type,
      } : undefined,
    })) || [];

    let scoring = null;
    if (metricId) {
      const { data: testRow } = await supabase
        .from('metric_tests')
        .select('id')
        .eq('metric_definition_id', metricId)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (testRow?.id) {
        const { data: scoringRow } = await supabase
          .from('metric_scoring')
          .select('*')
          .eq('metric_test_id', testRow.id)
          .single();
        if (scoringRow) {
          scoring = {
            id: scoringRow.id,
            metricDefinitionId: metricId,
            optimalRangeMin: scoringRow.optimal_range_min,
            optimalRangeMax: scoringRow.optimal_range_max,
            curveType: scoringRow.score_curve || scoringRow.curve_type,
            curveParams: scoringRow.curve_params,
            createdAt: scoringRow.created_at,
          };
        }
      }
    }

    return NextResponse.json({ 
      entries: transformedEntries, 
      unitSystem: profile?.unit_system || 'metric', 
      unitPreferences: {
        glucoseUnit: profile?.glucose_unit || 'mg/dL',
        lipidsUnit: profile?.lipids_unit || 'mg/dL',
      },
      scoring 
    });
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
    const { metricDefinitionId, value, unit, inputUnit, source, recordedAt, notes, rawData } = body;

    if (!metricDefinitionId || value === undefined) {
      return NextResponse.json(
        { error: 'metricDefinitionId and value are required' }, 
        { status: 400 }
      );
    }

    // Verify the metric definition exists
    const { data: metricDef, error: metricError } = await supabase
      .from('metric_definitions')
      .select('id, unit, canonical_unit, unit_type')
      .eq('id', metricDefinitionId)
      .single();

    if (metricError || !metricDef) {
      return NextResponse.json({ error: 'Invalid metric definition' }, { status: 400 });
    }

    // Insert the entry
    let canonicalValue = parseFloat(value);
    const resolvedUnitType = metricDef?.unit_type || inferUnitType(metricDef?.unit, undefined);
    if (!isNaN(canonicalValue) && resolvedUnitType && inputUnit) {
      canonicalValue = toCanonicalValue(canonicalValue, resolvedUnitType, inputUnit);
    }

    const canonicalUnit = metricDef?.canonical_unit || metricDef?.unit || unit || null;

    const { data: testRow } = await supabase
      .from('metric_tests')
      .select('id')
      .eq('metric_definition_id', metricDefinitionId)
      .eq('is_active', true)
      .limit(1)
      .single();

    const { data: entry, error: insertError } = await supabase
      .from('user_metric_entries')
      .insert({
        user_id: user.id,
        metric_definition_id: metricDefinitionId,
        metric_test_id: testRow?.id || null,
        value: canonicalValue,
        unit: canonicalUnit,
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

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, value, source, recordedAt, notes, inputUnit } = body;

    if (!id) {
      return NextResponse.json({ error: 'Entry id is required' }, { status: 400 });
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (value !== undefined) {
      const parsedValue = parseFloat(value);
      if (!isNaN(parsedValue)) {
        let canonicalValue = parsedValue;
        if (inputUnit) {
          const { data: existingEntry } = await supabase
            .from('user_metric_entries')
            .select('metric_definition_id')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

          if (existingEntry?.metric_definition_id) {
          const { data: metricDef } = await supabase
              .from('metric_definitions')
            .select('unit_type, unit, canonical_unit')
              .eq('id', existingEntry.metric_definition_id)
              .single();
            const resolvedType = metricDef?.unit_type || inferUnitType(metricDef?.unit, undefined);
            if (resolvedType) {
              canonicalValue = toCanonicalValue(parsedValue, resolvedType, inputUnit);
            }
          updateData.unit = metricDef?.canonical_unit || metricDef?.unit || null;

            const { data: testRow } = await supabase
              .from('metric_tests')
              .select('id')
              .eq('metric_definition_id', existingEntry.metric_definition_id)
              .eq('is_active', true)
              .limit(1)
              .single();
            if (testRow?.id) {
              updateData.metric_test_id = testRow.id;
            }
          }
        }
        updateData.value = canonicalValue;
      }
    }
    if (source !== undefined) updateData.source = source;
    if (recordedAt !== undefined) updateData.recorded_at = recordedAt;
    if (notes !== undefined) updateData.notes = notes || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Update the entry (RLS ensures user can only update their own)
    const { data: entry, error: updateError } = await supabase
      .from('user_metric_entries')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating entry:', updateError);
      return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
    }

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
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
    });
  } catch (error) {
    console.error('Error in metrics entries PUT API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Entry id is required' }, { status: 400 });
    }

    // Delete the entry (RLS ensures user can only delete their own)
    const { error: deleteError } = await supabase
      .from('user_metric_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting entry:', deleteError);
      return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in metrics entries DELETE API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
