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
  isAdmin: boolean;
  unitSystem: UnitSystem;
  glucoseUnit?: GlucoseUnit;
  lipidsUnit?: LipidsUnit;
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
export type UnitSystem = 'metric' | 'imperial';
export type GlucoseUnit = 'mg/dL' | 'mmol/L';
export type LipidsUnit = 'mg/dL' | 'mmol/L';

export interface UnitPreferences {
  glucoseUnit?: GlucoseUnit;
  lipidsUnit?: LipidsUnit;
}

// ============================================================
// Domain Types
// ============================================================

export type Domain = 'heart' | 'frame' | 'mind' | 'metabolism' | 'recovery';

export const DOMAINS: Domain[] = ['heart', 'frame', 'mind', 'metabolism', 'recovery'];

export const DOMAIN_LABELS: Record<Domain, string> = {
  heart: 'Heart',
  frame: 'Frame',
  recovery: 'Recovery',
  metabolism: 'Metabolism',
  mind: 'Mind',
};

export const DOMAIN_COLORS: Record<Domain, string> = {
  heart: '#ef4444',    // red
  frame: '#f97316',    // orange
  recovery: '#8b5cf6', // purple
  metabolism: '#22c55e', // green
  mind: '#3b82f6',     // blue
};

export const DOMAIN_EMOJI: Record<Domain, string> = {
  heart: '❤️',
  frame: '💪',
  recovery: '😴',
  metabolism: '🔥',
  mind: '🧠',
};

// ============================================================
// Protocol Types (12-week plans) - Simplified
// ============================================================

export interface Protocol {
  id: string;
  userId: string;
  startDate: string;     // ISO date string
  endDate: string;       // ISO date string
  status: ProtocolStatus;
  goalSummary: string;   // User's primary goal statement
  
  // Strategic narrative
  narrative: ProtocolNarrative;
  
  // Recommended activities from the catalogue
  recommendedActivities: RecommendedActivity[];
  
  // 12 week outlines (simplified)
  weeks: ProtocolWeek[];
  
  createdAt: string;
  updatedAt: string;
}

export type ProtocolStatus = 'active' | 'completed' | 'paused';

export interface ProtocolNarrative {
  why: string;               // Why this protocol for this person
  approach: string;          // High-level strategy
  expectedOutcomes: string;  // What success looks like at week 12
}

/**
 * A recommended activity from the catalogue with weekly target
 * Simpler than the old ActiveProtocol - no tiers, no unlock logic
 */
export interface RecommendedActivity {
  activityId: string;           // Links to catalogue (e.g., "zone2_cardio")
  domain: Domain;
  weeklyTarget: string;         // Human-readable: "150 min" or "3 sessions"
  targetValue: number;          // Numeric value: 150
  targetUnit: 'min' | 'sessions' | 'days' | 'hours';
  personalization: string;      // "Given your goal to improve VO2 max..."
}

export interface ProtocolWeek {
  weekNumber: number;    // 1-12
  theme?: string;        // Optional: e.g., "Deload week"
  focus?: string;        // Legacy compatibility
}

// ============================================================
// Legacy Protocol Types (deprecated, kept for backward compatibility)
// ============================================================

/** @deprecated Use RecommendedActivity instead */
export interface ActiveProtocol {
  activityId: string;
  domain: Domain;
  tier: 0 | 1 | 2;
  weeklyTarget: string;
  personalization: string;
  variants?: string[];
  unlocksAtWeek?: number;
}

/** @deprecated No longer used */
export interface ProtocolPhase {
  name: string;
  weeks: [number, number];
  focus: string;
}

/** @deprecated No longer used */
export type DayRole = 'training' | 'active_recovery' | 'rest' | 'flex';

/** @deprecated No longer used */
export interface DayRhythm {
  dayOfWeek: DayOfWeek;
  role: DayRole;
  primaryActivities: string[];
  notes?: string;
}

// ============================================================
// Activity Log Types
// ============================================================

export interface ActivityLog {
  id: string;
  userId: string;
  activityDefinitionId: string;
  domain: Domain;
  activityType?: string;       // Variant/subtype like "Walk", "Bike"
  value: number;               // Duration in minutes or count
  unit: string;                // "min", "sessions", etc.
  date: string;                // ISO date
  notes?: string;
  createdAt: string;
}

// ============================================================
// Weekly Plan Types
// ============================================================

export interface WeeklyPlan {
  id: string;
  userId: string;
  weekStartDate: string; // ISO date string (Monday)
  edenIntro: string;     // Personalized week introduction
  domainIntros: Partial<Record<Domain, string>>; // Per-domain intro text
  generationContext: GenerationContext;
  items: PlanItem[];
  protocolId?: string;   // Reference to parent protocol
  weekNumber?: number;   // 1-12 if part of a protocol
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
// User Feedback Types
// ============================================================

export interface UserFeedback {
  id: string;
  userId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  message?: string;
  status: UserFeedbackStatus;
  createdAt: string;
  // Joined data for admin view
  userEmail?: string;
}

export type UserFeedbackStatus = 'new' | 'reviewed' | 'resolved';

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
  healthConditionsRaw?: string;
  
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

// ============================================================
// Metric Types
// ============================================================

export type MetricValueType = 'number' | 'duration' | 'scale_1_10' | 'boolean' | 'text';

export type MetricSource = 'manual' | 'apple_health' | 'garmin' | 'whoop' | 'oura' | 'lab' | 'other';

export type MetricFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'once';

export interface MetricDefinition {
  id: string;
  domain: Domain;
  subDomain: string;
  name: string;
  description?: string;
  whatItTellsYou?: string;
  unit?: string;
  canonicalUnit?: string;
  unitType?: MetricUnitType;
  testType?: string;
  isCalculated?: boolean;
  valueType: MetricValueType;
  measurementSources: string[];
  frequencyHint?: MetricFrequency;
  sortOrder: number;
  createdAt: string;
}

export type MetricUnitType =
  | 'mass'
  | 'length'
  | 'temperature'
  | 'glucose'
  | 'lipids_cholesterol'
  | 'lipids_triglycerides'
  | 'lipids'
  | 'pressure'
  | 'duration'
  | 'count'
  | 'ratio'
  | 'percentage'
  | 'score'
  | 'rate'
  | 'unitless';

export interface UserMetricEntry {
  id: string;
  userId: string;
  metricDefinitionId: string;
  value: number;
  unit?: string;
  source: MetricSource;
  recordedAt: string;
  notes?: string;
  rawData?: Record<string, unknown>;
  createdAt: string;
}

// Extended type with metric definition joined
export interface UserMetricEntryWithDefinition extends UserMetricEntry {
  metricDefinition: MetricDefinition;
}

// Summary types for the "You" view
export interface DomainMetricSummary {
  domain: Domain;
  totalMetrics: number;
  trackedMetrics: number;
  lastActivity?: string;
  subDomains: SubDomainMetricSummary[];
}

export interface SubDomainMetricSummary {
  subDomain: string;
  metrics: MetricWithLatestValue[];
}

export interface MetricWithLatestValue {
  definition: MetricDefinition;
  latestEntry?: UserMetricEntry;
  previousEntry?: UserMetricEntry;
  trend?: 'up' | 'down' | 'stable';
  scoring?: MetricScoring;
}

// Sub-domain mapping for each domain
export const DOMAIN_SUBDOMAINS: Record<Domain, string[]> = {
  heart: ['Aerobic Capacity', 'Cardiac Efficiency', 'Cardiovascular Health'],
  frame: ['Upper Body Strength', 'Lower Body Strength', 'Grip Strength', 'Stability & Balance', 'Body Composition', 'Mobility & Flexibility', 'Structural Health'],
  mind: ['Attention & Focus', 'Digital Behavior', 'Mental Practices', 'Stress & Emotional', 'Cognitive Performance'],
  metabolism: ['Glucose Regulation', 'Energy & Nutrition', 'Metabolic Health Markers', 'Hormonal Health'],
  recovery: ['Sleep Quantity', 'Sleep Quality', 'Sleep Consistency', 'Autonomic Recovery', 'Stress Recovery', 'Subjective Recovery'],
};

export type ScoreCurveType = 'linear' | 'logistic' | 'step' | 'piecewise';

export interface MetricScoring {
  id: string;
  metricDefinitionId: string;
  optimalRangeMin?: number;
  optimalRangeMax?: number;
  curveType: ScoreCurveType;
  curveParams?: Record<string, unknown>;
  createdAt: string;
}

