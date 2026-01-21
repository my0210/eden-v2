import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Domain, DOMAINS } from '@/lib/types';

interface DomainProgress {
  domain: Domain;
  logged: number;
  target: number;
  unit: string;
  count: {
    logged: number;
    target: number;
  };
  activities: {
    activityId: string;
    logged: number;
    target: number;
    unit: string;
    count: { logged: number; target: number };
  }[];
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

    // Calculate week end date
    const weekEnd = new Date(weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    // Fetch planned activities for the week
    const { data: plannedActivities, error: plannedError } = await supabase
      .from('planned_activities')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start_date', weekStartDate);

    if (plannedError) {
      console.error('Error fetching planned activities:', plannedError);
      return NextResponse.json({ error: plannedError.message }, { status: 500 });
    }

    // Fetch activity logs for the week
    const { data: activityLogs, error: logsError } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', weekStartDate)
      .lt('date', weekEndStr);

    if (logsError) {
      console.error('Error fetching activity logs:', logsError);
      return NextResponse.json({ error: logsError.message }, { status: 500 });
    }

    // Aggregate progress by domain
    const progress: Record<Domain, DomainProgress> = {} as Record<Domain, DomainProgress>;

    // Initialize all domains
    for (const domain of DOMAINS) {
      progress[domain] = {
        domain,
        logged: 0,
        target: 0,
        unit: 'min',
        count: { logged: 0, target: 0 },
        activities: [],
      };
    }

    // Aggregate planned activities
    for (const planned of plannedActivities || []) {
      const domain = planned.domain as Domain;
      if (!progress[domain]) continue;

      progress[domain].target += Number(planned.target_value) || 0;
      progress[domain].count.target++;

      // Track by activity
      const existingActivity = progress[domain].activities.find(
        a => a.activityId === planned.activity_definition_id
      );
      if (existingActivity) {
        existingActivity.target += Number(planned.target_value) || 0;
        existingActivity.count.target++;
      } else {
        progress[domain].activities.push({
          activityId: planned.activity_definition_id,
          logged: 0,
          target: Number(planned.target_value) || 0,
          unit: planned.target_unit || 'min',
          count: { logged: 0, target: 1 },
        });
      }
    }

    // Aggregate logged activities
    for (const log of activityLogs || []) {
      const domain = log.domain as Domain;
      if (!progress[domain]) continue;

      // Get duration from log data
      const duration = Number(log.data?.duration_min) || 0;
      progress[domain].logged += duration;
      progress[domain].count.logged++;

      // Track by activity
      const existingActivity = progress[domain].activities.find(
        a => a.activityId === log.activity_definition_id
      );
      if (existingActivity) {
        existingActivity.logged += duration;
        existingActivity.count.logged++;
      } else {
        progress[domain].activities.push({
          activityId: log.activity_definition_id,
          logged: duration,
          target: 0,
          unit: 'min',
          count: { logged: 1, target: 0 },
        });
      }
    }

    // Determine unit for each domain based on logged/planned data
    for (const domain of DOMAINS) {
      // Use count-based display for frame (sessions) and recovery (nights)
      if (domain === 'frame') {
        progress[domain].unit = '';
      } else if (domain === 'recovery') {
        progress[domain].unit = '';
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: progress,
      summary: {
        totalPlanned: plannedActivities?.length || 0,
        totalLogged: activityLogs?.length || 0,
        weekStartDate,
      }
    });
  } catch (error) {
    console.error('Error in activity progress API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
