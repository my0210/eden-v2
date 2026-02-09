import { UserProfile, WeeklyPlan, Protocol, Domain, DOMAIN_LABELS } from '@/lib/types';
import { formatCatalogueForChat } from './activityCatalogue';
import { Pillar } from '@/lib/v3/coreFive';

// ============================================================================
// Coaching Style Guides (shared between system prompts)
// ============================================================================

const toneGuide = {
  supportive: 'Be warm, encouraging, and positive. Celebrate wins and frame challenges gently.',
  neutral: 'Be balanced and objective. State facts clearly without excessive praise or criticism.',
  tough: 'Be direct and challenging. Push for excellence and do not sugarcoat feedback.',
};

const densityGuide = {
  minimal: 'Be concise. Give the essential information only. No lengthy explanations unless asked.',
  balanced: 'Provide moderate detail. Explain reasoning briefly but do not overwhelm.',
  detailed: 'Be thorough. Explain the why behind recommendations. Include context and evidence.',
};

const formalityGuide = {
  casual: 'Use conversational language. Be friendly and approachable like a workout buddy.',
  professional: 'Be professional but personable. Like a respected personal trainer.',
  clinical: 'Use precise, clinical language. Like a sports medicine doctor.',
};

// ============================================================================
// Core Five Chat System Prompt (for agentic tool-calling)
// ============================================================================

/**
 * System prompt for Core Five agentic chat.
 * Claude uses native tool calling -- no JSON format instructions needed.
 */
export function getCoreFiveSystemPrompt(
  coachingStyle: UserProfile['coachingStyle'],
  patternSummary?: string,
  coreFiveContext?: string
): string {
  const patternBlock = patternSummary
    ? `\n\n## User Patterns (last 4 weeks)\n${patternSummary}\n\nUse these patterns to personalize your responses. Reference them when relevant.`
    : '';

  const contextBlock = coreFiveContext
    ? `\n\n## This Week's Progress\n${coreFiveContext}`
    : '';

  return `You are huuman — a health agent that helps users hit their Core Five targets each week.

## The Core Five

Users track five pillars weekly:
• Cardio: 150 min/week (Zone 2, walking, running, cycling, swimming)
• Strength: 3 sessions/week (gym, bodyweight, resistance training)
• Sleep: 49 hrs/week (7 hrs/night average)
• Clean Eating: 5 days on-plan/week (protein-forward, whole foods, minimal junk)
• Mindfulness: 60 min/week (breathwork, meditation, journaling)

When all 5 are met, the user is "in prime" for the week.

## Your Personality
${toneGuide[coachingStyle.tone]}
${densityGuide[coachingStyle.density]}
${formalityGuide[coachingStyle.formality]}

## Principles

1. WEEKLY RHYTHM: Think in weeks. A missed day is fine — what matters is the weekly target.
2. NO GUILT: Never shame users. A busy week is reality, not failure.
3. CONCISE: Keep responses short and actionable. No walls of text. No markdown formatting.
4. ACTION-ORIENTED: Use your tools to actually DO things, not just talk about them.

## Tool Usage

You have tools to take real actions. USE THEM proactively:

- When the user wants to log something → call log_activity immediately
- When you need to check progress → call get_weekly_progress
- When the user asks for a workout → call generate_workout with structured exercises
- When the user asks about food/groceries → call generate_grocery_list
- When the user needs a place → call find_nearby with a relevant search
- When the user wants breathwork/meditation → call start_timer
- When the user wants to scan a meal → call scan_meal

You can chain multiple tools in one turn. For example: check progress, then log an activity, then suggest what's next.

## Response Style

- Write in plain text, no markdown (no #, **, *, etc.)
- Keep responses to 2-4 sentences unless the user asks for detail
- Use "•" for lists if needed
- Be specific and personal, not generic${patternBlock}${contextBlock}`;
}

// ============================================================================
// Legacy Prompts (v2 features behind feature flag)
// ============================================================================

/**
 * Legacy system prompt for v2 plan generation.
 */
export function getSystemPrompt(profile: UserProfile, protocol?: Protocol | null): string {
  const { coachingStyle } = profile;

  const activityReference = formatCatalogueForChat();
  const protocolContext = protocol ? formatProtocolContext(protocol) : '';

  return `You are Huuman, an AI longevity coach who combines evidence-based medicine with personalized coaching.

## Your Personality
${toneGuide[coachingStyle.tone]}
${densityGuide[coachingStyle.density]}
${formalityGuide[coachingStyle.formality]}

## The 5 Primespan Domains

All users should make progress across all five domains for optimal healthspan:
- **HEART**: Cardiovascular system - VO2max, aerobic capacity, cardiac efficiency
- **FRAME**: Musculoskeletal system - strength, body composition, mobility, structural health
- **MIND**: Cognitive system - attention, focus, mental practices, stress & emotional health, social connection
- **METABOLISM**: Metabolic system - glucose regulation, energy, nutrition, hormonal health
- **RECOVERY**: Restorative system - sleep, HRV, autonomic recovery, stress recovery

## Activity Tiering

When discussing activities, reference tiers to help users prioritize:
- **Tier 0 (Foundational)**: Highest leverage. If weak, everything underperforms. Non-negotiables.
- **Tier 1 (High ROI)**: Large gains with manageable friction. Add after Tier 0 is stable.
- **Tier 2 (Situational)**: Useful for specific contexts or goals. Not required for most users.

${activityReference}

${protocolContext}`;
}

/**
 * Prompt for generating weekly plans based on protocol
 */
export function getPlanGenerationPrompt(
  profile: UserProfile,
  weekStartDate: string,
  protocol?: Protocol | null,
  previousWeekContext?: string,
  startFromDay?: number
): string {
  const constraintsDesc = formatConstraints(profile.constraints);
  const goalsDesc = formatGoals(profile.goals);
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const startDayName = startFromDay !== undefined ? dayNames[startFromDay] : 'Monday';
  const startDayInstruction = startFromDay !== undefined 
    ? `\n\nIMPORTANT: Today is ${startDayName}. Only create items for ${startDayName} and the remaining days of this week. Do NOT create items for days that have already passed.`
    : '';

  const protocolGuidance = protocol ? formatProtocolForPlanGeneration(protocol) : '';

  return `Generate a personalized weekly health plan for this user.

## User Profile
Goals: ${goalsDesc}
Fitness Level: ${profile.currentFitnessLevel}
${constraintsDesc}

## Week Starting: ${weekStartDate}${startDayInstruction}

${protocolGuidance}

${previousWeekContext ? `## Previous Week Context\n${previousWeekContext}\n` : ''}

## Requirements
1. Create items across ALL 5 domains (Heart, Frame, Recovery, Metabolism, Mind)
2. Respect ALL user constraints - schedule, equipment, capacity limits
3. Each item MUST include:
   - personalizationContext: A brief note showing why this is personalized
   - reasoning: Detailed explanation for "Why?" button
4. Prioritize items appropriately - mark the most important ones
5. Write a huumanIntro that references specific things you considered

## Response Format (JSON)
{
  "huumanIntro": "Personalized week introduction referencing their specific situation",
  "domainIntros": {
    "heart": "...",
    "frame": "...",
    "recovery": "...",
    "metabolism": "...",
    "mind": "..."
  },
  "items": [
    {
      "domain": "heart|frame|recovery|metabolism|mind",
      "dayOfWeek": 0-6,
      "title": "Brief actionable title",
      "durationMinutes": number or null,
      "personalizationContext": "Why this is tailored to them",
      "reasoning": "Detailed explanation for the Why button",
      "sortOrder": number
    }
  ]
}

## Domain Intro Guidelines
Each domainIntro should be 2-4 sentences that explain what you're focusing on and why.
Only include domainIntros for domains that have items this week.`;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatConstraints(constraints: UserProfile['constraints']): string {
  const lines: string[] = ['## Constraints'];
  
  lines.push(`Work Schedule: ${constraints.schedule.workHours}`);
  lines.push(`Preferred Workout Times: ${constraints.schedule.preferredWorkoutTimes.join(', ')}`);
  
  if (constraints.schedule.blockedTimes.length > 0) {
    lines.push('Blocked Times:');
    constraints.schedule.blockedTimes.forEach(bt => {
      lines.push(`  - ${bt.day}: ${bt.time} (${bt.reason})`);
    });
  }

  lines.push(`Gym Access: ${constraints.equipment.gymAccess ? 'Yes' : 'No'}`);
  if (constraints.equipment.homeEquipment.length > 0) {
    lines.push(`Home Equipment: ${constraints.equipment.homeEquipment.join(', ')}`);
  }
  lines.push(`Outdoor Access: ${constraints.equipment.outdoorAccess ? 'Yes' : 'No'}`);

  if (constraints.limitations.injuries.length > 0) {
    lines.push(`Injuries/Limitations: ${constraints.limitations.injuries.join(', ')}`);
  }

  lines.push(`Max Workout Days: ${constraints.capacity.maxWorkoutDays}/week`);
  lines.push(`Max Daily Health Time: ${constraints.capacity.maxDailyHealthMinutes} minutes`);

  return lines.join('\n');
}

function formatGoals(goals: UserProfile['goals']): string {
  const lines: string[] = [];
  
  lines.push(`Primary Goals: ${goals.primary.join(', ')}`);
  lines.push(`What "being in prime" means: ${goals.primeSpanMeaning}`);
  
  if (goals.specificTargets && goals.specificTargets.length > 0) {
    lines.push('Specific Targets:');
    goals.specificTargets.forEach(t => {
      lines.push(`  - ${DOMAIN_LABELS[t.domain]}: ${t.target}`);
    });
  }

  return lines.join('\n');
}

function formatProtocolContext(protocol: Protocol): string {
  const lines: string[] = ['## User\'s Current Protocol'];
  
  lines.push(`Goal: ${protocol.goalSummary}`);
  
  if (protocol.narrative) {
    lines.push(`\nWhy: ${protocol.narrative.why}`);
    lines.push(`Approach: ${protocol.narrative.approach}`);
  }
  
  if (protocol.recommendedActivities && protocol.recommendedActivities.length > 0) {
    lines.push('\nRecommended Activities:');
    protocol.recommendedActivities.forEach(ra => {
      lines.push(`  - ${ra.activityId}: ${ra.weeklyTarget}`);
    });
  }
  
  return lines.join('\n');
}

function formatProtocolForPlanGeneration(protocol: Protocol): string {
  const lines: string[] = ['## Active Protocol Guidance'];
  
  lines.push(`Goal: ${protocol.goalSummary}`);
  
  if (protocol.recommendedActivities && protocol.recommendedActivities.length > 0) {
    lines.push('\nActivities to Track:');
    protocol.recommendedActivities.forEach(ra => {
      lines.push(`  - ${ra.activityId} (${ra.domain}): ${ra.weeklyTarget}`);
      if (ra.personalization) {
        lines.push(`    Personalization: ${ra.personalization}`);
      }
    });
  }
  
  return lines.join('\n');
}
