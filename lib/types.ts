// Eden v2 Core Types

// ============================================================
// User & Profile Types
// ============================================================

export interface UserProfile {
  id: string;
  email: string;
  goals: UserGoals;
  constraints: UserConstraints;
  coachingStyle: CoachingStyle;
  currentFitnessLevel: FitnessLevel;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserGoals {
  primary: string[];
  primeSpanMeaning: string;
  specificTargets?: {
    domain: Domain;
    target: string;
  }[];
}

export interface UserConstraints {
  schedule: {
    workHours: string;
    blockedTimes: BlockedTime[];
    preferredWorkoutTimes: ('morning' | 'lunch' | 'afternoon' | 'evening')[];
  };
  equipment: {
    gymAccess: boolean;
    homeEquipment: string[];
    outdoorAccess: boolean;
  };
  limitations: {
    injuries: string[];
    medical: string[];
  };
  capacity: {
    maxWorkoutDays: number;
    maxDailyHealthMinutes: number;
  };
}

export interface BlockedTime {
  day: DayOfWeek;
  time: string;
  reason: string;
}

export interface CoachingStyle {
  tone: 'supportive' | 'neutral' | 'tough';
  density: 'minimal' | 'balanced' | 'detailed';
  formality: 'casual' | 'professional' | 'clinical';
}

export type FitnessLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

// ============================================================
// Domain Types
// ============================================================

export type Domain = 'heart' | 'muscle' | 'sleep' | 'metabolism' | 'mind';

export const DOMAINS: Domain[] = ['heart', 'muscle', 'sleep', 'metabolism', 'mind'];

export const DOMAIN_LABELS: Record<Domain, string> = {
  heart: 'Heart',
  muscle: 'Muscle',
  sleep: 'Sleep',
  metabolism: 'Metabolism',
  mind: 'Mind',
};

export const DOMAIN_COLORS: Record<Domain, string> = {
  heart: '#ef4444',    // red
  muscle: '#f97316',   // orange
  sleep: '#8b5cf6',    // purple
  metabolism: '#22c55e', // green
  mind: '#3b82f6',     // blue
};

// ============================================================
// Weekly Plan Types
// ============================================================

export interface WeeklyPlan {
  id: string;
  userId: string;
  weekStartDate: string; // ISO date string (Monday)
  edenIntro: string;     // Personalized week introduction
  generationContext: GenerationContext;
  items: PlanItem[];
  createdAt: string;
}

export interface GenerationContext {
  userProfile: Partial<UserProfile>;
  previousWeekAdherence?: WeekAdherence;
  recentConversationContext?: string;
  specialConsiderations?: string[];
}

export interface PlanItem {
  id: string;
  weeklyPlanId: string;
  domain: Domain;
  dayOfWeek: DayOfWeek;
  title: string;
  durationMinutes?: number;
  personalizationContext: string;  // Why this is personalized for them
  reasoning: string;               // Full reasoning (shown on "Why?")
  status: ItemStatus;
  completedAt?: string;
  sortOrder: number;
  createdAt: string;
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.

export const DAY_LABELS: Record<DayOfWeek, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};

export const DAY_FULL_LABELS: Record<DayOfWeek, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

export type ItemStatus = 'pending' | 'done' | 'skipped';

// ============================================================
// Adherence Types
// ============================================================

export interface WeekAdherence {
  weekStartDate: string;
  totalItems: number;
  completedItems: number;
  skippedItems: number;
  byDomain: Record<Domain, DomainAdherence>;
}

export interface DomainAdherence {
  total: number;
  completed: number;
  skipped: number;
}

// ============================================================
// Conversation Types
// ============================================================

export interface Conversation {
  id: string;
  userId: string;
  messages: ChatMessage[];
  context?: ConversationContext;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  relatedItemId?: string; // If message is about a specific plan item
}

export interface ConversationContext {
  currentPlanId?: string;
  currentItemId?: string;
  topic?: string;
}

// ============================================================
// Adaptation Types
// ============================================================

export interface Adaptation {
  id: string;
  userId: string;
  weeklyPlanId: string;
  triggerType: AdaptationTrigger;
  description: string;
  changesMade: AdaptationChange[];
  createdAt: string;
}

export type AdaptationTrigger = 
  | 'missed_items'
  | 'user_request'
  | 'pattern_detected'
  | 'constraint_change'
  | 'weekly_generation';

export interface AdaptationChange {
  type: 'moved' | 'removed' | 'added' | 'modified';
  itemId?: string;
  description: string;
}

// ============================================================
// Onboarding Types
// ============================================================

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  answers: OnboardingAnswers;
  completed: boolean;
}

export interface OnboardingAnswers {
  // Step 1: Goals
  primaryGoals?: string[];
  primeSpanMeaning?: string;
  
  // Step 2: Current State
  currentActivityLevel?: FitnessLevel;
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  sleepDuration?: number;
  healthConditions?: string[];
  
  // Step 3: Constraints
  workSchedule?: string;
  blockedTimes?: BlockedTime[];
  preferredWorkoutTimes?: string[];
  
  // Step 4: Equipment & Environment
  gymAccess?: boolean;
  homeEquipment?: string[];
  outdoorAccess?: boolean;
  
  // Step 5: Capacity
  maxWorkoutDays?: number;
  maxDailyHealthMinutes?: number;
  
  // Step 6: Coaching Style
  coachingTone?: CoachingStyle['tone'];
  coachingDensity?: CoachingStyle['density'];
  coachingFormality?: CoachingStyle['formality'];
}

// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PlanGenerationRequest {
  userId: string;
  weekStartDate: string;
  forceRegenerate?: boolean;
}

export interface ChatRequest {
  userId: string;
  message: string;
  context?: {
    currentPlanId?: string;
    currentItemId?: string;
  };
}

export interface ChatResponse {
  message: string;
  actions?: ChatAction[];
}

export interface ChatAction {
  type: 'update_item' | 'show_plan' | 'show_reasoning';
  payload: Record<string, unknown>;
}

