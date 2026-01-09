import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Delete all user data (cascades to plan_items, etc.)
  await supabase.from('weekly_plans').delete().eq('user_id', user.id);
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

