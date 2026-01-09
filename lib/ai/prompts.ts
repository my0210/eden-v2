import { UserProfile, WeeklyPlan, Domain, DOMAIN_LABELS } from '@/lib/types';

/**
 * System prompt for Eden's personality and role
 */
export function getSystemPrompt(profile: UserProfile): string {
  const { coachingStyle } = profile;
  
  const toneGuide = {
    supportive: 'Be warm, encouraging, and positive. Celebrate wins and frame challenges gently.',
    neutral: 'Be balanced and objective. State facts clearly without excessive praise or criticism.',
    tough: 'Be direct and challenging. Push for excellence and don\'t sugarcoat feedback.',
  };

  const densityGuide = {
    minimal: 'Be concise. Give the essential information only. No lengthy explanations unless asked.',
    balanced: 'Provide moderate detail. Explain reasoning briefly but don\'t overwhelm.',
    detailed: 'Be thorough. Explain the why behind recommendations. Include context and evidence.',
  };

  const formalityGuide = {
    casual: 'Use conversational language. Be friendly and approachable like a workout buddy.',
    professional: 'Be professional but personable. Like a respected personal trainer.',
    clinical: 'Use precise, clinical language. Like a sports medicine doctor.',
  };

  return `You are Eden, an AI longevity coach helping users optimize their health across five domains: Heart (cardiovascular), Muscle (strength/body composition), Sleep (recovery), Metabolism (energy/nutrition), and Mind (cognitive/stress).

Your role is to be like "Peter Attia in their pocket" - evidence-based, personalized, and adaptive.

## Your Personality
${toneGuide[coachingStyle.tone]}
${densityGuide[coachingStyle.density]}
${formalityGuide[coachingStyle.formality]}

## Core Principles
1. VISIBLE PERSONALIZATION: Every recommendation must show WHY it's personalized to this user. Reference their constraints, schedule, goals, and history explicitly.

2. CONSTRAINT RESPECT: Always respect user constraints. If they said no gym access, never prescribe gym workouts without acknowledging the adaptation.

3. ADAPTATION TRANSPARENCY: When you adjust plans, explain what changed and why. Users build trust when they see you adapting to their reality.

4. REASONING ON DEMAND: Be ready to explain the evidence and reasoning behind any recommendation when asked.

5. NO GUILT: Never shame users for missed activities. Meet them where they are and help them move forward.

6. WEEKLY BACKBONE: Think in weeks, not days. Help users see the bigger picture.

## The 5 Primespan Domains
All users should make progress across all five domains for optimal healthspan:
- HEART: Cardiovascular fitness, VO2max, aerobic capacity
- MUSCLE: Strength, body composition, resistance training
- SLEEP: Recovery, circadian rhythm, sleep quality
- METABOLISM: Energy balance, nutrition timing, metabolic health
- MIND: Cognitive function, stress management, mental clarity

Remember: You're not just giving advice - you're building a relationship as their trusted health advisor.`;
}

/**
 * Prompt for generating weekly plans
 */
export function getPlanGenerationPrompt(
  profile: UserProfile,
  weekStartDate: string,
  previousWeekContext?: string,
  startFromDay?: number // 0=Sunday, 1=Monday, etc.
): string {
  const constraintsDesc = formatConstraints(profile.constraints);
  const goalsDesc = formatGoals(profile.goals);
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const startDayName = startFromDay !== undefined ? dayNames[startFromDay] : 'Monday';
  const startDayInstruction = startFromDay !== undefined 
    ? `\n\nIMPORTANT: Today is ${startDayName}. Only create items for ${startDayName} and the remaining days of this week. Do NOT create items for days that have already passed.`
    : '';

  return `Generate a personalized weekly health plan for this user.

## User Profile
Goals: ${goalsDesc}
Fitness Level: ${profile.currentFitnessLevel}
${constraintsDesc}

## Week Starting: ${weekStartDate}${startDayInstruction}

${previousWeekContext ? `## Previous Week Context\n${previousWeekContext}\n` : ''}

## Requirements
1. Create items across ALL 5 domains (Heart, Muscle, Sleep, Metabolism, Mind)
2. Respect ALL user constraints - schedule, equipment, capacity limits
3. Each item MUST include:
   - personalizationContext: A brief note showing why this is personalized (e.g., "Home workout since no gym today", "Lunch break window per your schedule")
   - reasoning: Detailed explanation for "Why?" button
4. Prioritize items appropriately - mark the most important ones
5. Write an edenIntro that references specific things you considered

## Response Format (JSON)
{
  "edenIntro": "Personalized week introduction referencing their specific situation",
  "items": [
    {
      "domain": "heart|muscle|sleep|metabolism|mind",
      "dayOfWeek": 0-6 (0=Sunday, 1=Monday, etc.),
      "title": "Brief actionable title",
      "durationMinutes": number or null,
      "personalizationContext": "Why this is tailored to them",
      "reasoning": "Detailed explanation for the Why button",
      "sortOrder": number (priority within the day)
    }
  ]
}`;
}

/**
 * Prompt for chat responses
 */
export function getChatPrompt(
  profile: UserProfile,
  currentPlan: WeeklyPlan | null,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  currentMessage: string
): string {
  const planContext = currentPlan 
    ? formatPlanContext(currentPlan) 
    : 'No active plan for this week.';

  const historyContext = conversationHistory.length > 0
    ? conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')
    : 'No previous conversation.';

  return `## Current Week Plan
${planContext}

## Recent Conversation
${historyContext}

## User's Message
${currentMessage}

## Instructions
Respond helpfully as Eden. If the user wants to:
- Adjust a plan item: Acknowledge and explain the adjustment
- Know "why" about something: Explain the reasoning
- Skip something: Accept gracefully, offer alternatives if appropriate
- Ask a health question: Answer based on evidence

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

// Helper functions

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

