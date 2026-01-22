/**
 * Eden Master Activity Catalogue
 * 
 * Contains ~50 activities across 5 Primespan domains with:
 * - Cross-domain impact with tier per domain
 * - Evidence rationale for longevity relevance
 * - Required and optional logging dimensions
 * - Constraint-based variants
 */

import { Domain } from '@/lib/types';

// ============================================================================
// Types
// ============================================================================

export interface DomainImpact {
  tier: 0 | 1 | 2;
  subdomains: string[];
}

export interface ActivityVariant {
  name: string;
  constraints: string[];
}

export interface LoggingDimension {
  type: 'number' | 'string' | 'boolean';
  unit?: string;
  note?: string;
}

export interface ActivityDefinition {
  id: string;
  name: string;
  aliases: string[];
  domains: Partial<Record<Domain, DomainImpact>>;
  evidenceRationale: string;
  logging: {
    required: string[];
    optional: string[];
  };
  dimensions?: Record<string, LoggingDimension>;
  variants?: ActivityVariant[];
}

// Logging field categories for UI component reuse
export const LOGGING_FIELD_CATEGORIES = {
  common: ['date_time', 'duration_min', 'intensity_rpe', 'notes', 'location'],
  cardio: ['distance_km', 'steps', 'avg_hr_bpm', 'max_hr_bpm', 'hr_zone', 'elevation_gain_m'],
  strength: ['sets', 'reps', 'load_kg', 'exercise_variant', 'equipment', 'tempo', 'rest_sec'],
  nutrition: ['meal_type', 'protein_g', 'fiber_g', 'carbs_g', 'fat_g', 'calories_kcal', 'diet_pattern', 'alcohol_units'],
  sleep: ['bed_time', 'wake_time', 'time_in_bed_min', 'sleep_duration_min', 'sleep_quality_1_10', 'sleep_latency_min', 'wake_ups_count'],
  recovery: ['stress_1_10', 'mood_1_10', 'energy_1_10', 'soreness_1_10', 'hrv_ms', 'resting_hr_bpm'],
  supplements: ['supplement', 'dose', 'timing'],
} as const;

export const LOCATION_OPTIONS = ['home', 'gym', 'outdoors', 'travel', 'other'] as const;
export const HR_ZONE_OPTIONS = ['z1', 'z2', 'z3', 'z4', 'z5', 'unknown'] as const;
export const EQUIPMENT_OPTIONS = ['barbell', 'dumbbell', 'kettlebell', 'machine', 'cable', 'bodyweight', 'band', 'other'] as const;
export const MEAL_TYPE_OPTIONS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export const DIET_PATTERN_OPTIONS = ['mediterranean', 'whole_food', 'low_carb', 'vegetarian', 'vegan', 'other'] as const;
export const SUPPLEMENT_OPTIONS = ['creatine', 'omega3', 'vitamin_d', 'magnesium', 'glycine', 'electrolyte', 'other'] as const;
export const TIMING_OPTIONS = ['morning', 'pre_workout', 'post_workout', 'evening', 'bedtime', 'with_meal', 'other'] as const;

// ============================================================================
// Master Activity Catalogue
// ============================================================================

export const ACTIVITY_CATALOGUE: ActivityDefinition[] = [
  // =========================
  // HEART
  // =========================
  {
    id: 'heart_zone2',
    name: 'Zone 2 cardio session',
    aliases: ['easy_run', 'steady_state', 'aerobic_base'],
    domains: {
      heart: { tier: 0, subdomains: ['Aerobic Capacity', 'Cardiac Efficiency'] },
      metabolism: { tier: 1, subdomains: ['Glucose Regulation', 'Energy & Nutrition'] },
      recovery: { tier: 2, subdomains: ['Autonomic Recovery'] },
    },
    evidenceRationale: 'Sustained moderate-intensity aerobic work improves mitochondrial function and aerobic efficiency, increases stroke volume over time, lowers resting HR, improves insulin sensitivity, and supports long-term cardiovascular risk reduction.',
    logging: {
      required: ['duration_min', 'hr_zone'],
      optional: ['distance_km', 'avg_hr_bpm', 'max_hr_bpm', 'intensity_rpe', 'elevation_gain_m', 'location', 'notes'],
    },
    variants: [
      { name: 'Walk (incline)', constraints: ['no_equipment'] },
      { name: 'Cycle / spin bike', constraints: ['knee_pain', 'low_impact'] },
      { name: 'Row / swim / elliptical', constraints: ['low_impact'] },
    ],
  },
  {
    id: 'heart_hiit_intervals',
    name: 'HIIT intervals session',
    aliases: ['intervals', 'sprint_intervals'],
    domains: {
      heart: { tier: 1, subdomains: ['Aerobic Capacity'] },
      metabolism: { tier: 1, subdomains: ['Glucose Regulation'] },
      frame: { tier: 2, subdomains: ['Body Composition'] },
    },
    evidenceRationale: 'Intervals at high intensity are time-efficient for improving VO2max and cardiometabolic fitness. They can meaningfully improve glycemic control and blood pressure when recovery is adequate.',
    logging: {
      required: ['duration_min', 'intensity_rpe'],
      optional: ['avg_hr_bpm', 'max_hr_bpm', 'interval_work_sec', 'interval_rest_sec', 'intervals_count', 'location', 'notes'],
    },
    dimensions: {
      interval_work_sec: { type: 'number', unit: 'sec' },
      interval_rest_sec: { type: 'number', unit: 'sec' },
      intervals_count: { type: 'number' },
    },
    variants: [
      { name: 'Bike intervals (preferred)', constraints: ['reduce_injury_risk'] },
      { name: 'Rowing intervals', constraints: ['low_impact'] },
      { name: 'Running intervals', constraints: ['runner', 'no_joint_pain'] },
    ],
  },
  {
    id: 'heart_threshold_tempo',
    name: 'Tempo / threshold session',
    aliases: ['lactate_threshold', 'tempo_run'],
    domains: {
      heart: { tier: 1, subdomains: ['Aerobic Capacity'] },
    },
    evidenceRationale: 'Sustained "comfortably hard" work improves lactate clearance, cardiac output at higher intensities, and race/real-world performance capacity—useful once base fitness is established.',
    logging: {
      required: ['duration_min', 'intensity_rpe'],
      optional: ['distance_km', 'avg_hr_bpm', 'hr_zone', 'location', 'notes'],
    },
  },
  {
    id: 'heart_long_endurance',
    name: 'Long endurance session',
    aliases: ['long_run', 'long_ride', 'long_hike'],
    domains: {
      heart: { tier: 1, subdomains: ['Aerobic Capacity'] },
      mind: { tier: 2, subdomains: ['Stress & Emotional'] },
    },
    evidenceRationale: 'Longer low–moderate sessions build endurance, improve fat oxidation efficiency, and support mental resilience.',
    logging: {
      required: ['duration_min'],
      optional: ['distance_km', 'avg_hr_bpm', 'hr_zone', 'elevation_gain_m', 'intensity_rpe', 'location', 'notes'],
    },
  },
  {
    id: 'heart_stairs',
    name: 'Stair climbing session',
    aliases: ['stair_workout'],
    domains: {
      heart: { tier: 2, subdomains: ['Aerobic Capacity'] },
      frame: { tier: 2, subdomains: ['Lower Body Strength', 'Body Composition'] },
    },
    evidenceRationale: 'High-density vertical work can improve cardiovascular fitness and leg conditioning with minimal time, but can be joint-stressful for some.',
    logging: {
      required: ['duration_min'],
      optional: ['floors_climbed', 'intensity_rpe', 'avg_hr_bpm', 'location', 'notes'],
    },
    dimensions: {
      floors_climbed: { type: 'number' },
    },
  },
  {
    id: 'heart_breathing_resonant',
    name: 'Resonant breathing / HRV breathing',
    aliases: ['slow_breathing', 'coherent_breathing'],
    domains: {
      heart: { tier: 2, subdomains: ['Cardiac Efficiency'] },
      recovery: { tier: 1, subdomains: ['Autonomic Recovery', 'Stress Recovery'] },
      mind: { tier: 1, subdomains: ['Mental Practices', 'Stress & Emotional'] },
    },
    evidenceRationale: 'Slow-paced breathing can increase parasympathetic tone, improve HRV trend, reduce stress arousal, and improve perceived calm and recovery.',
    logging: {
      required: ['duration_min'],
      optional: ['breaths_per_min', 'stress_1_10', 'mood_1_10', 'notes'],
    },
    dimensions: {
      breaths_per_min: { type: 'number' },
    },
  },
  {
    id: 'heart_bp_measure',
    name: 'Blood pressure check',
    aliases: ['bp_reading'],
    domains: {
      heart: { tier: 1, subdomains: ['Cardiovascular Health'] },
      metabolism: { tier: 2, subdomains: ['Metabolic Health Markers'] },
    },
    evidenceRationale: 'Regular BP measurement enables earlier detection and behavior change; BP is one of the strongest modifiable cardiovascular risk factors.',
    logging: {
      required: ['systolic_mmHg', 'diastolic_mmHg'],
      optional: ['resting_hr_bpm', 'notes'],
    },
    dimensions: {
      systolic_mmHg: { type: 'number', unit: 'mmHg' },
      diastolic_mmHg: { type: 'number', unit: 'mmHg' },
    },
  },
  {
    id: 'heart_sauna',
    name: 'Sauna / heat session',
    aliases: ['heat_therapy'],
    domains: {
      heart: { tier: 2, subdomains: ['Cardiac Efficiency', 'Cardiovascular Health'] },
      recovery: { tier: 1, subdomains: ['Stress Recovery', 'Subjective Recovery'] },
      mind: { tier: 2, subdomains: ['Stress & Emotional'] },
    },
    evidenceRationale: 'Heat exposure increases heart rate and peripheral vasodilation, can support relaxation and perceived recovery, and is associated with improved cardiometabolic markers in observational research.',
    logging: {
      required: ['duration_min'],
      optional: ['temperature_c', 'hydration_l', 'notes'],
    },
    dimensions: {
      temperature_c: { type: 'number', unit: 'C' },
      hydration_l: { type: 'number', unit: 'L' },
    },
  },

  // =========================
  // FRAME
  // =========================
  {
    id: 'frame_strength_fullbody',
    name: 'Full-body strength training session',
    aliases: ['resistance_training', 'lifting'],
    domains: {
      frame: { tier: 0, subdomains: ['Upper Body Strength', 'Lower Body Strength', 'Body Composition', 'Structural Health'] },
      metabolism: { tier: 1, subdomains: ['Glucose Regulation', 'Hormonal Health'] },
      recovery: { tier: 2, subdomains: ['Subjective Recovery'] },
    },
    evidenceRationale: 'Progressive resistance training is the highest-leverage intervention for preserving and building muscle, improving bone density, functional capacity, insulin sensitivity, and body composition.',
    logging: {
      required: ['duration_min'],
      optional: ['session_plan', 'intensity_rpe', 'location', 'notes'],
    },
    dimensions: {
      session_plan: { type: 'string', note: 'Reference to a structured workout template (e.g., A, B, Upper/Lower).' },
    },
  },
  {
    id: 'frame_bench_press',
    name: 'Bench press (barbell/dumbbell/machine)',
    aliases: ['horizontal_press'],
    domains: {
      frame: { tier: 0, subdomains: ['Upper Body Strength', 'Structural Health'] },
    },
    evidenceRationale: 'Horizontal pressing builds chest/shoulder/triceps strength and supports functional pushing capacity.',
    logging: {
      required: ['sets', 'reps', 'load_kg', 'equipment'],
      optional: ['tempo', 'rest_sec', 'intensity_rpe', 'notes'],
    },
    variants: [
      { name: 'Push-up', constraints: ['no_gym'] },
      { name: 'Machine chest press', constraints: ['beginner', 'shoulder_sensitivity'] },
    ],
  },
  {
    id: 'frame_overhead_press',
    name: 'Overhead press',
    aliases: ['shoulder_press'],
    domains: {
      frame: { tier: 1, subdomains: ['Upper Body Strength', 'Structural Health'] },
    },
    evidenceRationale: 'Overhead pressing strengthens shoulders and upper back and supports overhead function; requires good mobility.',
    logging: {
      required: ['sets', 'reps', 'load_kg', 'equipment'],
      optional: ['rest_sec', 'intensity_rpe', 'notes'],
    },
  },
  {
    id: 'frame_row',
    name: 'Row (cable/dumbbell/barbell/band)',
    aliases: ['horizontal_pull'],
    domains: {
      frame: { tier: 0, subdomains: ['Upper Body Strength', 'Structural Health'] },
    },
    evidenceRationale: 'Rows strengthen the upper back and improve posture and shoulder health by balancing pushing volume.',
    logging: {
      required: ['sets', 'reps', 'load_kg', 'equipment'],
      optional: ['rest_sec', 'intensity_rpe', 'notes'],
    },
    variants: [
      { name: 'Band row', constraints: ['no_gym'] },
      { name: 'Chest-supported row', constraints: ['low_back_sensitivity'] },
    ],
  },
  {
    id: 'frame_pullup',
    name: 'Pull-up / chin-up',
    aliases: ['vertical_pull'],
    domains: {
      frame: { tier: 1, subdomains: ['Upper Body Strength', 'Grip Strength'] },
    },
    evidenceRationale: 'Vertical pulling builds lats and grip strength; strong correlate of functional strength.',
    logging: {
      required: ['sets', 'reps'],
      optional: ['assistance_kg', 'added_weight_kg', 'grip_type', 'notes'],
    },
    dimensions: {
      assistance_kg: { type: 'number', unit: 'kg' },
      added_weight_kg: { type: 'number', unit: 'kg' },
      grip_type: { type: 'string' },
    },
  },
  {
    id: 'frame_squat',
    name: 'Squat pattern (back/front/goblet)',
    aliases: ['squat'],
    domains: {
      frame: { tier: 0, subdomains: ['Lower Body Strength', 'Body Composition', 'Structural Health'] },
    },
    evidenceRationale: 'Squat patterns train quads/glutes/core, preserve mobility and functional capacity, and support long-term independence and injury resistance.',
    logging: {
      required: ['sets', 'reps', 'load_kg', 'equipment'],
      optional: ['depth', 'tempo', 'rest_sec', 'intensity_rpe', 'notes'],
    },
    dimensions: {
      depth: { type: 'string', note: 'e.g., parallel, below parallel, box squat height.' },
    },
    variants: [
      { name: 'Goblet squat', constraints: ['beginner', 'no_barbell'] },
      { name: 'Box squat', constraints: ['knee_pain', 'mobility_limit'] },
    ],
  },
  {
    id: 'frame_hinge',
    name: 'Hinge pattern (deadlift/RDL/hip hinge)',
    aliases: ['deadlift', 'rdl'],
    domains: {
      frame: { tier: 0, subdomains: ['Lower Body Strength', 'Structural Health'] },
    },
    evidenceRationale: 'Hinge training strengthens posterior chain (glutes/hamstrings/back) and improves lifting mechanics and back resilience.',
    logging: {
      required: ['sets', 'reps', 'load_kg', 'equipment'],
      optional: ['tempo', 'rest_sec', 'intensity_rpe', 'notes'],
    },
    variants: [
      { name: 'Kettlebell deadlift', constraints: ['beginner', 'low_back_sensitivity'] },
      { name: 'Romanian deadlift', constraints: ['hamstring_focus'] },
    ],
  },
  {
    id: 'frame_lunge',
    name: 'Lunge / split squat',
    aliases: ['unilateral_leg'],
    domains: {
      frame: { tier: 1, subdomains: ['Lower Body Strength', 'Stability & Balance', 'Body Composition'] },
    },
    evidenceRationale: 'Unilateral work addresses left-right imbalances, improves hip stability, and transfers to gait and athletic movement.',
    logging: {
      required: ['sets', 'reps'],
      optional: ['load_kg', 'equipment', 'intensity_rpe', 'notes'],
    },
  },
  {
    id: 'frame_carry',
    name: 'Loaded carry (farmer carry/suitcase carry)',
    aliases: ['farmers_carry'],
    domains: {
      frame: { tier: 1, subdomains: ['Grip Strength', 'Structural Health', 'Stability & Balance'] },
      heart: { tier: 2, subdomains: ['Cardiac Efficiency'] },
    },
    evidenceRationale: 'Carries build grip, trunk stability, gait integrity, and real-world strength; also provide mild conditioning stimulus.',
    logging: {
      required: ['distance_m', 'load_kg'],
      optional: ['duration_min', 'sets', 'intensity_rpe', 'carry_type', 'notes'],
    },
    dimensions: {
      distance_m: { type: 'number', unit: 'm' },
      carry_type: { type: 'string' },
    },
  },
  {
    id: 'frame_core_plank',
    name: 'Core stability (plank family)',
    aliases: ['plank', 'side_plank'],
    domains: {
      frame: { tier: 0, subdomains: ['Stability & Balance', 'Structural Health'] },
    },
    evidenceRationale: 'Core stability improves spinal control, bracing, and injury resistance, supporting all strength patterns.',
    logging: {
      required: ['duration_min'],
      optional: ['variation', 'sets', 'intensity_rpe', 'notes'],
    },
    dimensions: {
      variation: { type: 'string' },
    },
  },
  {
    id: 'frame_balance_single_leg',
    name: 'Balance practice (single-leg stance)',
    aliases: ['single_leg_balance'],
    domains: {
      frame: { tier: 1, subdomains: ['Stability & Balance'] },
      mind: { tier: 2, subdomains: ['Attention & Focus'] },
    },
    evidenceRationale: 'Balance and proprioception training reduces fall risk and improves neuromuscular control and athletic movement quality.',
    logging: {
      required: ['duration_min'],
      optional: ['eyes_open', 'support_used', 'notes'],
    },
    dimensions: {
      eyes_open: { type: 'boolean' },
      support_used: { type: 'string' },
    },
  },
  {
    id: 'frame_mobility_session',
    name: 'Mobility / flexibility session',
    aliases: ['stretching', 'yoga_mobility'],
    domains: {
      frame: { tier: 1, subdomains: ['Mobility & Flexibility', 'Structural Health'] },
      recovery: { tier: 1, subdomains: ['Subjective Recovery'] },
    },
    evidenceRationale: 'Regular mobility work preserves range of motion, improves movement quality, and reduces stiffness and pain, increasing training consistency over time.',
    logging: {
      required: ['duration_min'],
      optional: ['target_areas', 'intensity_rpe', 'notes'],
    },
    dimensions: {
      target_areas: { type: 'string' },
    },
  },
  {
    id: 'frame_posture_pre_hab',
    name: 'Posture / prehab routine',
    aliases: ['shoulder_pre_hab', 'back_pre_hab'],
    domains: {
      frame: { tier: 2, subdomains: ['Structural Health'] },
    },
    evidenceRationale: 'Targeted low-load work (scapular control, rotator cuff, hip stability) can reduce overuse injuries and improve comfort for desk-based lifestyles.',
    logging: {
      required: ['duration_min'],
      optional: ['exercises', 'notes'],
    },
    dimensions: {
      exercises: { type: 'string' },
    },
  },

  // =========================
  // METABOLISM
  // =========================
  {
    id: 'met_protein_anchor_meal',
    name: 'Protein-forward meal',
    aliases: ['high_protein_meal'],
    domains: {
      metabolism: { tier: 0, subdomains: ['Energy & Nutrition', 'Hormonal Health'] },
      frame: { tier: 1, subdomains: ['Body Composition'] },
      recovery: { tier: 2, subdomains: ['Subjective Recovery'] },
    },
    evidenceRationale: 'Adequate protein supports muscle maintenance/gain, improves satiety, and supports body composition and recovery.',
    logging: {
      required: ['meal_type', 'protein_g'],
      optional: ['calories_kcal', 'carbs_g', 'fat_g', 'notes'],
    },
  },
  {
    id: 'met_fiber_anchor_meal',
    name: 'High-fiber meal',
    aliases: ['fiber_meal'],
    domains: {
      metabolism: { tier: 1, subdomains: ['Energy & Nutrition', 'Glucose Regulation'] },
      heart: { tier: 1, subdomains: ['Cardiovascular Health'] },
    },
    evidenceRationale: 'Higher fiber intake improves satiety, supports gut microbiome, and helps regulate LDL cholesterol and post-meal glucose.',
    logging: {
      required: ['meal_type'],
      optional: ['fiber_g', 'carbs_g', 'calories_kcal', 'notes'],
    },
  },
  {
    id: 'met_mediterranean_day',
    name: 'Mediterranean-style day (diet adherence)',
    aliases: ['med_diet_day'],
    domains: {
      metabolism: { tier: 1, subdomains: ['Energy & Nutrition', 'Metabolic Health Markers'] },
      heart: { tier: 1, subdomains: ['Cardiovascular Health'] },
    },
    evidenceRationale: 'A plant-forward, unsaturated-fat, minimally processed pattern supports cardiometabolic risk reduction and long-term healthspan.',
    logging: {
      required: ['diet_pattern'],
      optional: ['calories_kcal', 'alcohol_units', 'notes'],
    },
  },
  {
    id: 'met_time_restricted_eating',
    name: 'Time-restricted eating day',
    aliases: ['tre', 'intermittent_fasting'],
    domains: {
      metabolism: { tier: 1, subdomains: ['Glucose Regulation'] },
    },
    evidenceRationale: 'Consolidating the eating window can improve energy intake control and glycemic regulation for many users, especially if it reduces late-night eating.',
    logging: {
      required: ['fasting_hours'],
      optional: ['eating_window_start', 'eating_window_end', 'hunger_1_10', 'energy_1_10', 'notes'],
    },
    dimensions: {
      fasting_hours: { type: 'number', unit: 'h' },
      eating_window_start: { type: 'string' },
      eating_window_end: { type: 'string' },
      hunger_1_10: { type: 'number' },
    },
  },
  {
    id: 'met_post_meal_walk',
    name: 'Post-meal walk',
    aliases: ['postprandial_walk'],
    domains: {
      metabolism: { tier: 2, subdomains: ['Glucose Regulation'] },
      heart: { tier: 2, subdomains: ['Cardiac Efficiency'] },
      mind: { tier: 2, subdomains: ['Stress & Emotional'] },
    },
    evidenceRationale: 'Light movement after meals can blunt post-prandial glucose spikes and improve digestion and energy.',
    logging: {
      required: ['duration_min'],
      optional: ['steps', 'meal_type', 'notes'],
    },
  },
  {
    id: 'met_hydration',
    name: 'Hydration log',
    aliases: ['water_intake'],
    domains: {
      metabolism: { tier: 1, subdomains: ['Energy & Nutrition'] },
      mind: { tier: 2, subdomains: ['Cognitive Performance'] },
      recovery: { tier: 2, subdomains: ['Subjective Recovery'] },
    },
    evidenceRationale: 'Hydration supports physical performance, cognitive function, and thermoregulation; dehydration degrades both training and focus.',
    logging: {
      required: ['water_l'],
      optional: ['caffeine_mg', 'alcohol_units', 'notes'],
    },
    dimensions: {
      water_l: { type: 'number', unit: 'L' },
      caffeine_mg: { type: 'number', unit: 'mg' },
    },
  },
  {
    id: 'met_food_prep',
    name: 'Meal prep / cooking session',
    aliases: ['cook_at_home'],
    domains: {
      metabolism: { tier: 1, subdomains: ['Energy & Nutrition'] },
      mind: { tier: 2, subdomains: ['Mental Practices'] },
    },
    evidenceRationale: 'Cooking and prep increases dietary adherence by reducing decision fatigue and lowering reliance on ultra-processed foods.',
    logging: {
      required: ['duration_min'],
      optional: ['meals_prepped_count', 'notes'],
    },
    dimensions: {
      meals_prepped_count: { type: 'number' },
    },
  },
  {
    id: 'met_labs_check',
    name: 'Metabolic labs review',
    aliases: ['bloodwork'],
    domains: {
      metabolism: { tier: 2, subdomains: ['Metabolic Health Markers'] },
      heart: { tier: 2, subdomains: ['Cardiovascular Health'] },
    },
    evidenceRationale: 'Tracking labs (lipids, HbA1c, hs-CRP) enables early detection and better targeting of lifestyle interventions.',
    logging: {
      required: ['lab_date'],
      optional: ['ldl_mg_dl', 'hdl_mg_dl', 'tg_mg_dl', 'hba1c_pct', 'hs_crp_mg_l', 'notes'],
    },
    dimensions: {
      lab_date: { type: 'string' },
      ldl_mg_dl: { type: 'number' },
      hdl_mg_dl: { type: 'number' },
      tg_mg_dl: { type: 'number' },
      hba1c_pct: { type: 'number' },
      hs_crp_mg_l: { type: 'number' },
    },
  },

  // =========================
  // RECOVERY
  // =========================
  {
    id: 'rec_sleep_log',
    name: 'Sleep (night)',
    aliases: ['sleep'],
    domains: {
      recovery: { tier: 0, subdomains: ['Sleep Quantity', 'Sleep Quality', 'Sleep Consistency'] },
      metabolism: { tier: 1, subdomains: ['Hormonal Health'] },
      mind: { tier: 1, subdomains: ['Cognitive Performance', 'Stress & Emotional'] },
      heart: { tier: 2, subdomains: ['Cardiac Efficiency'] },
    },
    evidenceRationale: 'Sleep is the primary recovery lever: supports hormone regulation, immune function, cognitive performance, appetite regulation, and training adaptation.',
    logging: {
      required: ['bed_time', 'wake_time', 'sleep_duration_min'],
      optional: ['sleep_quality_1_10', 'sleep_latency_min', 'wake_ups_count', 'notes'],
    },
  },
  {
    id: 'rec_sleep_hygiene',
    name: 'Sleep hygiene routine',
    aliases: ['wind_down', 'screen_curfew'],
    domains: {
      recovery: { tier: 0, subdomains: ['Sleep Quality', 'Sleep Consistency'] },
      mind: { tier: 1, subdomains: ['Digital Behavior', 'Stress & Emotional'] },
    },
    evidenceRationale: 'Regular wind-down, reduced light exposure, and consistent schedule improve sleep onset and sleep efficiency.',
    logging: {
      required: ['duration_min'],
      optional: ['screen_off_minutes_before_bed', 'caffeine_cutoff_time', 'alcohol_units', 'notes'],
    },
    dimensions: {
      screen_off_minutes_before_bed: { type: 'number', unit: 'min' },
      caffeine_cutoff_time: { type: 'string' },
    },
  },
  {
    id: 'rec_morning_light',
    name: 'Morning outdoor light exposure',
    aliases: ['sunlight_anchor'],
    domains: {
      recovery: { tier: 1, subdomains: ['Sleep Consistency'] },
      mind: { tier: 1, subdomains: ['Attention & Focus'] },
    },
    evidenceRationale: 'Morning light anchors circadian rhythm, improving sleep timing and daytime alertness.',
    logging: {
      required: ['duration_min'],
      optional: ['time_of_day', 'outdoors', 'notes'],
    },
    dimensions: {
      time_of_day: { type: 'string' },
      outdoors: { type: 'boolean' },
    },
  },
  {
    id: 'rec_active_recovery',
    name: 'Active recovery session (very easy)',
    aliases: ['recovery_walk', 'zone1'],
    domains: {
      recovery: { tier: 1, subdomains: ['Autonomic Recovery', 'Subjective Recovery'] },
      frame: { tier: 2, subdomains: ['Mobility & Flexibility'] },
    },
    evidenceRationale: 'Low-intensity movement increases circulation and can reduce soreness and stiffness without adding significant stress load.',
    logging: {
      required: ['duration_min'],
      optional: ['steps', 'avg_hr_bpm', 'soreness_1_10', 'notes'],
    },
  },
  {
    id: 'rec_cold_exposure',
    name: 'Cold exposure (shower/plunge)',
    aliases: ['cold_plunge', 'cold_shower'],
    domains: {
      recovery: { tier: 2, subdomains: ['Stress Recovery', 'Subjective Recovery'] },
      mind: { tier: 2, subdomains: ['Stress & Emotional'] },
    },
    evidenceRationale: 'Cold exposure can reduce perceived soreness and provide an arousal/mood effect for some users; use selectively.',
    logging: {
      required: ['duration_min'],
      optional: ['temperature_c', 'intensity_rpe', 'notes'],
    },
    dimensions: {
      temperature_c: { type: 'number', unit: 'C' },
    },
  },
  {
    id: 'rec_massage',
    name: 'Massage / myofascial release',
    aliases: ['foam_roll', 'percussive_therapy'],
    domains: {
      recovery: { tier: 2, subdomains: ['Subjective Recovery'] },
      frame: { tier: 2, subdomains: ['Mobility & Flexibility', 'Structural Health'] },
    },
    evidenceRationale: 'Soft tissue work can improve perceived recovery, reduce tightness, and support continued training adherence.',
    logging: {
      required: ['duration_min'],
      optional: ['target_areas', 'soreness_1_10', 'notes'],
    },
    dimensions: {
      target_areas: { type: 'string' },
    },
  },

  // =========================
  // MIND
  // =========================
  {
    id: 'mind_meditation',
    name: 'Meditation session',
    aliases: ['mindfulness', 'breath_meditation'],
    domains: {
      mind: { tier: 0, subdomains: ['Mental Practices', 'Stress & Emotional'] },
      recovery: { tier: 1, subdomains: ['Stress Recovery', 'Autonomic Recovery'] },
    },
    evidenceRationale: 'Meditation improves emotion regulation and reduces stress reactivity, supporting sleep and perceived well-being.',
    logging: {
      required: ['duration_min'],
      optional: ['style', 'stress_1_10', 'mood_1_10', 'notes'],
    },
    dimensions: {
      style: { type: 'string' },
    },
  },
  {
    id: 'mind_journaling',
    name: 'Journaling',
    aliases: ['gratitude_journal', 'reflection'],
    domains: {
      mind: { tier: 1, subdomains: ['Mental Practices', 'Stress & Emotional'] },
      recovery: { tier: 2, subdomains: ['Stress Recovery'] },
    },
    evidenceRationale: 'Journaling supports self-awareness, emotional processing, and behavior change through reflection and planning.',
    logging: {
      required: ['duration_min'],
      optional: ['journal_type', 'mood_1_10', 'notes'],
    },
    dimensions: {
      journal_type: { type: 'string' },
    },
  },
  {
    id: 'mind_deep_work',
    name: 'Deep work (focused block)',
    aliases: ['focus_session'],
    domains: {
      mind: { tier: 1, subdomains: ['Attention & Focus'] },
    },
    evidenceRationale: 'Single-task focused work trains attention control and improves output quality by reducing context switching.',
    logging: {
      required: ['duration_min'],
      optional: ['task', 'distractions_count', 'focus_quality_1_10', 'notes'],
    },
    dimensions: {
      task: { type: 'string' },
      distractions_count: { type: 'number' },
      focus_quality_1_10: { type: 'number' },
    },
  },
  {
    id: 'mind_digital_curfew',
    name: 'Digital curfew (no screens before bed)',
    aliases: ['screen_off'],
    domains: {
      mind: { tier: 1, subdomains: ['Digital Behavior'] },
      recovery: { tier: 1, subdomains: ['Sleep Quality', 'Sleep Consistency'] },
    },
    evidenceRationale: 'Reducing evening screen exposure can improve sleep onset and reduce mental overstimulation.',
    logging: {
      required: ['screen_off_minutes_before_bed'],
      optional: ['notes'],
    },
    dimensions: {
      screen_off_minutes_before_bed: { type: 'number', unit: 'min' },
    },
  },
  {
    id: 'mind_reading',
    name: 'Reading (long-form)',
    aliases: ['book_reading'],
    domains: {
      mind: { tier: 1, subdomains: ['Mental Practices', 'Cognitive Performance'] },
      recovery: { tier: 2, subdomains: ['Stress Recovery'] },
    },
    evidenceRationale: 'Long-form reading builds cognitive reserve, improves attention span, and can replace screen time to support sleep.',
    logging: {
      required: ['duration_min'],
      optional: ['title_or_topic', 'pages', 'notes'],
    },
    dimensions: {
      title_or_topic: { type: 'string' },
      pages: { type: 'number' },
    },
  },
  {
    id: 'mind_skill_learning',
    name: 'Skill learning practice',
    aliases: ['language_learning', 'instrument_practice'],
    domains: {
      mind: { tier: 1, subdomains: ['Cognitive Performance', 'Mental Practices'] },
    },
    evidenceRationale: 'Learning new skills drives neuroplasticity and supports long-term cognitive resilience.',
    logging: {
      required: ['duration_min'],
      optional: ['skill', 'difficulty_1_10', 'notes'],
    },
    dimensions: {
      skill: { type: 'string' },
      difficulty_1_10: { type: 'number' },
    },
  },
  {
    id: 'mind_social_connection',
    name: 'Social connection (quality time)',
    aliases: ['friend_time', 'family_time'],
    domains: {
      mind: { tier: 0, subdomains: ['Stress & Emotional'] },
      recovery: { tier: 1, subdomains: ['Stress Recovery', 'Subjective Recovery'] },
    },
    evidenceRationale: 'Social connection reduces loneliness and stress load and supports psychological well-being, which strongly impacts adherence and recovery.',
    logging: {
      required: ['duration_min'],
      optional: ['context', 'mood_1_10', 'notes'],
    },
    dimensions: {
      context: { type: 'string' },
    },
  },
  {
    id: 'mind_nature_time',
    name: 'Nature time / outdoors restoration',
    aliases: ['forest_walk', 'park_time'],
    domains: {
      mind: { tier: 1, subdomains: ['Stress & Emotional'] },
      recovery: { tier: 1, subdomains: ['Stress Recovery'] },
    },
    evidenceRationale: 'Time in nature reduces stress arousal and supports attention restoration, improving mood and recovery.',
    logging: {
      required: ['duration_min'],
      optional: ['activity', 'location', 'mood_1_10', 'stress_1_10', 'notes'],
    },
    dimensions: {
      activity: { type: 'string' },
    },
  },
  {
    id: 'mind_therapy_coaching',
    name: 'Therapy / coaching session',
    aliases: ['therapy', 'coaching'],
    domains: {
      mind: { tier: 1, subdomains: ['Stress & Emotional'] },
    },
    evidenceRationale: 'Structured support can improve coping skills, emotional regulation, and behavior change—often increasing adherence across all domains.',
    logging: {
      required: ['duration_min'],
      optional: ['session_type', 'key_takeaway', 'notes'],
    },
    dimensions: {
      session_type: { type: 'string' },
      key_takeaway: { type: 'string' },
    },
  },

  // =========================
  // SUPPLEMENTS
  // =========================
  {
    id: 'supp_creatine',
    name: 'Creatine intake',
    aliases: ['creatine'],
    domains: {
      frame: { tier: 1, subdomains: ['Body Composition'] },
      metabolism: { tier: 2, subdomains: ['Hormonal Health'] },
    },
    evidenceRationale: 'Creatine supports training capacity and strength gains, which supports muscle preservation over time.',
    logging: {
      required: ['supplement', 'dose', 'timing'],
      optional: ['notes'],
    },
  },
  {
    id: 'supp_omega3',
    name: 'Omega-3 intake',
    aliases: ['fish_oil'],
    domains: {
      heart: { tier: 2, subdomains: ['Cardiovascular Health'] },
      metabolism: { tier: 2, subdomains: ['Metabolic Health Markers'] },
    },
    evidenceRationale: 'Omega-3 supports triglyceride management and may support inflammation balance; effects depend on baseline intake.',
    logging: {
      required: ['supplement', 'dose', 'timing'],
      optional: ['notes'],
    },
  },
  {
    id: 'supp_vitamin_d',
    name: 'Vitamin D intake',
    aliases: ['vit_d'],
    domains: {
      recovery: { tier: 2, subdomains: ['Subjective Recovery'] },
      metabolism: { tier: 2, subdomains: ['Hormonal Health'] },
    },
    evidenceRationale: 'Vitamin D supports musculoskeletal health and immune function when baseline levels are insufficient.',
    logging: {
      required: ['supplement', 'dose', 'timing'],
      optional: ['notes'],
    },
  },
  {
    id: 'supp_magnesium',
    name: 'Magnesium intake',
    aliases: ['magnesium'],
    domains: {
      recovery: { tier: 2, subdomains: ['Sleep Quality'] },
    },
    evidenceRationale: 'Magnesium can support sleep and neuromuscular function, especially if dietary intake is low.',
    logging: {
      required: ['supplement', 'dose', 'timing'],
      optional: ['notes'],
    },
  },
  {
    id: 'custom_activity',
    name: 'Custom activity (user-defined)',
    aliases: ['other'],
    domains: {},
    evidenceRationale: 'Allows users to log reality even when an activity is not yet represented. Coach can map later via tagging.',
    logging: {
      required: ['duration_min', 'notes'],
      optional: ['intensity_rpe', 'location'],
    },
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get activity by ID
 */
export function getActivityById(id: string): ActivityDefinition | undefined {
  return ACTIVITY_CATALOGUE.find(a => a.id === id);
}

/**
 * Get activity by name or alias (case-insensitive)
 */
export function getActivityByNameOrAlias(nameOrAlias: string): ActivityDefinition | undefined {
  const lower = nameOrAlias.toLowerCase();
  return ACTIVITY_CATALOGUE.find(a => 
    a.name.toLowerCase() === lower || 
    a.aliases.some(alias => alias.toLowerCase() === lower)
  );
}

/**
 * Get all activities for a specific domain
 */
export function getActivitiesByDomain(domain: Domain): ActivityDefinition[] {
  return ACTIVITY_CATALOGUE.filter(a => domain in a.domains);
}

/**
 * Get activities by tier for a specific domain
 */
export function getActivitiesByTier(domain: Domain, tier: 0 | 1 | 2): ActivityDefinition[] {
  return ACTIVITY_CATALOGUE.filter(a => {
    const domainInfo = a.domains[domain];
    return domainInfo && domainInfo.tier === tier;
  });
}

/**
 * Get all Tier 0 activities across all domains
 */
export function getTier0Activities(): ActivityDefinition[] {
  return ACTIVITY_CATALOGUE.filter(a => 
    Object.values(a.domains).some(d => d.tier === 0)
  );
}

/**
 * Get activities that have variants matching the given constraints
 */
export function getVariantsForConstraints(activityId: string, constraints: string[]): ActivityVariant[] {
  const activity = getActivityById(activityId);
  if (!activity?.variants) return [];
  
  return activity.variants.filter(v => 
    v.constraints.some(c => constraints.includes(c))
  );
}

/**
 * Get the primary domain for an activity (lowest tier = most impactful)
 */
export function getPrimaryDomain(activity: ActivityDefinition): Domain | null {
  const domains = Object.entries(activity.domains) as [Domain, DomainImpact][];
  if (domains.length === 0) return null;
  
  domains.sort((a, b) => a[1].tier - b[1].tier);
  return domains[0][0];
}

/**
 * Get display-friendly tier label
 */
export function getTierLabel(tier: 0 | 1 | 2): string {
  switch (tier) {
    case 0: return 'Foundational';
    case 1: return 'High ROI';
    case 2: return 'Situational';
  }
}

// ============================================================================
// Prompt Formatters
// ============================================================================

/**
 * Format catalogue for protocol generation prompt
 * Shows activities grouped by domain with evidence rationale
 */
export function formatCatalogueForProtocolGeneration(): string {
  const lines: string[] = ['## Activity Catalogue\n'];
  
  const domains: Domain[] = ['heart', 'frame', 'metabolism', 'recovery', 'mind'];
  
  for (const domain of domains) {
    const domainActivities = ACTIVITY_CATALOGUE.filter(a => domain in a.domains);
    if (domainActivities.length === 0) continue;
    
    lines.push(`### ${domain.toUpperCase()}\n`);
    
    for (const activity of domainActivities) {
      lines.push(`- **${activity.name}** (id: ${activity.id})`);
      lines.push(`  ${activity.evidenceRationale.slice(0, 120)}...`);
      if (activity.variants && activity.variants.length > 0) {
        lines.push(`  Variants: ${activity.variants.map(v => v.name).join(', ')}`);
      }
      lines.push('');
    }
  }
  
  return lines.join('\n');
}

/**
 * Format catalogue for chat prompt (abbreviated: names grouped by domain)
 */
export function formatCatalogueForChat(): string {
  const lines: string[] = ['## Activity Reference\n'];
  
  const domains: Domain[] = ['heart', 'frame', 'metabolism', 'recovery', 'mind'];
  
  for (const domain of domains) {
    const domainActivities = ACTIVITY_CATALOGUE.filter(a => domain in a.domains);
    if (domainActivities.length === 0) continue;
    
    lines.push(`**${domain.toUpperCase()}**: ${domainActivities.map(a => a.name).join(', ')}`);
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Format activity for display in protocol or plan
 */
export function formatActivityForDisplay(activityId: string): string {
  const activity = getActivityById(activityId);
  if (!activity) return activityId;
  return activity.name;
}
