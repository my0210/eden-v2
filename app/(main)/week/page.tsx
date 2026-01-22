import { createClient } from '@/lib/supabase/server';
import { startOfWeek, endOfWeek, format, parseISO, differenceInWeeks } from 'date-fns';
import { WeeklyDomainView } from '@/components/WeeklyDomainView';
import { ChatOverlay } from '@/components/ChatOverlay';
import { EdenHeader } from '@/components/EdenHeader';
import { SettingsButton } from '@/components/SettingsButton';
import { YouButton } from '@/components/YouButton';
import { 
  UserProfile, 
  Domain, 
  Protocol, 
  ProtocolNarrative, 
  RecommendedActivity,
  ProtocolWeek,
  ActivityLog
} from '@/lib/types';
import { generateEdenMessage } from '@/lib/ai/protocolGeneration';

export default async function WeekPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  // Fetch user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch active protocol
  const { data: protocolData } = await supabase
    .from('protocols')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  // Fetch activity logs for this week
  const { data: logsData } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', weekStartStr)
    .lte('date', weekEndStr)
    .order('created_at', { ascending: false });

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

  // Transform protocol data
  const protocol: Protocol | null = protocolData ? {
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
  } : null;

  // Transform activity logs
  const activityLogs: ActivityLog[] = (logsData || []).map(log => ({
    id: log.id,
    userId: log.user_id,
    activityDefinitionId: log.activity_definition_id,
    domain: log.domain as Domain,
    activityType: log.activity_type,
    value: log.value,
    unit: log.unit,
    date: log.date,
    notes: log.notes,
    createdAt: log.created_at,
  }));

  // Calculate current week number for protocol
  let currentWeekNumber = 1;
  if (protocol) {
    const protocolStart = startOfWeek(parseISO(protocol.startDate), { weekStartsOn: 1 });
    const weeksSinceStart = differenceInWeeks(weekStart, protocolStart);
    currentWeekNumber = Math.min(Math.max(weeksSinceStart + 1, 1), 12);
  }

  // Calculate adherence (percentage of target achieved)
  const adherencePercent = calculateAdherence(protocol?.recommendedActivities || [], activityLogs);

  // Generate dynamic Eden message
  const edenMessage = protocol 
    ? generateEdenMessage(protocol, currentWeekNumber, adherencePercent, 0)
    : "Welcome to Eden. Create your protocol to get started.";

  return (
    <div className="min-h-screen flex flex-col relative pb-24">
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

      {/* Eden Header - Dynamic message + Protocol link */}
      <div className="relative z-10 pt-2">
        <EdenHeader 
          message={edenMessage}
          showProtocolLink={!!protocol}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 px-6 py-6">
        {protocol ? (
          <WeeklyDomainView
            recommendedActivities={protocol.recommendedActivities}
            activityLogs={activityLogs}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Chat FAB */}
      <div className="fixed bottom-6 right-6 z-50 safe-area-bottom">
        <ChatOverlay 
          trigger={
            <button className="
              w-14 h-14 rounded-full
              bg-green-500/20 border border-green-500/30
              text-green-400
              hover:bg-green-500/30 hover:border-green-500/40 hover:scale-105
              active:scale-95
              transition-all duration-300
              flex items-center justify-center
              shadow-lg shadow-green-500/10
              backdrop-blur-sm
            ">
              <svg 
                className="w-6 h-6" 
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
    </div>
  );
}

// Empty state when no protocol exists
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-green-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h2 className="text-lg font-medium text-foreground/70 mb-2">No Protocol Yet</h2>
      <p className="text-sm text-foreground/40 mb-6 max-w-xs">
        Create your personalized 12-week protocol to start tracking activities.
      </p>
      <a
        href="/protocol"
        className="px-6 py-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-medium hover:bg-green-500/30 transition-all"
      >
        Create Protocol
      </a>
    </div>
  );
}

// Calculate overall adherence percentage
function calculateAdherence(
  activities: RecommendedActivity[],
  logs: ActivityLog[]
): number {
  if (activities.length === 0) return 0;
  
  let totalTarget = 0;
  let totalLogged = 0;
  
  // Sum targets by domain
  const targetsByDomain: Record<string, number> = {};
  for (const activity of activities) {
    targetsByDomain[activity.domain] = (targetsByDomain[activity.domain] || 0) + activity.targetValue;
    totalTarget += activity.targetValue;
  }
  
  // Sum logged by domain
  for (const log of logs) {
    totalLogged += log.value;
  }
  
  if (totalTarget === 0) return 0;
  return Math.min(Math.round((totalLogged / totalTarget) * 100), 100);
}
