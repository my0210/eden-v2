import { createClient } from '@/lib/supabase/server';
import { startOfWeek, format, addDays, isToday, isBefore, parseISO } from 'date-fns';
import { WeekStrip } from '@/components/WeekStrip';
import { DayView } from '@/components/DayView';
import { ChatInput } from '@/components/ChatInput';
import { ProfileButton } from '@/components/ProfileButton';
import { DomainIndicator } from '@/components/DomainIndicator';
import { UserProfile, WeeklyPlan, PlanItem, DayOfWeek } from '@/lib/types';

export default async function WeekPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get current week start (Monday)
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get weekly plan
  const { data: planData } = await supabase
    .from('weekly_plans')
    .select('*, plan_items(*)')
    .eq('user_id', user.id)
    .eq('week_start_date', weekStartStr)
    .single();

  // Determine which day to show
  const params = await searchParams;
  const selectedDayParam = params.day;
  let selectedDay: DayOfWeek;
  
  if (selectedDayParam !== undefined) {
    selectedDay = parseInt(selectedDayParam, 10) as DayOfWeek;
  } else {
    // Default to today's day of week (1 = Monday, 0 = Sunday)
    const todayDow = today.getDay();
    selectedDay = todayDow as DayOfWeek;
  }

  // Transform data
  const userProfile: UserProfile | null = profile ? {
    id: profile.id,
    email: profile.email,
    goals: profile.goals,
    constraints: profile.constraints,
    coachingStyle: profile.coaching_style,
    currentFitnessLevel: profile.current_fitness_level,
    onboardingCompleted: profile.onboarding_completed,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  } : null;

  const weeklyPlan: WeeklyPlan | null = planData ? {
    id: planData.id,
    userId: planData.user_id,
    weekStartDate: planData.week_start_date,
    edenIntro: planData.eden_intro,
    generationContext: planData.generation_context,
    items: (planData.plan_items || []).map((item: Record<string, unknown>) => ({
      id: item.id as string,
      weeklyPlanId: item.weekly_plan_id as string,
      domain: item.domain as string,
      dayOfWeek: item.day_of_week as number,
      title: item.title as string,
      durationMinutes: item.duration_minutes as number | null,
      personalizationContext: item.personalization_context as string,
      reasoning: item.reasoning as string,
      status: item.status as string,
      completedAt: item.completed_at as string | null,
      sortOrder: item.sort_order as number,
      createdAt: item.created_at as string,
    })),
    createdAt: planData.created_at,
  } : null;

  // Get items for selected day
  const dayItems = weeklyPlan?.items
    .filter(item => item.dayOfWeek === selectedDay)
    .sort((a, b) => a.sortOrder - b.sortOrder) || [];

  // Calculate completion status for each day
  const dayCompletionStatus = calculateDayCompletion(weeklyPlan?.items || [], weekStart);

  // Get selected date
  const selectedDate = addDays(weekStart, selectedDay === 0 ? 6 : selectedDay - 1);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-default px-4 py-3">
        <div className="flex items-center justify-between">
          <ProfileButton />
          <span className="text-foreground-muted text-sm">
            Week of {format(weekStart, 'MMM d')}
          </span>
        </div>
      </header>

      {/* Domain Indicator */}
      <div className="px-4 py-3 border-b border-muted">
        <DomainIndicator 
          items={weeklyPlan?.items || []} 
        />
      </div>

      {/* Week Strip */}
      <div className="px-4 py-3 border-b border-muted">
        <WeekStrip 
          weekStart={weekStart}
          selectedDay={selectedDay}
          completionStatus={dayCompletionStatus}
        />
      </div>

      {/* Day View - Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <DayView
          date={selectedDate}
          items={dayItems as PlanItem[]}
          edenIntro={isToday(selectedDate) ? weeklyPlan?.edenIntro : undefined}
          isToday={isToday(selectedDate)}
          isPast={isBefore(selectedDate, today) && !isToday(selectedDate)}
        />
      </div>

      {/* Chat Input - Fixed at Bottom */}
      <div className="sticky bottom-0 border-t border-default bg-background px-4 py-3 safe-area-bottom">
        <ChatInput userId={user.id} />
      </div>
    </div>
  );
}

interface DayCompletion {
  total: number;
  completed: number;
  percentage: number;
}

function calculateDayCompletion(
  items: PlanItem[],
  weekStart: Date
): Record<DayOfWeek, DayCompletion> {
  const result: Record<DayOfWeek, DayCompletion> = {
    0: { total: 0, completed: 0, percentage: 0 },
    1: { total: 0, completed: 0, percentage: 0 },
    2: { total: 0, completed: 0, percentage: 0 },
    3: { total: 0, completed: 0, percentage: 0 },
    4: { total: 0, completed: 0, percentage: 0 },
    5: { total: 0, completed: 0, percentage: 0 },
    6: { total: 0, completed: 0, percentage: 0 },
  };

  items.forEach(item => {
    const day = item.dayOfWeek as DayOfWeek;
    result[day].total++;
    if (item.status === 'done') {
      result[day].completed++;
    }
  });

  // Calculate percentages
  Object.keys(result).forEach(key => {
    const day = parseInt(key) as DayOfWeek;
    if (result[day].total > 0) {
      result[day].percentage = Math.round(
        (result[day].completed / result[day].total) * 100
      );
    }
  });

  return result;
}

