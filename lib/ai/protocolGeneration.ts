import { generateJSON, Message } from './provider';
import { 
  UserProfile, 
  Protocol, 
  ProtocolNarrative,
  ProtocolPhase,
  ActiveProtocol,
  DayRhythm,
  ProtocolWeek,
  Domain,
  DayOfWeek 
} from '@/lib/types';
import { formatCatalogueForProtocolGeneration } from './activityCatalogue';
import { addWeeks, format } from 'date-fns';

// ============================================================================
// Types
// ============================================================================

interface GeneratedProtocol {
  goalSummary: string;
  narrative: ProtocolNarrative;
  phases?: ProtocolPhase[];
  activeProtocols: {
    activityId: string;
    domain: Domain;
    tier: 0 | 1 | 2;
    weeklyTarget: string;
    personalization: string;
    variants?: string[];
    unlocksAtWeek?: number;
  }[];
  weeklyRhythm: {
    dayOfWeek: DayOfWeek;
    role: 'training' | 'active_recovery' | 'rest' | 'flex';
    primaryActivities: string[];
    notes?: string;
  }[];
  weeks: {
    weekNumber: number;
    theme: string;
    intensityLevel: 'low' | 'moderate' | 'high' | 'deload';
    domainEmphasis?: Domain[];
    progressionNotes?: string;
  }[];
}

// ============================================================================
// Main Function
// ============================================================================

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
      maxTokens: 12000,
    });

    const endDate = addWeeks(startDate, 12);

    // Transform weeks to include legacy fields for backward compatibility
    const weeks: ProtocolWeek[] = result.weeks.map(w => ({
      weekNumber: w.weekNumber,
      theme: w.theme,
      intensityLevel: w.intensityLevel,
      domainEmphasis: w.domainEmphasis,
      progressionNotes: w.progressionNotes,
      // Legacy compatibility
      focus: w.theme,
    }));

    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      status: 'active',
      goalSummary: result.goalSummary,
      narrative: result.narrative,
      phases: result.phases,
      activeProtocols: result.activeProtocols as ActiveProtocol[],
      weeklyRhythm: result.weeklyRhythm as DayRhythm[],
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
  
  return `You are Eden, "Peter Attia in their pocket" - an AI longevity physician designing personalized 12-week intervention protocols.

## Your Role

You're not just creating a workout plan. You're designing a strategic, evidence-based protocol that will transform someone's healthspan over 12 weeks. Think like a longevity physician who knows this person's constraints, goals, and reality.

## Protocol Philosophy

1. TIER 0 FIRST: Start with foundational activities. Only add Tier 1-2 when Tier 0 is stable.
   - If someone can only do 3 things: Sleep hygiene + Strength 2x/week + Zone 2
   - If they can do 5 things: Add protein anchor meals + morning light

2. CONSTRAINT-DRIVEN SELECTION: Choose activity variants that fit their reality.
   - No gym? Select home/bodyweight variants
   - Knee pain? Select low-impact cardio variants
   - Limited time? Prioritize highest-leverage activities

3. STRATEGIC NARRATIVE: Every protocol tells a story.
   - WHY this protocol for this person (connect to their goals)
   - APPROACH: Your high-level strategy
   - EXPECTED OUTCOMES: What week 12 looks like

4. WEEKLY RHYTHM: Define day roles before assigning activities.
   - Training days: Primary strength or cardio focus
   - Active recovery days: Light movement, mobility
   - Rest days: True rest, recovery focus
   - Flex days: User chooses based on energy

5. PROGRESSIVE ADAPTATION: Build in deloads, expect imperfect adherence.
   - Week 1: Very achievable (build confidence)
   - Week 4 or 8: Deload/recovery week
   - Week 12: Culmination, not just another week

## Selection Heuristics

- Cap: 6-8 active protocols maximum
- Max 2 new activities introduced per week
- Every domain should have at least one Tier 0 or Tier 1 activity
- Recovery domain is often under-prescribed - don't neglect sleep

## The 5 Primespan Domains

- HEART: Cardiovascular - Zone 2, VO2max, daily movement
- FRAME: Musculoskeletal - Strength, mobility, body composition
- MIND: Cognitive - Focus, stress management, mental practices, social connection
- METABOLISM: Metabolic - Nutrition, glucose, energy
- RECOVERY: Restorative - Sleep, HRV, rest

${activityCatalogue}

Remember: You're designing a PROTOCOL, not a task list. Each activity should have clear evidence rationale and be personalized to this specific person.`;
}

// ============================================================================
// User Prompt
// ============================================================================

function getProtocolUserPrompt(profile: UserProfile): string {
  const goalsDesc = formatGoals(profile.goals);
  const constraintsDesc = formatConstraints(profile.constraints);
  const constraintTags = extractConstraintTags(profile.constraints);

  return `Create a 12-week protocol for this user.

## User Profile
${goalsDesc}

Fitness Level: ${profile.currentFitnessLevel}

${constraintsDesc}

Constraint Tags for Activity Selection: ${constraintTags.join(', ') || 'none'}

## Requirements

Generate a complete protocol with the following structure:

### 1. goalSummary
A concise 1-2 sentence statement of what this protocol will achieve. Write in second person.
Example: "Build sustainable fitness habits while losing 5kg and improving your sleep quality."

### 2. narrative
Strategic narrative with three parts:
- why: Why THIS protocol for THIS person (reference their specific goals and constraints)
- approach: Your high-level strategy (e.g., "We'll build an aerobic base first, then add intensity")
- expectedOutcomes: What success looks like at week 12 (be specific and achievable)

### 3. phases (optional)
Only include if it helps the user understand progression. Array of:
- name: Phase name (e.g., "Foundation", "Build", "Peak")
- weeks: [startWeek, endWeek] (e.g., [1, 4])
- focus: What this phase accomplishes

### 4. activeProtocols
Select 5-8 activities from the catalogue. For each:
- activityId: ID from catalogue (e.g., "heart_zone2", "frame_strength_fullbody")
- domain: Primary domain for this protocol
- tier: 0, 1, or 2
- weeklyTarget: Specific target (e.g., "3x 45min", "2-3x/week", "7 nights 7+ hours")
- personalization: Why THIS activity for THIS user (reference their constraints/goals)
- variants: Array of selected variants if applicable (e.g., ["Walk (incline)", "Cycle"])
- unlocksAtWeek: null for week 1, or week number when this unlocks (for progression)

Selection rules:
- At least one Tier 0 activity for Heart, Frame, and Recovery
- Select variants based on user's constraint tags
- Don't exceed 8 active protocols total

### 5. weeklyRhythm
Define the 7-day template. For each day (0=Sunday through 6=Saturday):
- dayOfWeek: 0-6
- role: "training" | "active_recovery" | "rest" | "flex"
- primaryActivities: Array of activity IDs assigned to this day
- notes: Optional context (e.g., "Upper body focus")

Rules:
- Include at least 1 rest day (typically Sunday)
- Respect user's workout day capacity (max ${profile.constraints.capacity.maxWorkoutDays} days)
- Consider blocked times and preferred workout times

### 6. weeks
12 weeks with progressive structure. For each:
- weekNumber: 1-12
- theme: Brief description (e.g., "Building the foundation")
- intensityLevel: "low" | "moderate" | "high" | "deload"
- domainEmphasis: Array of domains getting focus this week (optional)
- progressionNotes: What changes from previous week (optional)

Week guidelines:
- Week 1: intensityLevel "low" - build confidence
- Week 4 or 8: intensityLevel "deload" - recovery week
- Week 12: Should feel like a culmination

## Response Format (JSON)

{
  "goalSummary": "string",
  "narrative": {
    "why": "string",
    "approach": "string", 
    "expectedOutcomes": "string"
  },
  "phases": [
    {
      "name": "string",
      "weeks": [1, 4],
      "focus": "string"
    }
  ],
  "activeProtocols": [
    {
      "activityId": "string",
      "domain": "heart|frame|mind|metabolism|recovery",
      "tier": 0,
      "weeklyTarget": "string",
      "personalization": "string",
      "variants": ["string"],
      "unlocksAtWeek": null
    }
  ],
  "weeklyRhythm": [
    {
      "dayOfWeek": 0,
      "role": "rest",
      "primaryActivities": [],
      "notes": "string"
    }
  ],
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "string",
      "intensityLevel": "low",
      "domainEmphasis": ["heart", "recovery"],
      "progressionNotes": "string"
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

/**
 * Extract constraint tags for activity variant selection
 */
function extractConstraintTags(constraints: UserProfile['constraints']): string[] {
  const tags: string[] = [];
  
  if (!constraints.equipment.gymAccess) {
    tags.push('no_gym');
    tags.push('no_barbell');
  }
  
  if (!constraints.equipment.outdoorAccess) {
    tags.push('no_outdoor');
  }
  
  // Check for common injury patterns
  const injuries = constraints.limitations.injuries.map(i => i.toLowerCase());
  if (injuries.some(i => i.includes('knee'))) {
    tags.push('knee_pain');
    tags.push('low_impact');
  }
  if (injuries.some(i => i.includes('back') || i.includes('spine'))) {
    tags.push('low_back_sensitivity');
  }
  if (injuries.some(i => i.includes('shoulder'))) {
    tags.push('shoulder_sensitivity');
  }
  
  // Check capacity
  if (constraints.capacity.maxDailyHealthMinutes < 30) {
    tags.push('time_limited');
  }
  
  // Check equipment
  if (constraints.equipment.homeEquipment.some(e => e.toLowerCase().includes('kettlebell'))) {
    tags.push('has_kettlebell');
  }
  if (constraints.equipment.homeEquipment.some(e => e.toLowerCase().includes('band'))) {
    tags.push('has_bands');
  }

  return tags;
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
  dayOfWeek: number,
  adherenceThisWeek: number, // 0-100
  daysSinceLastOpen: number
): string {
  const week = protocol.weeks.find(w => w.weekNumber === currentWeekNumber);
  const weekTheme = week?.theme || week?.focus || 'Building momentum';
  const goal = protocol.goalSummary;
  
  // Get current phase if available
  const currentPhase = protocol.phases?.find(p => 
    currentWeekNumber >= p.weeks[0] && currentWeekNumber <= p.weeks[1]
  );
  const phaseName = currentPhase?.name;

  // Welcome back after absence
  if (daysSinceLastOpen >= 2) {
    return `Week ${currentWeekNumber}${phaseName ? ` · ${phaseName}` : ''} · Welcome back. Let's pick up where you left off toward ${truncateGoal(goal)}.`;
  }

  // Rest day based on weekly rhythm
  const todayRhythm = protocol.weeklyRhythm?.find(r => r.dayOfWeek === dayOfWeek);
  if (todayRhythm?.role === 'rest') {
    return `Week ${currentWeekNumber} · Rest day. Recovery is part of the protocol.`;
  }

  // Deload week
  if (week?.intensityLevel === 'deload') {
    return `Week ${currentWeekNumber} · Deload week. Lighter intensity to let your body adapt and recover.`;
  }

  // Low adherence encouragement
  if (adherenceThisWeek < 30 && dayOfWeek >= 3) {
    return `Week ${currentWeekNumber} · A few activities left. Small wins still count toward ${truncateGoal(goal)}.`;
  }

  // High adherence celebration
  if (adherenceThisWeek >= 80) {
    return `Week ${currentWeekNumber} · ${weekTheme}. Strong week so far—keep building momentum.`;
  }

  // Default: week theme + goal context
  const phaseContext = phaseName ? ` · ${phaseName}` : '';
  return `Week ${currentWeekNumber}${phaseContext} · ${weekTheme}.`;
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
  
  if (percentage >= 100) {
    return `Target hit! ${logged}${unit} of ${target}${unit} this week.`;
  }
  
  if (percentage >= 75) {
    return `Almost there. ${logged}${unit} of ${target}${unit}.`;
  }
  
  if (percentage >= 50) {
    return `Halfway. ${logged}${unit} of ${target}${unit}.`;
  }
  
  if (percentage > 0) {
    return `${logged}${unit} of ${target}${unit}. Let's build on that.`;
  }
  
  return `${target}${unit} target this week.`;
}

function truncateGoal(goal: string): string {
  if (goal.length <= 50) return goal.toLowerCase();
  
  const shortened = goal.substring(0, 50);
  const lastSpace = shortened.lastIndexOf(' ');
  return shortened.substring(0, lastSpace).toLowerCase() + '...';
}
