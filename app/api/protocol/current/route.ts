import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { differenceInWeeks, startOfWeek, parseISO } from 'date-fns';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active protocol
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (protocolError || !protocol) {
      return NextResponse.json({ protocol: null });
    }

    // Calculate current week number
    const protocolStart = startOfWeek(parseISO(protocol.start_date), { weekStartsOn: 1 });
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weeksSinceStart = differenceInWeeks(currentWeekStart, protocolStart);
    const currentWeekNumber = Math.min(Math.max(weeksSinceStart + 1, 1), 12);

    // Get adherence for current week (count completed vs total items)
    const { data: weeklyPlan } = await supabase
      .from('weekly_plans')
      .select('id')
      .eq('user_id', user.id)
      .eq('protocol_id', protocol.id)
      .eq('week_number', currentWeekNumber)
      .single();

    let adherenceThisWeek = 0;
    if (weeklyPlan) {
      const { data: items } = await supabase
        .from('plan_items')
        .select('status')
        .eq('weekly_plan_id', weeklyPlan.id);

      if (items && items.length > 0) {
        const completed = items.filter(i => i.status === 'done').length;
        adherenceThisWeek = Math.round((completed / items.length) * 100);
      }
    }

    return NextResponse.json({
      protocol: {
        id: protocol.id,
        userId: protocol.user_id,
        startDate: protocol.start_date,
        endDate: protocol.end_date,
        status: protocol.status,
        goalSummary: protocol.goal_summary,
        weeks: protocol.weeks,
        createdAt: protocol.created_at,
        updatedAt: protocol.updated_at,
      },
      currentWeekNumber,
      adherenceThisWeek,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching current protocol:', err.message);
    return NextResponse.json(
      { error: 'Failed to fetch protocol', details: err.message },
      { status: 500 }
    );
  }
}
