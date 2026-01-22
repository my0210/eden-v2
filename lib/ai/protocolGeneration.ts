import { generateJSON, Message } from './provider';
import { 
  UserProfile, 
  Protocol, 
  ProtocolNarrative,
  RecommendedActivity,
  ProtocolWeek,
  Domain
} from '@/lib/types';
import { formatCatalogueForProtocolGeneration } from './activityCatalogue';
import { addWeeks, format } from 'date-fns';

// ============================================================================
// Types
// ============================================================================

interface GeneratedProtocol {
  goalSummary: string;
  narrative: ProtocolNarrative;
  recommendedActivities: {
    activityId: string;
    domain: Domain;
    weeklyTarget: string;
    targetValue: number;
    targetUnit: 'min' | 'sessions' | 'days' | 'hours';
    personalization: string;
  }[];
  weeks: {
    weekNumber: number;
    theme?: string;
  }[];
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Generate a 12-week protocol for a user
 * Simplified: just goals, narrative, recommended activities, and week themes
 */
export async function generateProtocol(
  profile: UserProfile,
  startDate: Date
): Promise<Omit<Protocol, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> {
  const systemPrompt = getProtocolSystemPrompt();
  const userPrompt = getProtocolUserPrompt(profile);

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  try {
    const result = await generateJSON<GeneratedProtocol>(messages, {
      model: 'thinking',
      temperature: 0.7,
      maxTokens: 8000,
    });

    const endDate = addWeeks(startDate, 12);

    // Transform weeks
    const weeks: ProtocolWeek[] = result.weeks.map(w => ({
      weekNumber: w.weekNumber,
      theme: w.theme,
      focus: w.theme, // Legacy compatibility
    }));

    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      status: 'active',
      goalSummary: result.goalSummary,
      narrative: result.narrative,
      recommendedActivities: result.recommendedActivities as RecommendedActivity[],
      weeks,
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error generating protocol:', err.message);
    throw err;
  }
}

// ============================================================================
// System Prompt
// ============================================================================

function getProtocolSystemPrompt(): string {
  const activityCatalogue = formatCatalogueForProtocolGeneration();
  
  return `You are Eden, "Peter Attia in their pocket" - an AI longevity physician designing personalized health protocols.

## Your Role

Design a strategic, evidence-based 12-week protocol that will transform someone's healthspan. Focus on the FEW activities that will have the BIGGEST impact for this specific person.

## Protocol Philosophy

1. LESS IS MORE: Select 5-7 activities maximum. Better to do fewer things consistently than many things poorly.

2. CONSTRAINT-DRIVEN: Choose activities that fit their reality.
   - No gym? Select home/bodyweight activities
   - Limited time? Prioritize highest-leverage activities
   - Injuries? Select appropriate alternatives

3. EVIDENCE-BASED: Every recommended activity should have clear longevity evidence.

4. PERSONALIZED: The "why" for each activity should reference their specific goals and constraints.

## The 5 Primespan Domains

- HEART: Cardiovascular health - Zone 2, VO2max, daily movement
- FRAME: Musculoskeletal - Strength, mobility, body composition
- MIND: Cognitive health - Focus, stress management, mental practices
- METABOLISM: Metabolic health - Nutrition, glucose regulation
- RECOVERY: Restorative - Sleep quality and quantity

## Activity Selection Guidelines

- At least one activity for Heart, Frame, and Recovery (these are foundational)
- Mind and Metabolism can be addressed based on user goals
- Set realistic weekly targets based on their capacity
- Use targetValue and targetUnit for measurable goals:
  - Cardio: minutes per week (e.g., targetValue: 150, targetUnit: "min")
  - Strength: sessions per week (e.g., targetValue: 2, targetUnit: "sessions")
  - Sleep: hours per night (e.g., targetValue: 7, targetUnit: "hours")
  - Daily practices: days per week (e.g., targetValue: 7, targetUnit: "days")

${activityCatalogue}

Remember: You're designing a PROTOCOL - a strategic intervention plan, not a task list.`;
}

// ============================================================================
// User Prompt
// ============================================================================

function getProtocolUserPrompt(profile: UserProfile): string {
  const goalsDesc = formatGoals(profile.goals);
  const constraintsDesc = formatConstraints(profile.constraints);

  return `Create a 12-week protocol for this user.

## User Profile

${goalsDesc}

Fitness Level: ${profile.currentFitnessLevel}

${constraintsDesc}

## Generate a Protocol with:

### 1. goalSummary
A concise 1-2 sentence statement of what this protocol will achieve. Write in second person.
Example: "Build sustainable fitness habits while improving your cardiovascular health and sleep quality."

### 2. narrative
Strategic narrative with three parts:
- why: Why THIS protocol for THIS person (reference their specific goals and constraints)
- approach: Your high-level strategy in 1-2 sentences
- expectedOutcomes: What success looks like at week 12 (specific and achievable)

### 3. recommendedActivities
Select 5-7 activities from the catalogue. For each:
- activityId: ID from catalogue (e.g., "zone2_cardio", "strength_training")
- domain: "heart" | "frame" | "mind" | "metabolism" | "recovery"
- weeklyTarget: Human-readable target (e.g., "150 min/week", "2-3 sessions/week")
- targetValue: Numeric value for tracking (e.g., 150)
- targetUnit: "min" | "sessions" | "days" | "hours"
- personalization: Why THIS activity for THIS user (1-2 sentences referencing their goals/constraints)

### 4. weeks
12 weeks with optional themes. For each:
- weekNumber: 1-12
- theme: Optional brief description (e.g., "Building the foundation", "Deload week")

Week guidelines:
- Week 1: Easy start to build confidence
- Week 4 or 8: Consider a lighter "deload" week
- Week 12: Should feel like a culmination

## Response Format (JSON)

{
  "goalSummary": "string",
  "narrative": {
    "why": "string",
    "approach": "string", 
    "expectedOutcomes": "string"
  },
  "recommendedActivities": [
    {
      "activityId": "zone2_cardio",
      "domain": "heart",
      "weeklyTarget": "150 min/week",
      "targetValue": 150,
      "targetUnit": "min",
      "personalization": "string"
    }
  ],
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "Building the foundation"
    }
  ]
}`;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatGoals(goals: UserProfile['goals']): string {
  const lines: string[] = [];
  
  lines.push(`Primary Goals: ${goals.primary.join(', ')}`);
  lines.push(`What "being in prime" means to them: ${goals.primeSpanMeaning}`);
  
  if (goals.specificTargets && goals.specificTargets.length > 0) {
    lines.push('Specific Targets:');
    goals.specificTargets.forEach(t => {
      lines.push(`  - ${t.domain}: ${t.target}`);
    });
  }

  return lines.join('\n');
}

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
  
  if (constraints.limitations.medical.length > 0) {
    lines.push(`Medical Conditions: ${constraints.limitations.medical.join(', ')}`);
  }

  lines.push(`Max Workout Days: ${constraints.capacity.maxWorkoutDays}/week`);
  lines.push(`Max Daily Health Time: ${constraints.capacity.maxDailyHealthMinutes} minutes`);

  return lines.join('\n');
}

// ============================================================================
// Eden Message Generation
// ============================================================================

/**
 * Generate a dynamic Eden message based on context
 */
export function generateEdenMessage(
  protocol: Protocol,
  currentWeekNumber: number,
  adherencePercent: number, // 0-100
  daysSinceLastOpen: number
): string {
  const week = protocol.weeks.find(w => w.weekNumber === currentWeekNumber);
  const weekTheme = week?.theme || week?.focus || '';
  const goal = protocol.goalSummary;
  
  // Welcome back after absence
  if (daysSinceLastOpen >= 2) {
    return `Week ${currentWeekNumber} · Welcome back. Let's pick up where you left off.`;
  }

  // Deload week (check theme)
  if (weekTheme.toLowerCase().includes('deload') || weekTheme.toLowerCase().includes('recovery')) {
    return `Week ${currentWeekNumber} · ${weekTheme}. Lighter week to let your body adapt.`;
  }

  // High adherence celebration
  if (adherencePercent >= 80) {
    return `Week ${currentWeekNumber} · Strong week so far. Keep building momentum.`;
  }

  // Low adherence encouragement
  if (adherencePercent < 30) {
    return `Week ${currentWeekNumber} · Every activity counts. What can you do today?`;
  }

  // Default: week number + theme if available
  if (weekTheme) {
    return `Week ${currentWeekNumber} · ${weekTheme}`;
  }
  
  return `Week ${currentWeekNumber} of 12 · ${truncateGoal(goal)}`;
}

/**
 * Generate Eden message for a specific domain's progress
 */
export function generateDomainProgressMessage(
  domain: Domain,
  logged: number,
  target: number,
  unit: string
): string {
  const percentage = target > 0 ? (logged / target) * 100 : 0;
  const unitLabel = unit === 'min' ? 'min' : unit;
  
  if (percentage >= 100) {
    return `Target hit! ${logged}/${target}${unitLabel}`;
  }
  
  if (percentage >= 75) {
    return `Almost there. ${logged}/${target}${unitLabel}`;
  }
  
  if (percentage >= 50) {
    return `Halfway. ${logged}/${target}${unitLabel}`;
  }
  
  if (percentage > 0) {
    return `${logged}/${target}${unitLabel}`;
  }
  
  return `${target}${unitLabel} this week`;
}

function truncateGoal(goal: string): string {
  if (goal.length <= 50) return goal;
  
  const shortened = goal.substring(0, 50);
  const lastSpace = shortened.lastIndexOf(' ');
  return shortened.substring(0, lastSpace) + '...';
}
