// Core Five Protocol definitions for Huuman v3

export type Pillar = 'cardio' | 'strength' | 'sleep' | 'clean_eating' | 'mindfulness';

export interface PillarConfig {
  id: Pillar;
  name: string;
  weeklyTarget: number;
  unit: string;
  unitLabel: string;
  description: string;
  color: string;
  icon: string;
}

// Weekly targets based on Standard tier (ambitious but realistic for busy 30-55)
export const PILLAR_CONFIGS: Record<Pillar, PillarConfig> = {
  cardio: {
    id: 'cardio',
    name: 'Cardio',
    weeklyTarget: 150,
    unit: 'min',
    unitLabel: 'minutes',
    description: 'Zone 2, walking, running, cycling, swimming',
    color: '#ef4444', // red
    icon: 'heart',
  },
  strength: {
    id: 'strength',
    name: 'Strength',
    weeklyTarget: 3,
    unit: 'sessions',
    unitLabel: 'sessions',
    description: 'Resistance training, gym, bodyweight',
    color: '#f97316', // orange
    icon: 'dumbbell',
  },
  sleep: {
    id: 'sleep',
    name: 'Sleep',
    weeklyTarget: 49, // 7 hours × 7 nights = 49 hours weekly
    unit: 'hrs',
    unitLabel: 'hours this week',
    description: 'Hours slept (target 7h+ per night)',
    color: '#8b5cf6', // purple
    icon: 'moon',
  },
  clean_eating: {
    id: 'clean_eating',
    name: 'Clean Eating',
    weeklyTarget: 5,
    unit: 'days',
    unitLabel: 'days on-plan',
    description: 'Protein-forward, whole foods, minimal junk',
    color: '#22c55e', // green
    icon: 'leaf',
  },
  mindfulness: {
    id: 'mindfulness',
    name: 'Mindfulness',
    weeklyTarget: 60,
    unit: 'min',
    unitLabel: 'minutes',
    description: 'Breathwork, meditation, journaling',
    color: '#06b6d4', // cyan
    icon: 'brain',
  },
};

export const PILLARS: Pillar[] = ['cardio', 'strength', 'clean_eating', 'mindfulness', 'sleep'];

// Log detail types for each pillar
export interface CardioDetails {
  type?: 'walk' | 'run' | 'bike' | 'swim' | 'row' | 'other';
  intensity?: 'easy' | 'moderate' | 'hard';
  notes?: string;
}

export interface StrengthDetails {
  type?: 'gym' | 'home' | 'bodyweight';
  focus?: 'upper' | 'lower' | 'full' | 'other';
  notes?: string;
}

export interface SleepDetails {
  quality?: 1 | 2 | 3 | 4 | 5;
  bedTime?: string;
  wakeTime?: string;
  notes?: string;
}

export interface CleanEatingDetails {
  notes?: string;
}

export interface MindfulnessDetails {
  type?: 'breathwork' | 'meditation' | 'journaling' | 'other';
  notes?: string;
}

export type PillarDetails = CardioDetails | StrengthDetails | SleepDetails | CleanEatingDetails | MindfulnessDetails;

export interface CoreFiveLog {
  id: string;
  userId: string;
  pillar: Pillar;
  value: number;
  details?: PillarDetails;
  loggedAt: string;
  weekStart: string;
  createdAt: string;
}

// Calculate pillar progress
export function getPillarProgress(logs: CoreFiveLog[], pillar: Pillar): number {
  return logs
    .filter(log => log.pillar === pillar)
    .reduce((sum, log) => sum + log.value, 0);
}

// Check if pillar target is met
export function isPillarMet(logs: CoreFiveLog[], pillar: Pillar): boolean {
  const progress = getPillarProgress(logs, pillar);
  return progress >= PILLAR_CONFIGS[pillar].weeklyTarget;
}

// Calculate progress (number of pillars met)
export function getPrimeCoverage(logs: CoreFiveLog[]): number {
  return PILLARS.filter(pillar => isPillarMet(logs, pillar)).length;
}

// Get week start date (Monday) for a given date
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}
