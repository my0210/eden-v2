import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { generateWeeklyPlan } from '@/lib/ai/planGeneration';
import { UserProfile } from '@/lib/types';
import { startOfWeek, format } from 'date-fns';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { weekStartDate, forceRegenerate = false } = body;

    // Use provided date or current week
    const weekStart = weekStartDate 
      ? new Date(weekStartDate)
      : startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');

    // Check if plan already exists
    if (!forceRegenerate) {
      const { data: existingPlan } = await supabase
        .from('weekly_plans')
        .select('id')
        .eq('user_id', user.id)
        .eq('week_start_date', weekStartStr)
        .single();

      if (existingPlan) {
        return NextResponse.json({ 
          message: 'Plan already exists for this week',
          planId: existingPlan.id,
        });
      }
    }

    // Get user profile
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profileData) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profile: UserProfile = {
      id: profileData.id,
      email: profileData.email,
      goals: profileData.goals,
      constraints: profileData.constraints,
      coachingStyle: profileData.coaching_style,
      currentFitnessLevel: profileData.current_fitness_level,
      onboardingCompleted: profileData.onboarding_completed,
      createdAt: profileData.created_at,
      updatedAt: profileData.updated_at,
    };

    // Get previous week's context if available
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekStartStr = format(prevWeekStart, 'yyyy-MM-dd');

    const { data: prevPlanData } = await supabase
      .from('weekly_plans')
      .select('*, plan_items(*)')
      .eq('user_id', user.id)
      .eq('week_start_date', prevWeekStartStr)
      .single();

    let previousWeekContext: string | undefined;
    if (prevPlanData?.plan_items) {
      const completed = prevPlanData.plan_items.filter((i: { status: string }) => i.status === 'done').length;
      const total = prevPlanData.plan_items.length;
      previousWeekContext = `Last week: ${completed}/${total} items completed (${Math.round((completed/total) * 100)}% adherence)`;
    }

    // Generate the plan
    const generated = await generateWeeklyPlan(profile, weekStartStr, previousWeekContext);

    // Delete existing plan if force regenerating
    if (forceRegenerate) {
      await supabase
        .from('weekly_plans')
        .delete()
        .eq('user_id', user.id)
        .eq('week_start_date', weekStartStr);
    }

    // Create the weekly plan
    const { data: newPlan, error: planError } = await supabase
      .from('weekly_plans')
      .insert({
        user_id: user.id,
        week_start_date: weekStartStr,
        eden_intro: generated.edenIntro,
        generation_context: {
          profile: {
            fitnessLevel: profile.currentFitnessLevel,
            goals: profile.goals,
          },
          previousWeekContext,
          generatedAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (planError) {
      console.error('Error creating plan:', planError);
      return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
    }

    // Create plan items
    const itemsToInsert = generated.items.map(item => ({
      weekly_plan_id: newPlan.id,
      domain: item.domain,
      day_of_week: item.dayOfWeek,
      title: item.title,
      duration_minutes: item.durationMinutes,
      personalization_context: item.personalizationContext,
      reasoning: item.reasoning,
      status: item.status,
      sort_order: item.sortOrder,
    }));

    const { error: itemsError } = await supabase
      .from('plan_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Error creating plan items:', itemsError);
      // Clean up the plan
      await supabase.from('weekly_plans').delete().eq('id', newPlan.id);
      return NextResponse.json({ error: 'Failed to create plan items' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      planId: newPlan.id,
      edenIntro: generated.edenIntro,
      itemCount: generated.items.length,
    });
  } catch (error) {
    console.error('Error in plan generation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

