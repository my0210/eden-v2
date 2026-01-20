import { generateJSON, Message } from './provider';
import { UserProfile, Protocol, ProtocolWeek, Domain } from '@/lib/types';
import { addWeeks, format } from 'date-fns';

interface GeneratedProtocol {
  goalSummary: string;
  weeks: {
    weekNumber: number;
    focus: string;
    domains: Partial<Record<Domain, string>>;
  }[];
}

/**
 * Generate a 12-week protocol for a user
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
      maxTokens: 8192,
    });

    const endDate = addWeeks(startDate, 12);

    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      status: 'active',
      goalSummary: result.goalSummary,
      weeks: result.weeks,
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error generating protocol:', err.message);
    throw err;
  }
}

function getProtocolSystemPrompt(): string {
  return `You are Eden, an AI longevity coach creating personalized 12-week health protocols.

Your role is to design a progressive, evidence-based protocol that helps users achieve their health goals across the 5 Primespan domains: Heart, Frame, Mind, Metabolism, and Recovery.

## Protocol Design Principles

1. PROGRESSIVE OVERLOAD: Start conservatively, build gradually. Week 1 should be achievable by anyone.

2. GOAL-ANCHORED: Every week should clearly connect to the user's stated goal.

3. DOMAIN BALANCE: Cover all 5 domains, but weight them based on user goals.

4. REALISTIC PACING: Account for life - include lighter weeks, don't assume perfect adherence.

5. CONSTRAINT-AWARE: Respect equipment, time, and physical limitations throughout.

## Protocol Structure

You may optionally organize weeks into phases if it helps the user understand progression. Phases are NOT required - only include them if they add clarity for this specific user's goals.

Examples of when phases help:
- Athletic goals: "Base → Build → Peak"
- Weight loss: "Reset → Deficit → Maintain"
- Habit building: "Foundation → Consistency → Optimization"

Examples of when phases don't help:
- General health maintenance
- Users who prefer simplicity
- Goals without clear progression stages

## The 5 Primespan Domains

- HEART: Cardiovascular - Zone 2, VO2max, daily movement
- FRAME: Musculoskeletal - Strength, mobility, body composition
- MIND: Cognitive - Focus, stress management, mental practices
- METABOLISM: Metabolic - Nutrition, glucose, energy
- RECOVERY: Restorative - Sleep, HRV, rest

Remember: This is a 12-week outline. Daily details will be generated each week based on actual progress.`;
}

function getProtocolUserPrompt(profile: UserProfile): string {
  const goalsDesc = formatGoals(profile.goals);
  const constraintsDesc = formatConstraints(profile.constraints);

  return `Create a 12-week protocol for this user.

## User Profile
${goalsDesc}

Fitness Level: ${profile.currentFitnessLevel}

${constraintsDesc}

## Requirements

1. Create a goalSummary: A concise 1-2 sentence statement of what this protocol will help them achieve. Write it in second person ("Lose 8kg while building strength and fixing your sleep").

2. Create 12 weeks, each with:
   - weekNumber (1-12)
   - focus: A brief phrase describing this week's theme (e.g., "Building the foundation", "Adding intensity")
   - domains: Object with relevant domain focuses for this week. Only include domains that have specific focus this week.

3. Week 1 should be very achievable - build confidence first.

4. Include at least one lighter/recovery week (around week 4 or 8).

5. Week 12 should feel like a culmination, not just another week.

## Response Format (JSON)
{
  "goalSummary": "Concise goal statement in second person",
  "weeks": [
    {
      "weekNumber": 1,
      "focus": "Brief theme for this week",
      "domains": {
        "heart": "Specific heart focus if any",
        "frame": "Specific frame focus if any",
        "recovery": "Specific recovery focus if any",
        "metabolism": "Specific metabolism focus if any",
        "mind": "Specific mind focus if any"
      }
    }
  ]
}

Only include domains in each week that have meaningful focus. Not every domain needs to appear every week.`;
}

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

/**
 * Generate a dynamic Eden message based on context
 */
export function generateEdenMessage(
  protocol: Protocol,
  currentWeekNumber: number,
  dayOfWeek: number,
  adherenceThisWeek: number, // 0-100
  daysSinceLastOpen: number
): string {
  const week = protocol.weeks.find(w => w.weekNumber === currentWeekNumber);
  const weekFocus = week?.focus || 'Building momentum';
  const goal = protocol.goalSummary;

  // Welcome back after absence
  if (daysSinceLastOpen >= 2) {
    return `Week ${currentWeekNumber} · Welcome back. Let's pick up where you left off toward ${truncateGoal(goal)}.`;
  }

  // Rest day (Sunday = 0)
  if (dayOfWeek === 0) {
    return `Week ${currentWeekNumber} · Rest day. Recovery is part of the protocol.`;
  }

  // Low adherence encouragement
  if (adherenceThisWeek < 30 && dayOfWeek >= 3) {
    return `Week ${currentWeekNumber} · A few items left. Small wins still count toward ${truncateGoal(goal)}.`;
  }

  // Default: week focus + goal
  return `Week ${currentWeekNumber} · ${weekFocus} toward ${truncateGoal(goal)}.`;
}

function truncateGoal(goal: string): string {
  // Extract the key part of the goal, truncate if too long
  if (goal.length <= 50) return goal.toLowerCase();
  
  // Try to find a natural break point
  const shortened = goal.substring(0, 50);
  const lastSpace = shortened.lastIndexOf(' ');
  return shortened.substring(0, lastSpace).toLowerCase() + '...';
}
