import { createClient } from '@/lib/supabase/server';

export type AdaptationTrigger = 
  | 'missed_items' 
  | 'user_request' 
  | 'pattern_detected' 
  | 'constraint_change' 
  | 'weekly_generation';

interface AdaptationLog {
  userId: string;
  weeklyPlanId?: string;
  triggerType: AdaptationTrigger;
  description: string;
  changesMade?: Record<string, unknown>;
}

/**
 * Log an adaptation event
 */
export async function logAdaptation(adaptation: AdaptationLog): Promise<void> {
  const supabase = await createClient();
  
  await supabase.from('adaptations').insert({
    user_id: adaptation.userId,
    weekly_plan_id: adaptation.weeklyPlanId,
    trigger_type: adaptation.triggerType,
    description: adaptation.description,
    changes_made: adaptation.changesMade,
  });
}

/**
 * Get recent adaptations for a user
 */
export async function getRecentAdaptations(
  userId: string, 
  limit: number = 10
): Promise<AdaptationLog[]> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('adaptations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data || []).map(row => ({
    userId: row.user_id,
    weeklyPlanId: row.weekly_plan_id,
    triggerType: row.trigger_type,
    description: row.description,
    changesMade: row.changes_made,
  }));
}

/**
 * Analyze skip patterns for a user
 * Returns insights about what types of items are frequently skipped
 */
export async function analyzeSkipPatterns(userId: string): Promise<{
  totalSkipped: number;
  byDomain: Record<string, number>;
  byDayOfWeek: Record<number, number>;
  commonReasons: string[];
}> {
  const supabase = await createClient();
  
  // Get all skipped items from the last 4 weeks
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  
  const { data: plans } = await supabase
    .from('weekly_plans')
    .select('id, plan_items(*)')
    .eq('user_id', userId)
    .gte('created_at', fourWeeksAgo.toISOString());

  const skippedItems: Array<{ domain: string; dayOfWeek: number }> = [];
  
  plans?.forEach(plan => {
    const items = plan.plan_items as Array<{ status: string; domain: string; day_of_week: number }>;
    items?.forEach(item => {
      if (item.status === 'skipped') {
        skippedItems.push({
          domain: item.domain,
          dayOfWeek: item.day_of_week,
        });
      }
    });
  });

  // Aggregate by domain
  const byDomain: Record<string, number> = {};
  skippedItems.forEach(item => {
    byDomain[item.domain] = (byDomain[item.domain] || 0) + 1;
  });

  // Aggregate by day of week
  const byDayOfWeek: Record<number, number> = {};
  skippedItems.forEach(item => {
    byDayOfWeek[item.dayOfWeek] = (byDayOfWeek[item.dayOfWeek] || 0) + 1;
  });

  return {
    totalSkipped: skippedItems.length,
    byDomain,
    byDayOfWeek,
    commonReasons: [], // Could be populated from adaptation logs with reasons
  };
}

/**
 * Get adaptation context for plan generation
 * Returns a string summary of adaptations to include in the AI prompt
 */
export async function getAdaptationContext(userId: string): Promise<string | undefined> {
  const patterns = await analyzeSkipPatterns(userId);
  
  if (patterns.totalSkipped === 0) {
    return undefined;
  }

  const lines: string[] = ['## Adaptation Insights'];
  
  // Domain patterns
  const topSkippedDomains = Object.entries(patterns.byDomain)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);
  
  if (topSkippedDomains.length > 0) {
    lines.push(`Most frequently skipped domains: ${topSkippedDomains.map(([d, c]) => `${d} (${c}x)`).join(', ')}`);
  }

  // Day patterns
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const topSkippedDays = Object.entries(patterns.byDayOfWeek)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);
  
  if (topSkippedDays.length > 0) {
    lines.push(`Days with most skips: ${topSkippedDays.map(([d, c]) => `${dayNames[Number(d)]} (${c}x)`).join(', ')}`);
  }

  lines.push('');
  lines.push('Consider reducing load on problematic days/domains or offering alternatives.');

  return lines.join('\n');
}

