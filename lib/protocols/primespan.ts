/**
 * Primespan Protocol Templates
 * 
 * Evidence-based protocols for each of the 5 domains.
 * These serve as the foundation that gets personalized per user.
 */

import { Domain, FitnessLevel } from '@/lib/types';

// ============================================================
// Protocol Interfaces
// ============================================================

export interface DomainProtocol {
  domain: Domain;
  name: string;
  description: string;
  primaryGoals: string[];
  keyMetrics: Metric[];
  protocols: Protocol[];
  weeklyTargets: WeeklyTarget[];
}

export interface Metric {
  name: string;
  description: string;
  goodRange?: string;
  howToTrack: string;
}

export interface Protocol {
  name: string;
  description: string;
  frequency: string;
  duration: string;
  intensity?: string;
  conservativeStart: string;
  stretchGoal: string;
  adaptations: {
    condition: string;
    modification: string;
  }[];
}

export interface WeeklyTarget {
  metric: string;
  minimum: string;
  optimal: string;
  byFitnessLevel: Record<FitnessLevel, string>;
}

// ============================================================
// HEART Protocol
// ============================================================

export const HEART_PROTOCOL: DomainProtocol = {
  domain: 'heart',
  name: 'Cardiovascular Health',
  description: 'Improve cardiovascular fitness, aerobic capacity, and heart health for longevity.',
  primaryGoals: [
    'Improve VO₂ max and aerobic capacity',
    'Lower resting heart rate',
    'Improve heart rate recovery',
    'Reduce cardiometabolic risk factors',
  ],
  keyMetrics: [
    {
      name: 'Resting Heart Rate',
      description: 'Lower RHR indicates improved fitness and heart efficiency',
      goodRange: '50-70 bpm',
      howToTrack: 'Measure in morning before getting up',
    },
    {
      name: 'VO₂ Max',
      description: 'Maximum oxygen utilization - gold standard for aerobic fitness',
      goodRange: 'Age-dependent, higher is better',
      howToTrack: 'Fitness tests, wearable estimates, or lab testing',
    },
    {
      name: 'Heart Rate Recovery',
      description: 'How quickly HR drops after exercise',
      goodRange: '>20 bpm drop in first minute',
      howToTrack: 'Note HR immediately after and 1 minute post-exercise',
    },
  ],
  protocols: [
    {
      name: 'Zone 2 Training',
      description: 'Moderate-intensity cardio where you can talk in sentences. Builds aerobic base.',
      frequency: '3-5x per week',
      duration: '30-60 minutes per session',
      intensity: 'Zone 2 (conversational pace, ~60-70% max HR)',
      conservativeStart: '3x 30 min walking',
      stretchGoal: '4x 45-60 min cycling/swimming/jogging',
      adaptations: [
        { condition: 'No gym access', modification: 'Brisk walking outdoors' },
        { condition: 'Limited time', modification: 'Split into 2x 15-20 min sessions' },
        { condition: 'Joint issues', modification: 'Swimming or cycling over running' },
      ],
    },
    {
      name: 'High-Intensity Intervals (Zone 5)',
      description: 'Short bursts of high effort to maximize VO₂ max gains',
      frequency: '1x per week (after aerobic base established)',
      duration: '20-30 minutes including warm-up/cool-down',
      intensity: 'Zone 5 (>90% max HR, hard to speak)',
      conservativeStart: '4-6 x 20-30 second bursts with full recovery',
      stretchGoal: '4-5 x 4 minute intervals with equal rest',
      adaptations: [
        { condition: 'Beginner', modification: 'Start with Zone 3-4 intervals' },
        { condition: 'Poor recovery', modification: 'Skip this week, focus on Zone 2' },
        { condition: 'No equipment', modification: 'Hill sprints or stair climbing' },
      ],
    },
    {
      name: 'Daily Movement',
      description: 'Accumulated activity throughout the day',
      frequency: 'Daily',
      duration: 'Throughout the day',
      conservativeStart: '5,000 steps',
      stretchGoal: '8,000-10,000 steps',
      adaptations: [
        { condition: 'Desk job', modification: 'Walk meetings, hourly movement breaks' },
        { condition: 'Limited mobility', modification: 'Chair exercises, upper body movement' },
      ],
    },
  ],
  weeklyTargets: [
    {
      metric: 'Zone 2 Minutes',
      minimum: '90 min',
      optimal: '180 min',
      byFitnessLevel: {
        sedentary: '60-90 min',
        light: '90-120 min',
        moderate: '120-150 min',
        active: '150-180 min',
        very_active: '180-240 min',
      },
    },
    {
      metric: 'HIIT Sessions',
      minimum: '0 sessions',
      optimal: '1 session',
      byFitnessLevel: {
        sedentary: '0 sessions',
        light: '0-1 sessions',
        moderate: '1 session',
        active: '1 session',
        very_active: '1-2 sessions',
      },
    },
  ],
};

// ============================================================
// MUSCLE Protocol
// ============================================================

export const MUSCLE_PROTOCOL: DomainProtocol = {
  domain: 'muscle',
  name: 'Strength & Body Composition',
  description: 'Build and maintain muscle mass, strength, and healthy body composition.',
  primaryGoals: [
    'Maintain/build muscle mass',
    'Improve functional strength',
    'Support metabolic health',
    'Preserve bone density',
  ],
  keyMetrics: [
    {
      name: 'Strength Progression',
      description: 'Ability to lift progressively heavier weights',
      howToTrack: 'Track key lifts (squat, deadlift, press, row)',
    },
    {
      name: 'Body Composition',
      description: 'Ratio of muscle to fat mass',
      howToTrack: 'Progress photos, measurements, or DEXA scan',
    },
  ],
  protocols: [
    {
      name: 'Resistance Training',
      description: 'Progressive overload strength training',
      frequency: '2-4x per week',
      duration: '30-60 minutes per session',
      conservativeStart: '2x full body sessions',
      stretchGoal: '4x upper/lower split',
      adaptations: [
        { condition: 'No gym', modification: 'Bodyweight + dumbbells at home' },
        { condition: 'Injury', modification: 'Work around affected area' },
        { condition: 'Limited time', modification: '2x 30-min full body circuits' },
      ],
    },
    {
      name: 'Protein Intake',
      description: 'Adequate protein for muscle maintenance',
      frequency: 'Daily',
      duration: 'Spread across meals',
      conservativeStart: '0.7g per lb bodyweight',
      stretchGoal: '1g per lb bodyweight',
      adaptations: [
        { condition: 'Vegetarian', modification: 'Combine plant proteins, consider supplementation' },
        { condition: 'Older adult', modification: 'Higher end of range (1g/lb)' },
      ],
    },
  ],
  weeklyTargets: [
    {
      metric: 'Resistance Sessions',
      minimum: '2 sessions',
      optimal: '3-4 sessions',
      byFitnessLevel: {
        sedentary: '2 sessions',
        light: '2-3 sessions',
        moderate: '3 sessions',
        active: '3-4 sessions',
        very_active: '4 sessions',
      },
    },
  ],
};

// ============================================================
// SLEEP Protocol
// ============================================================

export const SLEEP_PROTOCOL: DomainProtocol = {
  domain: 'sleep',
  name: 'Sleep & Recovery',
  description: 'Optimize sleep quality and recovery for health and performance.',
  primaryGoals: [
    'Achieve 7-9 hours quality sleep',
    'Maintain consistent sleep schedule',
    'Optimize sleep environment',
    'Support recovery and HRV',
  ],
  keyMetrics: [
    {
      name: 'Sleep Duration',
      description: 'Total hours of sleep',
      goodRange: '7-9 hours',
      howToTrack: 'Sleep tracking app/device or manual logging',
    },
    {
      name: 'Sleep Efficiency',
      description: 'Time asleep / time in bed',
      goodRange: '>85%',
      howToTrack: 'Sleep tracking device',
    },
    {
      name: 'Sleep Consistency',
      description: 'Regularity of bed/wake times',
      goodRange: '±30 min variance',
      howToTrack: 'Note bed and wake times',
    },
  ],
  protocols: [
    {
      name: 'Sleep Schedule',
      description: 'Consistent bed and wake times',
      frequency: 'Daily',
      duration: 'Set 8-hour sleep window',
      conservativeStart: 'Consistent wake time, ±1 hour bed time',
      stretchGoal: '±30 min consistency 7 days/week',
      adaptations: [
        { condition: 'Shift worker', modification: 'Consistent within work schedule' },
        { condition: 'Parent of young children', modification: 'Focus on recovery naps when possible' },
      ],
    },
    {
      name: 'Wind-Down Routine',
      description: 'Pre-sleep ritual to signal rest',
      frequency: 'Nightly',
      duration: '30-60 minutes before bed',
      conservativeStart: '15-min screen-free time before bed',
      stretchGoal: '60-min wind-down with dimmed lights, no screens',
      adaptations: [
        { condition: 'Busy schedule', modification: '15-30 min minimum wind-down' },
      ],
    },
    {
      name: 'Sleep Environment',
      description: 'Optimize bedroom for sleep',
      frequency: 'Setup once, maintain',
      duration: 'N/A',
      conservativeStart: 'Dark room, comfortable temperature',
      stretchGoal: 'Cool (65-68°F), dark, quiet, no devices',
      adaptations: [
        { condition: 'Shared bedroom', modification: 'Eye mask, ear plugs' },
      ],
    },
  ],
  weeklyTargets: [
    {
      metric: 'Nights with 7+ hours',
      minimum: '5 nights',
      optimal: '7 nights',
      byFitnessLevel: {
        sedentary: '5 nights',
        light: '5-6 nights',
        moderate: '6 nights',
        active: '6-7 nights',
        very_active: '7 nights (recovery critical)',
      },
    },
  ],
};

// ============================================================
// METABOLISM Protocol
// ============================================================

export const METABOLISM_PROTOCOL: DomainProtocol = {
  domain: 'metabolism',
  name: 'Metabolic Health',
  description: 'Optimize energy, nutrition timing, and metabolic function.',
  primaryGoals: [
    'Stable blood sugar levels',
    'Healthy body composition',
    'Sustained energy throughout day',
    'Metabolic flexibility',
  ],
  keyMetrics: [
    {
      name: 'Energy Levels',
      description: 'Consistent energy without crashes',
      goodRange: 'Stable throughout day',
      howToTrack: 'Self-assessment, note energy dips',
    },
    {
      name: 'Body Weight Trend',
      description: 'Directional trend over weeks',
      howToTrack: 'Weekly average weight',
    },
  ],
  protocols: [
    {
      name: 'Post-Meal Movement',
      description: 'Light activity after meals to improve glucose response',
      frequency: 'After main meals',
      duration: '10-15 minutes',
      conservativeStart: '5-10 min walk after largest meal',
      stretchGoal: '10-15 min walk after all main meals',
      adaptations: [
        { condition: 'Office job', modification: 'Walk to refill water, take stairs' },
        { condition: 'Limited mobility', modification: 'Light stretching or standing' },
      ],
    },
    {
      name: 'Eating Window',
      description: 'Time-restricted eating for metabolic health',
      frequency: 'Daily',
      duration: '10-12 hour eating window',
      conservativeStart: '12-hour eating window',
      stretchGoal: '10-hour eating window',
      adaptations: [
        { condition: 'Social schedule', modification: 'Flexible on weekends' },
        { condition: 'Medical conditions', modification: 'Consult healthcare provider first' },
      ],
    },
    {
      name: 'Whole Foods Focus',
      description: 'Prioritize unprocessed, nutrient-dense foods',
      frequency: 'Daily',
      duration: 'N/A',
      conservativeStart: '50% of meals whole foods',
      stretchGoal: '80%+ of meals whole foods',
      adaptations: [
        { condition: 'Busy lifestyle', modification: 'Meal prep on weekends' },
        { condition: 'Limited cooking', modification: 'Focus on simple whole food options' },
      ],
    },
  ],
  weeklyTargets: [
    {
      metric: 'Post-meal walks',
      minimum: '7 walks',
      optimal: '14-21 walks',
      byFitnessLevel: {
        sedentary: '7 walks',
        light: '7-10 walks',
        moderate: '10-14 walks',
        active: '14-21 walks',
        very_active: '14-21 walks',
      },
    },
  ],
};

// ============================================================
// MIND Protocol
// ============================================================

export const MIND_PROTOCOL: DomainProtocol = {
  domain: 'mind',
  name: 'Cognitive & Mental Health',
  description: 'Support cognitive function, stress management, and mental clarity.',
  primaryGoals: [
    'Reduce chronic stress',
    'Improve focus and concentration',
    'Support cognitive longevity',
    'Enhance mental resilience',
  ],
  keyMetrics: [
    {
      name: 'Stress Levels',
      description: 'Subjective stress assessment',
      goodRange: 'Low-moderate, well-managed',
      howToTrack: 'Daily 1-10 rating, HRV if available',
    },
    {
      name: 'Focus Quality',
      description: 'Ability to concentrate on tasks',
      howToTrack: 'Self-assessment of deep work sessions',
    },
  ],
  protocols: [
    {
      name: 'Breathing Practice',
      description: 'Structured breathing for nervous system regulation',
      frequency: 'Daily',
      duration: '5-10 minutes',
      conservativeStart: '5 minutes box breathing',
      stretchGoal: '10-20 minutes breathing/meditation',
      adaptations: [
        { condition: 'No time', modification: '3 deep breaths before meals' },
        { condition: 'Anxiety', modification: 'Extended exhale breathing (4-7-8)' },
      ],
    },
    {
      name: 'Mindfulness Practice',
      description: 'Meditation or mindful awareness',
      frequency: '3-7x per week',
      duration: '10-20 minutes',
      conservativeStart: '5 min guided meditation, 3x/week',
      stretchGoal: '20 min daily meditation',
      adaptations: [
        { condition: 'Difficulty sitting still', modification: 'Walking meditation' },
        { condition: 'Busy schedule', modification: 'Mindful transitions between tasks' },
      ],
    },
    {
      name: 'Digital Boundaries',
      description: 'Protect focus and reduce digital stress',
      frequency: 'Daily',
      duration: 'Structured work blocks',
      conservativeStart: '1 hour focused work without notifications',
      stretchGoal: 'Morning routine phone-free, work blocks, evening cutoff',
      adaptations: [
        { condition: 'Work requires phone', modification: 'Batch notification checks' },
      ],
    },
  ],
  weeklyTargets: [
    {
      metric: 'Mindfulness minutes',
      minimum: '30 min',
      optimal: '70-140 min',
      byFitnessLevel: {
        sedentary: '30-60 min',
        light: '30-60 min',
        moderate: '60-90 min',
        active: '60-90 min',
        very_active: '90-140 min',
      },
    },
  ],
};

// ============================================================
// Export all protocols
// ============================================================

export const ALL_PROTOCOLS: Record<Domain, DomainProtocol> = {
  heart: HEART_PROTOCOL,
  muscle: MUSCLE_PROTOCOL,
  sleep: SLEEP_PROTOCOL,
  metabolism: METABOLISM_PROTOCOL,
  mind: MIND_PROTOCOL,
};

export function getProtocol(domain: Domain): DomainProtocol {
  return ALL_PROTOCOLS[domain];
}

/**
 * Get recommended weekly targets for a user based on their fitness level
 */
export function getPersonalizedTargets(
  fitnessLevel: FitnessLevel
): Record<Domain, Record<string, string>> {
  const result: Record<Domain, Record<string, string>> = {
    heart: {},
    muscle: {},
    sleep: {},
    metabolism: {},
    mind: {},
  };

  Object.entries(ALL_PROTOCOLS).forEach(([domain, protocol]) => {
    protocol.weeklyTargets.forEach(target => {
      result[domain as Domain][target.metric] = target.byFitnessLevel[fitnessLevel];
    });
  });

  return result;
}

