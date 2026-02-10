import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { startOfWeek, endOfWeek, differenceInWeeks, parseISO, format } from 'date-fns';
import { ProtocolView } from '@/components/ProtocolView';
import { SettingsButton } from '@/components/SettingsButton';
import { YouButton } from '@/components/YouButton';
import { CreateProtocolButton } from '@/components/CreateProtocolButton';
import { Protocol, UserProfile, ProtocolNarrative, RecommendedActivity, ProtocolWeek, Domain, ActivityLog } from '@/lib/types';
import Link from 'next/link';

export default async function ProtocolPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const userProfile: UserProfile | null = profile ? {
    id: profile.id,
    email: profile.email,
    goals: profile.goals,
    constraints: profile.constraints,
    coachingStyle: profile.coaching_style,
    currentFitnessLevel: profile.current_fitness_level,
    onboardingCompleted: profile.onboarding_completed,
    isAdmin: profile.is_admin || false,
    unitSystem: profile.unit_system || 'metric',
    glucoseUnit: profile.glucose_unit || 'mg/dL',
    lipidsUnit: profile.lipids_unit || 'mg/dL',
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  } : null;

  // Fetch active protocol
  const { data: protocolData } = await supabase
    .from('protocols')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!protocolData) {
    // No active protocol - show create prompt
    return (
      <div className="min-h-screen flex flex-col relative">
        <header className="relative z-10 px-6 py-4 flex items-center justify-between">
          <SettingsButton 
            isAdmin={userProfile?.isAdmin} 
            unitSystem={userProfile?.unitSystem}
            glucoseUnit={userProfile?.glucoseUnit}
            lipidsUnit={userProfile?.lipidsUnit}
            coachingStyle={userProfile?.coachingStyle}
          />
          <span className="text-xl font-light tracking-tight text-foreground/60">huuman</span>
          <YouButton />
        </header>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center space-y-6 max-w-sm">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-light text-foreground/80 mb-2">Start Your Protocol</h2>
              <p className="text-sm text-foreground/50 leading-relaxed">
                Create a personalized 12-week health protocol based on your goals and preferences.
              </p>
            </div>
            <CreateProtocolButton />
          </div>
        </div>
      </div>
    );
  }

  // Transform protocol data (simplified schema)
  const protocol: Protocol = {
    id: protocolData.id,
    userId: protocolData.user_id,
    startDate: protocolData.start_date,
    endDate: protocolData.end_date,
    status: protocolData.status,
    goalSummary: protocolData.goal_summary,
    narrative: (protocolData.narrative || { why: '', approach: '', expectedOutcomes: '' }) as ProtocolNarrative,
    recommendedActivities: (protocolData.recommended_activities || []) as RecommendedActivity[],
    weeks: (protocolData.weeks || []) as ProtocolWeek[],
    createdAt: protocolData.created_at,
    updatedAt: protocolData.updated_at,
  };

  // Calculate current week number
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const protocolStart = startOfWeek(parseISO(protocol.startDate), { weekStartsOn: 1 });
  const weeksSinceStart = differenceInWeeks(weekStart, protocolStart);
  const currentWeekNumber = Math.min(Math.max(weeksSinceStart + 1, 1), 12);

  // Fetch activity logs for current week
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndDate = endOfWeek(today, { weekStartsOn: 1 });
  const weekEndStr = format(weekEndDate, 'yyyy-MM-dd');
  
  const { data: logsData } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', weekStartStr)
    .lte('date', weekEndStr);

  // Calculate domain progress
  const domainProgress = calculateDomainProgress(
    protocol.recommendedActivities,
    (logsData || []).map(log => ({
      id: log.id,
      userId: log.user_id,
      activityDefinitionId: log.activity_definition_id,
      domain: log.domain as Domain,
      value: log.value || 0,
      unit: log.unit || 'min',
      date: log.date,
      createdAt: log.created_at,
    }))
  );

  return (
    <div className="min-h-screen flex flex-col relative pb-24">
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

      <header className="relative z-10 px-6 py-4 flex items-center justify-between">
        <SettingsButton 
          isAdmin={userProfile?.isAdmin} 
          unitSystem={userProfile?.unitSystem}
          glucoseUnit={userProfile?.glucoseUnit}
          lipidsUnit={userProfile?.lipidsUnit}
          coachingStyle={userProfile?.coachingStyle}
        />
        <span className="text-xl font-light tracking-tight text-foreground/60">eden</span>
        <YouButton />
      </header>

      <div className="relative z-10 px-6 pb-2">
        <Link 
          href="/chat"
          className="inline-flex items-center gap-1 text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to this week
        </Link>
      </div>

      <div className="relative z-10 px-6 pb-4">
        <h1 className="text-lg font-light text-foreground/80">My Protocol</h1>
        <p className="text-xs text-foreground/40">
          Week {currentWeekNumber} of 12 · {format(parseISO(protocol.startDate), 'MMM d')} – {format(parseISO(protocol.endDate), 'MMM d, yyyy')}
        </p>
      </div>

      <div className="relative z-10 flex-1">
        <ProtocolView 
          protocol={protocol}
          currentWeekNumber={currentWeekNumber}
          domainProgress={domainProgress}
        />
      </div>

      <div className="relative z-10 px-6 py-8 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground/50">Need a fresh start?</p>
            <p className="text-xs text-foreground/30">Regenerate your protocol based on updated goals</p>
          </div>
          <CreateProtocolButton mode="regenerate" />
        </div>
      </div>
    </div>
  );
}

function calculateDomainProgress(
  activities: RecommendedActivity[],
  logs: ActivityLog[]
): Record<Domain, { logged: number; target: number; unit: string }> {
  const result: Record<Domain, { logged: number; target: number; unit: string }> = {
    heart: { logged: 0, target: 0, unit: 'min' },
    frame: { logged: 0, target: 0, unit: 'sessions' },
    mind: { logged: 0, target: 0, unit: 'min' },
    metabolism: { logged: 0, target: 0, unit: 'days' },
    recovery: { logged: 0, target: 0, unit: 'hrs' },
  };

  for (const activity of activities) {
    if (activity.domain in result) {
      result[activity.domain].target += activity.targetValue;
      result[activity.domain].unit = activity.targetUnit;
    }
  }

  for (const log of logs) {
    if (log.domain in result) {
      result[log.domain].logged += log.value;
    }
  }

  return result;
}
