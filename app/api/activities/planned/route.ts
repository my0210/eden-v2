import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Domain, DayOfWeek } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      weekStartDate,
      activityDefinitionId, 
      domain, 
      dayOfWeek,
      targetValue,
      targetUnit,
      details,
    } = body as {
      weekStartDate: string;
      activityDefinitionId: string;
      domain: Domain;
      dayOfWeek?: DayOfWeek;
      targetValue: number;
      targetUnit: string;
      details?: string;
    };

    // Validate required fields
    if (!weekStartDate || !activityDefinitionId || !domain || !targetValue || !targetUnit) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert the planned activity
    const { data: planned, error } = await supabase
      .from('planned_activities')
      .insert({
        user_id: user.id,
        week_start_date: weekStartDate,
        activity_definition_id: activityDefinitionId,
        domain,
        day_of_week: dayOfWeek ?? null,
        target_value: targetValue,
        target_unit: targetUnit,
        details: details || null,
        status: 'planned',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating planned activity:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: planned });
  } catch (error) {
    console.error('Error in planned activities API:', error);
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

    if (!weekStartDate) {
      return NextResponse.json(
        { error: 'weekStartDate is required' },
        { status: 400 }
      );
    }

    const { data: planned, error } = await supabase
      .from('planned_activities')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start_date', weekStartDate)
      .order('day_of_week', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Error fetching planned activities:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: planned });
  } catch (error) {
    console.error('Error in planned activities API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body as {
      id: string;
      status: 'planned' | 'logged' | 'skipped';
    };

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status are required' },
        { status: 400 }
      );
    }

    const { data: updated, error } = await supabase
      .from('planned_activities')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating planned activity:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in planned activities API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
