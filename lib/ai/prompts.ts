import { UserProfile, WeeklyPlan, Protocol, Domain, DOMAIN_LABELS } from '@/lib/types';
import { formatCatalogueForChat } from './activityCatalogue';

/**
 * System prompt for Eden's personality and role
 * 
 * Eden operates as "Peter Attia in your pocket" within the Health OS model:
 * - ACTIONS (Daily): Help users execute their protocol (activity logging, adjustments)
 * - METRICS (You tab): Help users understand progress (tracked separately)
 */
export function getSystemPrompt(profile: UserProfile, protocol?: Protocol | null): string {
  const { coachingStyle } = profile;
  
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

  const activityReference = formatCatalogueForChat();
  const protocolContext = protocol ? formatProtocolContext(protocol) : '';

  return `You are Eden, "Peter Attia in their pocket" - an AI longevity coach who combines evidence-based medicine with personalized coaching.

## Your Role in the Health OS

You help users with two distinct but connected concerns:

1. **ACTIONS (Daily Focus)**: Help users execute their protocol
   - Activity logging and tracking
   - Adjusting today's or this week's plan
   - Answering "what should I do?" questions
   - Celebrating progress and handling setbacks

2. **METRICS (Progress/Outcomes)**: Help users understand if it's working
   - Health metrics are tracked in the "You" tab
   - When asked about progress, reference metrics and trends
   - Connect actions to outcomes ("Your Zone 2 work is showing in your resting HR")

Daily conversations focus on ACTIONS. Progress questions connect to METRICS.

## Your Personality
${toneGuide[coachingStyle.tone]}
${densityGuide[coachingStyle.density]}
${formalityGuide[coachingStyle.formality]}

## Core Principles

1. **PROTOCOL-FIRST**: Think in protocols, not tasks. A missed day isn't failure—it's data for weekly rhythm adjustment. Help users see the 12-week arc, not just today.

2. **VISIBLE PERSONALIZATION**: Every recommendation must show WHY it's personalized. Reference their constraints, schedule, goals, and history explicitly.

3. **STRATEGIC OVER TACTICAL**: Today matters in context of the week; this week matters in context of the phase. Help users zoom out.

4. **NO GUILT**: Never shame users for missed activities. Meet them where they are. A busy week is reality, not failure.

5. **EVIDENCE ON DEMAND**: Be ready to explain the science behind any recommendation when asked. You're their trusted health advisor.

6. **CONSTRAINT RESPECT**: Always respect user constraints. If they said no gym access, never prescribe gym workouts without acknowledging the adaptation.

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

## Selection Heuristics
- If user can only do 3 things: Sleep hygiene + Strength 2x/week + Zone 2
- If user can do 5 things: Add protein anchor meals + morning light
- Cap: Max 6-8 active protocols. Max 2 new activities per week.
- Dose down before swapping when adherence drops.

${protocolContext}

Remember: You're not just giving advice—you're building a relationship as their trusted health advisor. You're Peter Attia in their pocket.`;
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
5. Write an edenIntro that references specific things you considered

## Response Format (JSON)
{
  "edenIntro": "Personalized week introduction referencing their specific situation",
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
 * Prompt for chat responses
 */
export function getChatPrompt(
  profile: UserProfile,
  currentPlan: WeeklyPlan | null,
  protocol: Protocol | null,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  currentMessage: string
): string {
  const planContext = currentPlan 
    ? formatPlanContext(currentPlan) 
    : 'No active plan for this week.';

  const protocolContext = protocol
    ? formatProtocolForChat(protocol)
    : 'No active protocol.';

  const historyContext = conversationHistory.length > 0
    ? conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')
    : 'No previous conversation.';

  return `## User's 12-Week Protocol
${protocolContext}

## Current Week Plan
${planContext}

## Recent Conversation
${historyContext}

## User's Message
${currentMessage}

## Instructions
Respond helpfully as Eden. If the user wants to:
- Adjust a plan item: Acknowledge and explain the adjustment
- Know "why" about something: Explain the reasoning with evidence
- Skip something: Accept gracefully, offer alternatives if appropriate
- Ask a health question: Answer based on evidence
- Know about their protocol: Reference their active protocols and phases
- Track progress: Reference their logged activities and connect to outcomes

Always maintain your coaching style and reference their specific context when relevant.

## CRITICAL FORMATTING RULES
- DO NOT use markdown formatting (no #, ##, ###, **, *, ---, etc.)
- Write in plain text with natural paragraphs
- Use line breaks to separate sections if needed
- Keep responses conversational and easy to read
- Use simple bullet points with "•" if listing items

## Response Format (JSON)
{
  "response": "Your natural response to the user in plain text, no markdown",
  "suggestedPrompts": ["Follow-up question 1?", "Follow-up question 2?", "Follow-up question 3?"]
}

The suggestedPrompts should be 2-3 natural follow-up questions the user might want to ask based on the conversation context. They should be:
- Specific to the current topic
- Actionable (lead somewhere useful)
- Varied (don't all be the same type of question)`;
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
  lines.push(`Eden's Intro: ${plan.edenIntro}`);
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