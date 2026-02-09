/**
 * Nudge Engine: evaluates Core Five state + time of day to generate 
 * contextual, proactive suggestions when the user opens the app.
 */

import { CoreFiveLog, Pillar, PILLARS, PILLAR_CONFIGS, getPillarProgress, getPrimeCoverage } from './coreFive';

export interface Nudge {
  id: string;
  message: string;
  pillar?: Pillar;
  action?: 'timer' | 'scan' | 'log' | 'chat';
  actionLabel?: string;
  priority: number; // lower = higher priority
}

function getHour(): number {
  return new Date().getHours();
}

function getDayOfWeek(): number {
  return new Date().getDay(); // 0=Sun, 6=Sat
}

function getDaysLeftInWeek(): number {
  const dow = getDayOfWeek();
  // Week starts Monday (1). Days left including today:
  // Mon=7, Tue=6, Wed=5, Thu=4, Fri=3, Sat=2, Sun=1
  if (dow === 0) return 1; // Sunday
  return 8 - dow;
}

/**
 * Generate nudges based on current Core Five progress and time context.
 * Returns 0-1 nudges (the highest priority one).
 */
export function generateNudge(logs: CoreFiveLog[]): Nudge | null {
  const nudges: Nudge[] = [];
  const hour = getHour();
  const daysLeft = getDaysLeftInWeek();
  const coverage = getPrimeCoverage(logs);

  // === Time-based nudges ===

  // Morning: suggest logging sleep if not logged today
  if (hour >= 6 && hour < 11) {
    const sleepProgress = getPillarProgress(logs, 'sleep');
    const today = new Date().toISOString().split('T')[0];
    const loggedSleepToday = logs.some(
      l => l.pillar === 'sleep' && l.loggedAt.startsWith(today)
    );

    if (!loggedSleepToday && sleepProgress < PILLAR_CONFIGS.sleep.weeklyTarget) {
      nudges.push({
        id: 'morning-sleep',
        message: "Good morning. How did you sleep?",
        pillar: 'sleep',
        action: 'log',
        actionLabel: 'Log sleep',
        priority: 1,
      });
    }
  }

  // Lunch time: suggest meal scan
  if (hour >= 11 && hour < 14) {
    const cleanEating = getPillarProgress(logs, 'clean_eating');
    if (cleanEating < PILLAR_CONFIGS.clean_eating.weeklyTarget) {
      nudges.push({
        id: 'lunch-scan',
        message: "Lunchtime. Snap your plate to log clean eating.",
        pillar: 'clean_eating',
        action: 'scan',
        actionLabel: 'Scan meal',
        priority: 3,
      });
    }
  }

  // Evening: suggest breathwork if mindfulness is lagging
  if (hour >= 18 && hour < 22) {
    const mindfulness = getPillarProgress(logs, 'mindfulness');
    if (mindfulness < PILLAR_CONFIGS.mindfulness.weeklyTarget) {
      nudges.push({
        id: 'evening-breathwork',
        message: "Wind down with some breathwork before bed.",
        pillar: 'mindfulness',
        action: 'timer',
        actionLabel: 'Start breathwork',
        priority: 4,
      });
    }
  }

  // === Progress-based nudges ===

  // Almost there: 4/5 pillars met
  if (coverage === 4) {
    const missingPillar = PILLARS.find(
      p => getPillarProgress(logs, p) < PILLAR_CONFIGS[p].weeklyTarget
    );
    if (missingPillar) {
      const config = PILLAR_CONFIGS[missingPillar];
      const current = getPillarProgress(logs, missingPillar);
      const remaining = config.weeklyTarget - current;
      nudges.push({
        id: 'almost-prime',
        message: `4/5 pillars hit! Just ${remaining} ${config.unit} of ${config.name.toLowerCase()} to go.`,
        pillar: missingPillar,
        action: 'chat',
        actionLabel: 'Help me plan',
        priority: 0, // highest priority
      });
    }
  }

  // Mid-week check: if it's Wednesday+ and a pillar is at 0
  if (daysLeft <= 5 && daysLeft >= 2) {
    for (const pillar of PILLARS) {
      const progress = getPillarProgress(logs, pillar);
      if (progress === 0) {
        const config = PILLAR_CONFIGS[pillar];
        nudges.push({
          id: `zero-${pillar}`,
          message: `${config.name} is at 0 this week with ${daysLeft} days left.`,
          pillar,
          action: 'chat',
          actionLabel: `Plan ${config.name.toLowerCase()}`,
          priority: 2,
        });
        break; // Only show one zero-pillar nudge
      }
    }
  }

  // Cardio gap alert: if it's late in the week and cardio is significantly behind
  if (daysLeft <= 3) {
    const cardio = getPillarProgress(logs, 'cardio');
    const remaining = PILLAR_CONFIGS.cardio.weeklyTarget - cardio;
    if (remaining > 60) {
      nudges.push({
        id: 'cardio-gap',
        message: `${remaining} min of cardio left with ${daysLeft} days to go. Want me to plan it out?`,
        pillar: 'cardio',
        action: 'chat',
        actionLabel: 'Plan cardio',
        priority: 2,
      });
    }
  }

  // All 5 met! Celebrate.
  if (coverage === 5) {
    nudges.push({
      id: 'all-met',
      message: "All 5 pillars hit this week. You're in prime.",
      priority: 0,
    });
  }

  // Weekly review: Sunday evening or Monday morning
  const dow = getDayOfWeek();
  if ((dow === 0 && hour >= 17) || (dow === 1 && hour < 12)) {
    nudges.push({
      id: 'weekly-review',
      message: `Week ${dow === 0 ? 'wrapping up' : 'starting fresh'}. ${coverage}/5 pillars ${dow === 0 ? 'hit' : 'were hit last week'}. Want a review?`,
      action: 'chat',
      actionLabel: 'How was my week?',
      priority: 1,
    });
  }

  // Sort by priority and return the top one
  if (nudges.length === 0) return null;
  nudges.sort((a, b) => a.priority - b.priority);
  return nudges[0];
}
