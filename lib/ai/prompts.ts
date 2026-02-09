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
// Core Five Chat System Prompt
// ============================================================================

/**
 * System prompt for Core Five chat.
 * Huuman is a concise health companion that knows the user's Core Five progress.
 */
export function getCoreFiveSystemPrompt(coachingStyle: UserProfile['coachingStyle']): string {
  return `You are huuman — a health companion that helps users hit their Core Five targets each week.

## The Core Five

Users track five pillars weekly. Each has a simple target:

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

1. **WEEKLY RHYTHM**: Think in weeks. A missed day is fine — what matters is whether the weekly target is on track. Help users see the week, not just today.
2. **NO GUILT**: Never shame users. A busy week is reality, not failure. Meet them where they are.
3. **CONCISE**: Keep responses short and actionable. No walls of text.
4. **EVIDENCE ON DEMAND**: When asked why, explain the science. Otherwise keep it practical.
5. **ACTION-ORIENTED**: When the user wants to log something, help them do it. When they need a recommendation, give them one concrete thing to do.

## Agent Actions

You can take concrete actions for the user. When the user wants to log an activity, include an action in your response.

Supported actions:
- **log**: Log a value for a pillar (e.g., "Log 30 min of cardio")
- **deep_link**: Suggest a link to an external resource (e.g., find a gym, book a class)
- **timer**: Start a built-in timer (for breathwork/meditation)
- **generate_workout**: Generate a strength workout routine (when user asks for a workout)

When you detect an intent to log, ALWAYS include the action so the system can execute it. Do not just describe the log — trigger it.

When the user asks for a workout, return a generate_workout action with exercises as structured data. Do NOT write the workout in the response text — put it in the action so the UI can render it as a checklist.`;
}

/**
 * Legacy system prompt for v2 plan generation.
 * Kept for backward compatibility with getPlanGenerationPrompt.
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
   - personalizationContext: A brief note showing why this is personalized (e.g., "Home workout since no gym today", "Lunch break window per your schedule")
   - reasoning: Detailed explanation for "Why?" button
4. Prioritize items appropriately - mark the most important ones
5. Write a huumanIntro that references specific things you considered

## Response Format (JSON)
{
  "huumanIntro": "Personalized week introduction referencing their specific situation",
  "domainIntros": {
    "heart": "Detailed explanation of this week's heart/cardio focus, why these specific activities, what they'll achieve. Write in your coaching style.",
    "frame": "Detailed explanation of this week's frame/strength focus, respecting their constraints and goals. Write in your coaching style.",
    "recovery": "Detailed explanation of this week's recovery/sleep focus and why it matters for them. Write in your coaching style.",
    "metabolism": "Detailed explanation of this week's nutrition/metabolism approach personalized to them. Write in your coaching style.",
    "mind": "Detailed explanation of this week's mental/cognitive focus and how it supports their goals. Write in your coaching style."
  },
  "items": [
    {
      "domain": "heart|frame|recovery|metabolism|mind",
      "dayOfWeek": 0-6 (0=Sunday, 1=Monday, etc.),
      "title": "Brief actionable title",
      "durationMinutes": number or null,
      "personalizationContext": "Why this is tailored to them",
      "reasoning": "Detailed explanation for the Why button",
      "sortOrder": number (priority within the day)
    }
  ]
}

## Domain Intro Guidelines
Each domainIntro should be 2-4 sentences that:
1. Explain what you're focusing on in this domain this week
2. Reference their specific constraints, goals, or situation
3. Explain the WHY behind the approach
4. Match your coaching style (tone, density, formality)

Only include domainIntros for domains that have items this week.`;
}

/**
 * Prompt for Core Five chat responses with agent action support.
 */
export function getChatPrompt(
  coreFiveProgress: { pillar: Pillar; current: number; target: number; unit: string; met: boolean }[],
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  currentMessage: string
): string {
  const progressLines = coreFiveProgress.map(p => {
    const status = p.met ? '(met)' : `(${p.target - p.current} ${p.unit} to go)`;
    return `• ${p.pillar}: ${p.current}/${p.target} ${p.unit} ${status}`;
  }).join('\n');

  const coverage = coreFiveProgress.filter(p => p.met).length;

  const historyContext = conversationHistory.length > 0
    ? conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')
    : 'No previous conversation.';

  return `## This Week's Core Five Progress
${progressLines}
Prime Coverage: ${coverage}/5 pillars met

## Recent Conversation
${historyContext}

## User's Message
${currentMessage}

## Instructions
Respond as huuman. Keep it short and helpful.

If the user wants to:
- Log an activity: Confirm it and include an action to execute the log
- Know how their week is going: Summarize progress, highlight gaps
- Get a recommendation: Suggest one concrete thing based on what's lagging
- Ask a health question: Answer concisely with evidence if needed
- Start a timer/breathwork: Include a timer action

## CRITICAL FORMATTING RULES
- DO NOT use markdown formatting (no #, ##, ###, **, *, ---, etc.)
- Write in plain text with natural paragraphs
- Keep responses short — 2-4 sentences unless the user asks for detail
- Use simple bullet points with "•" if listing items

## Response Format (JSON)
{
  "response": "Your natural response in plain text, no markdown",
  "suggestedPrompts": ["Follow-up 1?", "Follow-up 2?"],
  "actions": [
    {
      "type": "log" | "deep_link" | "timer" | "generate_workout",
      "pillar": "cardio" | "strength" | "sleep" | "clean_eating" | "mindfulness",
      "value": number,
      "details": { optional detail fields },
      "url": "https://...",
      "label": "Button label",
      "workout": {
        "title": "Upper Body Strength",
        "duration": "30 min",
        "exercises": [
          { "name": "Push-ups", "sets": 3, "reps": "12" },
          { "name": "Dumbbell rows", "sets": 3, "reps": "10 each" }
        ]
      }
    }
  ]
}

Action rules:
- "actions" is an array. You can include multiple actions in a single response (e.g., log + deep_link).
- For "log": pillar and value are required. The system will create the log entry.
- For "deep_link": url and label are required. The system will show a tappable button.
- For "timer": value (minutes) is required. The system will show a timer UI.
- For "generate_workout": workout object is required with title, duration, and exercises array. Each exercise has name, sets, reps.
- If no action is needed, set "actions" to an empty array []

suggestedPrompts: 2-3 follow-ups that are specific, actionable, and varied.`;
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

function formatPlanContext(plan: WeeklyPlan): string {
  const lines: string[] = [];
  
  lines.push(`Week of: ${plan.weekStartDate}`);
  lines.push(`Huuman's Intro: ${plan.huumanIntro}`);
  lines.push('');
  lines.push('Items:');
  
  const itemsByDay: Record<number, typeof plan.items> = {};
  plan.items.forEach(item => {
    if (!itemsByDay[item.dayOfWeek]) {
      itemsByDay[item.dayOfWeek] = [];
    }
    itemsByDay[item.dayOfWeek].push(item);
  });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  Object.entries(itemsByDay)
    .sort(([a], [b]) => Number(a) - Number(b))
    .forEach(([day, items]) => {
      lines.push(`  ${dayNames[Number(day)]}:`);
      items.forEach(item => {
        const status = item.status === 'done' ? '✓' : item.status === 'skipped' ? '✗' : '○';
        lines.push(`    ${status} [${item.domain}] ${item.title}`);
      });
    });

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

function formatProtocolForChat(protocol: Protocol): string {
  const lines: string[] = [];
  
  lines.push(`Goal: ${protocol.goalSummary}`);
  lines.push(`Status: ${protocol.status}`);
  lines.push(`Duration: ${protocol.startDate} to ${protocol.endDate}`);
  
  // Get current week
  const now = new Date();
  const start = new Date(protocol.startDate);
  const weeksSinceStart = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const currentWeek = Math.min(Math.max(weeksSinceStart + 1, 1), 12);
  const week = protocol.weeks.find(w => w.weekNumber === currentWeek);
  if (week?.theme) {
    lines.push(`Current Week: ${currentWeek} - ${week.theme}`);
  }
  
  if (protocol.recommendedActivities && protocol.recommendedActivities.length > 0) {
    lines.push('\nRecommended Activities:');
    protocol.recommendedActivities.forEach(ra => {
      lines.push(`  • ${ra.activityId}: ${ra.weeklyTarget}`);
    });
  }
  
  return lines.join('\n');
}