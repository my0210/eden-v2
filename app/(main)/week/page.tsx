import { createClient } from '@/lib/supabase/server';
import { startOfWeek, format, addDays, isToday, isBefore } from 'date-fns';
import { WeekStrip } from '@/components/WeekStrip';
import { DayView } from '@/components/DayView';
import { ChatOverlay } from '@/components/ChatOverlay';
import { ProfileButton } from '@/components/ProfileButton';
import { DomainIndicator } from '@/components/DomainIndicator';
import { PlanGenerator } from '@/components/PlanGenerator';
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

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: planData } = await supabase
    .from('weekly_plans')
    .select('*, plan_items(*)')
    .eq('user_id', user.id)
    .eq('week_start_date', weekStartStr)
    .single();

  const params = await searchParams;
  const selectedDayParam = params.day;
  let selectedDay: DayOfWeek;
  
  if (selectedDayParam !== undefined) {
    selectedDay = parseInt(selectedDayParam, 10) as DayOfWeek;
  } else {
    const todayDow = today.getDay();
    selectedDay = todayDow as DayOfWeek;
  }

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

  const dayItems = weeklyPlan?.items
    .filter(item => item.dayOfWeek === selectedDay)
    .sort((a, b) => a.sortOrder - b.sortOrder) || [];

  const dayCompletionStatus = calculateDayCompletion(weeklyPlan?.items || [], weekStart);
  const selectedDate = addDays(weekStart, selectedDay === 0 ? 6 : selectedDay - 1);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Ambient gradient orb */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[800px] h-[800px]">
          <div 
            className="absolute inset-0 rounded-full opacity-10 blur-[150px]"
            style={{
              background: 'radial-gradient(circle, rgba(34,197,94,0.4) 0%, rgba(16,185,129,0.2) 40%, transparent 70%)',
            }}
          />
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between">
        <ProfileButton />
        <span className="text-xl font-light tracking-tight text-foreground/60">eden</span>
        <div className="w-9" /> {/* Spacer for balance */}
      </header>

      {/* Domain Indicator */}
      <div className="relative z-10 px-6 py-2">
        <DomainIndicator items={weeklyPlan?.items || []} />
      </div>

      {/* Week Strip */}
      <div className="relative z-10 px-6 py-4">
        <WeekStrip 
          weekStart={weekStart}
          selectedDay={selectedDay}
          completionStatus={dayCompletionStatus}
        />
      </div>

      {/* Day View */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 py-4">
        <DayView
          date={selectedDate}
          items={dayItems as PlanItem[]}
          edenIntro={isToday(selectedDate) ? weeklyPlan?.edenIntro : undefined}
          isToday={isToday(selectedDate)}
          isPast={isBefore(selectedDate, today) && !isToday(selectedDate)}
        />
      </div>

      {/* Chat Trigger */}
      <div className="relative z-10 px-6 pt-4 pb-6 safe-area-bottom bg-[#0a0a0a]">
        <ChatOverlay 
          trigger={
            <button className="
              w-full px-4 py-3 
              bg-white/5 border border-white/10 rounded-xl
              text-foreground/30 text-left
              hover:bg-white/10 hover:border-white/15
              transition-all duration-300
              flex items-center justify-between
            ">
              <span>Ask Eden...</span>
              <svg 
                className="w-5 h-5 text-foreground/20" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </button>
          }
        />
      </div>

      {/* Auto-generate plan if none exists */}
      <PlanGenerator hasPlan={!!weeklyPlan} weekStartDate={weekStartStr} />
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
