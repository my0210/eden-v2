/**
 * Eden Message Generation
 * 
 * Generates contextual, personalized messages based on:
 * - Protocol context (current phase, week focus)
 * - Activity progress (what's been logged vs planned)
 * - User patterns (consistency, gaps)
 */

import { Protocol, Domain, DOMAIN_LABELS, DOMAIN_EMOJI } from '@/lib/types';

// ============================================================================
// Types
// ============================================================================

interface DomainProgress {
  domain: Domain;
  logged: number;
  target: number;
  unit: string;
  count: { logged: number; target: number };
}

interface MessageContext {
  protocol?: Protocol;
  currentWeekNumber?: number;
  dayOfWeek: number;
  domainProgress: Record<Domain, DomainProgress>;
  daysSinceLastOpen?: number;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
}

// ============================================================================
// Main Message Generator
// ============================================================================

export function generateWeeklyMessage(context: MessageContext): string {
  const { 
    protocol, 
    currentWeekNumber = 1, 
    dayOfWeek, 
    domainProgress, 
    daysSinceLastOpen = 0,
    timeOfDay = 'morning'
  } = context;

  // Welcome back after absence
  if (daysSinceLastOpen >= 3) {
    return generateWelcomeBackMessage(protocol, currentWeekNumber);
  }

  // Check overall progress
  const progressSummary = calculateProgressSummary(domainProgress);

  // Rest day (Sunday)
  if (dayOfWeek === 0) {
    return generateRestDayMessage(progressSummary, protocol, currentWeekNumber);
  }

  // Mid-week check-in (Wednesday/Thursday)
  if (dayOfWeek === 3 || dayOfWeek === 4) {
    return generateMidWeekMessage(progressSummary, domainProgress, currentWeekNumber);
  }

  // End of week (Friday/Saturday)
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    return generateEndOfWeekMessage(progressSummary, domainProgress, currentWeekNumber);
  }

  // Start of week (Monday/Tuesday)
  return generateStartOfWeekMessage(protocol, currentWeekNumber, timeOfDay);
}

// ============================================================================
// Specialized Message Generators
// ============================================================================

function generateWelcomeBackMessage(protocol: Protocol | undefined, weekNumber: number): string {
  if (protocol) {
    const phase = protocol.phases?.find(p => weekNumber >= p.weeks[0] && weekNumber <= p.weeks[1]);
    const phaseName = phase?.name || '';
    return `Week ${weekNumber}${phaseName ? ` · ${phaseName}` : ''} · Welcome back. Let's pick up where you left off.`;
  }
  return `Welcome back. Ready to continue building your health?`;
}

function generateRestDayMessage(
  summary: ProgressSummary, 
  protocol: Protocol | undefined,
  weekNumber: number
): string {
  if (summary.overallPercent >= 80) {
    return `Week ${weekNumber} · Rest day. Strong week so far—recovery is where adaptation happens.`;
  }
  if (summary.overallPercent >= 50) {
    return `Week ${weekNumber} · Rest day. Solid progress this week. Recover well.`;
  }
  return `Week ${weekNumber} · Rest day. Recovery is part of the protocol.`;
}

function generateMidWeekMessage(
  summary: ProgressSummary,
  domainProgress: Record<Domain, DomainProgress>,
  weekNumber: number
): string {
  // Find the domain that needs attention
  const gaps = findProgressGaps(domainProgress);
  const wins = findProgressWins(domainProgress);

  if (wins.length > 0 && gaps.length > 0) {
    const winDomain = wins[0];
    const gapDomain = gaps[0];
    return `${winDomain.emoji} is clicking—${formatProgressShort(winDomain)}. ${gapDomain.emoji} needs attention this week.`;
  }

  if (summary.overallPercent >= 70) {
    return `Week ${weekNumber} · Strong momentum. Keep building.`;
  }

  if (summary.overallPercent < 30) {
    return `Week ${weekNumber} · A few activities left. Small wins still count.`;
  }

  return `Week ${weekNumber} · Halfway through. What's the priority for today?`;
}

function generateEndOfWeekMessage(
  summary: ProgressSummary,
  domainProgress: Record<Domain, DomainProgress>,
  weekNumber: number
): string {
  if (summary.overallPercent >= 90) {
    return `Week ${weekNumber} · Crushing it. All domains on track—this is how real change happens.`;
  }

  if (summary.overallPercent >= 70) {
    return `Week ${weekNumber} · Strong week. A few activities left to close it out.`;
  }

  const gaps = findProgressGaps(domainProgress);
  if (gaps.length > 0) {
    const topGap = gaps[0];
    return `Week ${weekNumber} · ${topGap.emoji} is behind (${formatProgressShort(topGap)}). A session today can catch you up.`;
  }

  return `Week ${weekNumber} · End of week approaching. How can you finish strong?`;
}

function generateStartOfWeekMessage(
  protocol: Protocol | undefined,
  weekNumber: number,
  timeOfDay: string
): string {
  if (protocol) {
    const week = protocol.weeks.find(w => w.weekNumber === weekNumber);
    const theme = week?.theme || week?.focus || '';
    const phase = protocol.phases?.find(p => weekNumber >= p.weeks[0] && weekNumber <= p.weeks[1]);
    
    if (week?.intensityLevel === 'deload') {
      return `Week ${weekNumber} · Deload week. Lighter intensity to let your body adapt.`;
    }

    if (theme) {
      return `Week ${weekNumber}${phase ? ` · ${phase.name}` : ''} · ${theme}.`;
    }
  }

  const greetings: Record<string, string> = {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
  };

  return `${greetings[timeOfDay]}. Week ${weekNumber} begins—what's the focus today?`;
}

// ============================================================================
// Helper Functions
// ============================================================================

interface ProgressSummary {
  overallPercent: number;
  totalLogged: number;
  totalTarget: number;
  domainsOnTrack: number;
  domainsTotal: number;
}

function calculateProgressSummary(domainProgress: Record<Domain, DomainProgress>): ProgressSummary {
  let totalLogged = 0;
  let totalTarget = 0;
  let domainsOnTrack = 0;

  const domains = Object.values(domainProgress);
  
  for (const dp of domains) {
    totalLogged += dp.count.logged;
    totalTarget += dp.count.target;
    
    const percent = dp.count.target > 0 
      ? (dp.count.logged / dp.count.target) * 100 
      : 0;
    
    if (percent >= 70) {
      domainsOnTrack++;
    }
  }

  const overallPercent = totalTarget > 0 
    ? Math.round((totalLogged / totalTarget) * 100) 
    : 0;

  return {
    overallPercent,
    totalLogged,
    totalTarget,
    domainsOnTrack,
    domainsTotal: domains.length,
  };
}

interface DomainGap {
  domain: Domain;
  emoji: string;
  label: string;
  logged: number;
  target: number;
  percent: number;
  unit: string;
}

function findProgressGaps(domainProgress: Record<Domain, DomainProgress>): DomainGap[] {
  const gaps: DomainGap[] = [];

  for (const [domain, dp] of Object.entries(domainProgress)) {
    const d = domain as Domain;
    const percent = dp.count.target > 0 
      ? (dp.count.logged / dp.count.target) * 100 
      : 100;
    
    if (percent < 50 && dp.count.target > 0) {
      gaps.push({
        domain: d,
        emoji: DOMAIN_EMOJI[d],
        label: DOMAIN_LABELS[d],
        logged: dp.count.logged,
        target: dp.count.target,
        percent,
        unit: dp.unit,
      });
    }
  }

  // Sort by lowest percent first
  return gaps.sort((a, b) => a.percent - b.percent);
}

function findProgressWins(domainProgress: Record<Domain, DomainProgress>): DomainGap[] {
  const wins: DomainGap[] = [];

  for (const [domain, dp] of Object.entries(domainProgress)) {
    const d = domain as Domain;
    const percent = dp.count.target > 0 
      ? (dp.count.logged / dp.count.target) * 100 
      : 0;
    
    if (percent >= 70 && dp.count.logged > 0) {
      wins.push({
        domain: d,
        emoji: DOMAIN_EMOJI[d],
        label: DOMAIN_LABELS[d],
        logged: dp.count.logged,
        target: dp.count.target,
        percent,
        unit: dp.unit,
      });
    }
  }

  // Sort by highest percent first
  return wins.sort((a, b) => b.percent - a.percent);
}

function formatProgressShort(gap: DomainGap): string {
  if (gap.unit === 'min' || gap.unit === 'minutes') {
    return `${gap.logged}/${gap.target}m`;
  }
  return `${gap.logged}/${gap.target}`;
}

// ============================================================================
// Domain-Specific Messages
// ============================================================================

export function generateDomainMessage(
  domain: Domain,
  progress: DomainProgress
): string {
  const emoji = DOMAIN_EMOJI[domain];
  const percent = progress.target > 0 
    ? Math.round((progress.logged / progress.target) * 100)
    : 0;

  if (percent >= 100) {
    return `${emoji} Target hit! Great work this week.`;
  }

  if (percent >= 75) {
    return `${emoji} Almost there—one more session to hit your target.`;
  }

  if (percent >= 50) {
    return `${emoji} Halfway. Keep the momentum going.`;
  }

  if (percent > 0) {
    return `${emoji} Off to a start. ${progress.target - progress.count.logged} more to go.`;
  }

  return `${emoji} ${progress.count.target} activities planned this week.`;
}
