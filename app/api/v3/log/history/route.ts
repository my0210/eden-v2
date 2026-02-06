import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Pillar, CoreFiveLog } from '@/lib/v3/coreFive';

// GET: Fetch all logs for the last N weeks in a single query
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const weeksParam = searchParams.get('weeks');
  const weeks = Math.min(Math.max(parseInt(weeksParam || '12', 10), 1), 52);

  // Calculate the earliest week_start date we care about
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const currentWeekStart = new Date(now);
  currentWeekStart.setDate(diff);
  currentWeekStart.setHours(0, 0, 0, 0);

  const earliestDate = new Date(currentWeekStart);
  earliestDate.setDate(earliestDate.getDate() - (weeks - 1) * 7);
  const earliestStr = earliestDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('core_five_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('week_start', earliestStr)
    .order('week_start', { ascending: false })
    .order('logged_at', { ascending: false });

  if (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }

  const logs: CoreFiveLog[] = (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    pillar: row.pillar as Pillar,
    value: row.value,
    details: row.details,
    loggedAt: row.logged_at,
    weekStart: row.week_start,
    createdAt: row.created_at,
  }));

  return NextResponse.json({ logs, weeks });
}
