import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Domain } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      activityId,
      domain, 
      activityType,
      date, 
      value,
      unit,
      notes 
    } = body as {
      activityId: string;
      domain: Domain;
      activityType?: string;
      date: string;
      value: number;
      unit: string;
      notes?: string;
    };

    // Validate required fields
    if (!activityId || !domain || !date || value === undefined || !unit) {
      return NextResponse.json(
        { error: 'Missing required fields: activityId, domain, date, value, unit' },
        { status: 400 }
      );
    }

    // Insert the activity log
    const { data: logEntry, error: logError } = await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        activity_definition_id: activityId,
        domain,
        activity_type: activityType || null,
        date,
        value,
        unit,
        notes: notes || null,
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging activity:', logError);
      return NextResponse.json({ error: logError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        id: logEntry.id,
        userId: logEntry.user_id,
        activityDefinitionId: logEntry.activity_definition_id,
        domain: logEntry.domain,
        activityType: logEntry.activity_type,
        date: logEntry.date,
        value: logEntry.value,
        unit: logEntry.unit,
        notes: logEntry.notes,
        createdAt: logEntry.created_at,
      }
    });
  } catch (error) {
    console.error('Error in activity log API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekStartDate = searchParams.get('weekStartDate');
    const domain = searchParams.get('domain') as Domain | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let query = supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(limit);

    // Filter by week if provided
    if (weekStartDate) {
      const weekEnd = new Date(weekStartDate);
      weekEnd.setDate(weekEnd.getDate() + 7);
      query = query
        .gte('date', weekStartDate)
        .lt('date', weekEnd.toISOString().split('T')[0]);
    }

    // Filter by domain if provided
    if (domain) {
      query = query.eq('domain', domain);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Error fetching activity logs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to camelCase
    const transformedLogs = (logs || []).map(log => ({
      id: log.id,
      userId: log.user_id,
      activityDefinitionId: log.activity_definition_id,
      domain: log.domain,
      activityType: log.activity_type,
      date: log.date,
      value: log.value,
      unit: log.unit,
      notes: log.notes,
      createdAt: log.created_at,
    }));

    return NextResponse.json({ success: true, data: transformedLogs });
  } catch (error) {
    console.error('Error in activity log API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
