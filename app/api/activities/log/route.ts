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
      activityDefinitionId, 
      plannedActivityId,
      domain, 
      activityType,
      date, 
      data, 
      notes 
    } = body as {
      activityDefinitionId: string;
      plannedActivityId?: string;
      domain: Domain;
      activityType?: string;
      date: string;
      data: Record<string, unknown>;
      notes?: string;
    };

    // Validate required fields
    if (!activityDefinitionId || !domain || !date || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: activityDefinitionId, domain, date, data' },
        { status: 400 }
      );
    }

    // Insert the activity log
    const { data: logEntry, error: logError } = await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        activity_definition_id: activityDefinitionId,
        planned_activity_id: plannedActivityId || null,
        domain,
        activity_type: activityType || null,
        date,
        data,
        notes: notes || null,
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging activity:', logError);
      return NextResponse.json({ error: logError.message }, { status: 500 });
    }

    // If this was a planned activity, update its status
    if (plannedActivityId) {
      const { error: updateError } = await supabase
        .from('planned_activities')
        .update({ status: 'logged', updated_at: new Date().toISOString() })
        .eq('id', plannedActivityId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating planned activity status:', updateError);
        // Don't fail the request, the log was still created
      }
    }

    return NextResponse.json({ success: true, data: logEntry });
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

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error in activity log API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
