import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Reset all user data to restart onboarding
 * Preserves the account but clears all health data
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Delete all user data (order matters due to foreign keys)
  // Health OS tables
  await supabase.from('activity_logs').delete().eq('user_id', user.id);
  await supabase.from('planned_activities').delete().eq('user_id', user.id);
  
  // Metric entries
  await supabase.from('metric_entries').delete().eq('user_id', user.id);
  
  // Legacy plan system (cascades to plan_items)
  await supabase.from('weekly_plans').delete().eq('user_id', user.id);
  
  // Protocols
  await supabase.from('protocols').delete().eq('user_id', user.id);
  
  // Conversations and adaptations
  await supabase.from('conversations').delete().eq('user_id', user.id);
  await supabase.from('adaptations').delete().eq('user_id', user.id);

  // Reset profile to defaults
  await supabase
    .from('user_profiles')
    .update({
      goals: {},
      constraints: {},
      coaching_style: { tone: 'supportive', density: 'balanced', formality: 'professional' },
      current_fitness_level: 'moderate',
      onboarding_completed: false,
    })
    .eq('id', user.id);

  return NextResponse.json({ success: true });
}

