-- Migration: Eden Health OS - Activity System & Protocol Enhancements
-- ============================================================
-- This migration adds:
-- 1. Activity definitions table (master catalogue)
-- 2. Planned activities table (weekly recommendations)
-- 3. Activity logs table (what user did)
-- 4. Protocol enhancements (narrative, phases, active_protocols, weekly_rhythm)

-- ============================================================
-- Activity Definitions (Master Catalogue)
-- ============================================================

create table if not exists activity_definitions (
  id varchar(50) primary key,
  name varchar(100) not null,
  aliases text[] default '{}',
  domains jsonb not null default '{}',
  evidence_rationale text,
  logging_required text[] default '{}',
  logging_optional text[] default '{}',
  dimensions jsonb default '{}',
  variants jsonb default '[]',
  is_custom boolean default false,
  user_id uuid references user_profiles(id) on delete cascade,
  created_at timestamptz default now()
);

comment on table activity_definitions is 'Master catalogue of all Primespan activities with tiers, evidence rationale, and logging dimensions';
comment on column activity_definitions.domains is 'Cross-domain impact: {domain: {tier: 0|1|2, subdomains: [...]}}';
comment on column activity_definitions.variants is 'Constraint-based variants: [{name, constraints: [...]}]';

-- Index for domain lookups
create index if not exists idx_activity_definitions_domains on activity_definitions using gin(domains);
create index if not exists idx_activity_definitions_custom on activity_definitions(user_id) where is_custom = true;

-- RLS for activity definitions
alter table activity_definitions enable row level security;

create policy "Anyone can read master activities"
  on activity_definitions for select
  using (is_custom = false or user_id = auth.uid());

create policy "Users can insert own custom activities"
  on activity_definitions for insert
  with check (is_custom = true and user_id = auth.uid());

create policy "Users can update own custom activities"
  on activity_definitions for update
  using (is_custom = true and user_id = auth.uid());

create policy "Users can delete own custom activities"
  on activity_definitions for delete
  using (is_custom = true and user_id = auth.uid());

-- ============================================================
-- Planned Activities (Weekly Recommendations)
-- ============================================================

create table if not exists planned_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  week_start_date date not null,
  activity_definition_id varchar(50) references activity_definitions(id),
  domain varchar(20) not null check (domain in ('heart', 'frame', 'mind', 'metabolism', 'recovery')),
  day_of_week int check (day_of_week between 0 and 6),
  target_value numeric not null,
  target_unit varchar(20) not null,
  details text,
  status varchar(20) default 'planned' check (status in ('planned', 'logged', 'skipped')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table planned_activities is 'Weekly activity recommendations from protocol';
comment on column planned_activities.day_of_week is 'Day of week (0=Sunday, 6=Saturday), null means anytime this week';

-- Indexes
create index if not exists idx_planned_activities_user_week on planned_activities(user_id, week_start_date);
create index if not exists idx_planned_activities_status on planned_activities(user_id, status);

-- RLS for planned activities
alter table planned_activities enable row level security;

create policy "Users can view own planned activities"
  on planned_activities for select
  using (auth.uid() = user_id);

create policy "Users can insert own planned activities"
  on planned_activities for insert
  with check (auth.uid() = user_id);

create policy "Users can update own planned activities"
  on planned_activities for update
  using (auth.uid() = user_id);

create policy "Users can delete own planned activities"
  on planned_activities for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Activity Logs (What User Did)
-- ============================================================

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  activity_definition_id varchar(50) references activity_definitions(id),
  planned_activity_id uuid references planned_activities(id) on delete set null,
  domain varchar(20) not null check (domain in ('heart', 'frame', 'mind', 'metabolism', 'recovery')),
  activity_type varchar(50),
  date date not null,
  data jsonb not null default '{}',
  notes text,
  created_at timestamptz default now()
);

comment on table activity_logs is 'User activity log entries with flexible data schema';
comment on column activity_logs.data is 'Flexible logging data based on activity type (duration_min, sets, reps, etc.)';
comment on column activity_logs.activity_type is 'Subtype like Walk, Bike, Upper Body, etc.';

-- Indexes
create index if not exists idx_activity_logs_user_date on activity_logs(user_id, date);
create index if not exists idx_activity_logs_activity on activity_logs(activity_definition_id);
create index if not exists idx_activity_logs_planned on activity_logs(planned_activity_id);

-- RLS for activity logs
alter table activity_logs enable row level security;

create policy "Users can view own activity logs"
  on activity_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own activity logs"
  on activity_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own activity logs"
  on activity_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own activity logs"
  on activity_logs for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Protocol Enhancements
-- ============================================================

-- Add new columns to protocols table
alter table protocols add column if not exists narrative jsonb default '{}';
alter table protocols add column if not exists phases jsonb default '[]';
alter table protocols add column if not exists active_protocols jsonb default '[]';
alter table protocols add column if not exists weekly_rhythm jsonb default '[]';

comment on column protocols.narrative is 'Strategic narrative: {why, approach, expectedOutcomes}';
comment on column protocols.phases is 'Protocol phases: [{name, weeks: [start, end], focus}]';
comment on column protocols.active_protocols is 'Active protocols from catalogue: [{activityId, domain, tier, weeklyTarget, personalization, variants, unlocksAtWeek}]';
comment on column protocols.weekly_rhythm is 'Weekly day roles: [{dayOfWeek, role, primaryActivities, notes}]';

-- ============================================================
-- Seed Master Activity Definitions
-- ============================================================

-- Insert core activities (only if they don't exist)
insert into activity_definitions (id, name, aliases, domains, evidence_rationale, logging_required, logging_optional, variants, is_custom) values

-- HEART
('heart_zone2', 'Zone 2 cardio session', array['easy_run', 'steady_state', 'aerobic_base'],
  '{"heart": {"tier": 0, "subdomains": ["Aerobic Capacity", "Cardiac Efficiency"]}, "metabolism": {"tier": 1, "subdomains": ["Glucose Regulation", "Energy & Nutrition"]}, "recovery": {"tier": 2, "subdomains": ["Autonomic Recovery"]}}'::jsonb,
  'Sustained moderate-intensity aerobic work improves mitochondrial function and aerobic efficiency, increases stroke volume over time, lowers resting HR, improves insulin sensitivity, and supports long-term cardiovascular risk reduction.',
  array['duration_min', 'hr_zone'], array['distance_km', 'avg_hr_bpm', 'max_hr_bpm', 'intensity_rpe', 'elevation_gain_m', 'location', 'notes'],
  '[{"name": "Walk (incline)", "constraints": ["no_equipment"]}, {"name": "Cycle / spin bike", "constraints": ["knee_pain", "low_impact"]}, {"name": "Row / swim / elliptical", "constraints": ["low_impact"]}]'::jsonb,
  false),

('heart_hiit_intervals', 'HIIT intervals session', array['intervals', 'sprint_intervals'],
  '{"heart": {"tier": 1, "subdomains": ["Aerobic Capacity"]}, "metabolism": {"tier": 1, "subdomains": ["Glucose Regulation"]}, "frame": {"tier": 2, "subdomains": ["Body Composition"]}}'::jsonb,
  'Intervals at high intensity are time-efficient for improving VO2max and cardiometabolic fitness.',
  array['duration_min', 'intensity_rpe'], array['avg_hr_bpm', 'max_hr_bpm', 'interval_work_sec', 'interval_rest_sec', 'intervals_count', 'location', 'notes'],
  '[{"name": "Bike intervals", "constraints": ["reduce_injury_risk"]}, {"name": "Rowing intervals", "constraints": ["low_impact"]}, {"name": "Running intervals", "constraints": ["runner", "no_joint_pain"]}]'::jsonb,
  false),

-- FRAME
('frame_strength_fullbody', 'Full-body strength training session', array['resistance_training', 'lifting'],
  '{"frame": {"tier": 0, "subdomains": ["Upper Body Strength", "Lower Body Strength", "Body Composition", "Structural Health"]}, "metabolism": {"tier": 1, "subdomains": ["Glucose Regulation", "Hormonal Health"]}, "recovery": {"tier": 2, "subdomains": ["Subjective Recovery"]}}'::jsonb,
  'Progressive resistance training is the highest-leverage intervention for preserving and building muscle, improving bone density, functional capacity, insulin sensitivity, and body composition.',
  array['duration_min'], array['session_plan', 'intensity_rpe', 'location', 'notes'],
  null,
  false),

('frame_squat', 'Squat pattern (back/front/goblet)', array['squat'],
  '{"frame": {"tier": 0, "subdomains": ["Lower Body Strength", "Body Composition", "Structural Health"]}}'::jsonb,
  'Squat patterns train quads/glutes/core, preserve mobility and functional capacity, and support long-term independence and injury resistance.',
  array['sets', 'reps', 'load_kg', 'equipment'], array['depth', 'tempo', 'rest_sec', 'intensity_rpe', 'notes'],
  '[{"name": "Goblet squat", "constraints": ["beginner", "no_barbell"]}, {"name": "Box squat", "constraints": ["knee_pain", "mobility_limit"]}]'::jsonb,
  false),

('frame_hinge', 'Hinge pattern (deadlift/RDL/hip hinge)', array['deadlift', 'rdl'],
  '{"frame": {"tier": 0, "subdomains": ["Lower Body Strength", "Structural Health"]}}'::jsonb,
  'Hinge training strengthens posterior chain (glutes/hamstrings/back) and improves lifting mechanics and back resilience.',
  array['sets', 'reps', 'load_kg', 'equipment'], array['tempo', 'rest_sec', 'intensity_rpe', 'notes'],
  '[{"name": "Kettlebell deadlift", "constraints": ["beginner", "low_back_sensitivity"]}, {"name": "Romanian deadlift", "constraints": ["hamstring_focus"]}]'::jsonb,
  false),

('frame_row', 'Row (cable/dumbbell/barbell/band)', array['horizontal_pull'],
  '{"frame": {"tier": 0, "subdomains": ["Upper Body Strength", "Structural Health"]}}'::jsonb,
  'Rows strengthen the upper back and improve posture and shoulder health by balancing pushing volume.',
  array['sets', 'reps', 'load_kg', 'equipment'], array['rest_sec', 'intensity_rpe', 'notes'],
  '[{"name": "Band row", "constraints": ["no_gym"]}, {"name": "Chest-supported row", "constraints": ["low_back_sensitivity"]}]'::jsonb,
  false),

('frame_bench_press', 'Bench press (barbell/dumbbell/machine)', array['horizontal_press'],
  '{"frame": {"tier": 0, "subdomains": ["Upper Body Strength", "Structural Health"]}}'::jsonb,
  'Horizontal pressing builds chest/shoulder/triceps strength and supports functional pushing capacity.',
  array['sets', 'reps', 'load_kg', 'equipment'], array['tempo', 'rest_sec', 'intensity_rpe', 'notes'],
  '[{"name": "Push-up", "constraints": ["no_gym"]}, {"name": "Machine chest press", "constraints": ["beginner", "shoulder_sensitivity"]}]'::jsonb,
  false),

('frame_core_plank', 'Core stability (plank family)', array['plank', 'side_plank'],
  '{"frame": {"tier": 0, "subdomains": ["Stability & Balance", "Structural Health"]}}'::jsonb,
  'Core stability improves spinal control, bracing, and injury resistance, supporting all strength patterns.',
  array['duration_min'], array['variation', 'sets', 'intensity_rpe', 'notes'],
  null,
  false),

-- METABOLISM
('met_protein_anchor_meal', 'Protein-forward meal', array['high_protein_meal'],
  '{"metabolism": {"tier": 0, "subdomains": ["Energy & Nutrition", "Hormonal Health"]}, "frame": {"tier": 1, "subdomains": ["Body Composition"]}, "recovery": {"tier": 2, "subdomains": ["Subjective Recovery"]}}'::jsonb,
  'Adequate protein supports muscle maintenance/gain, improves satiety, and supports body composition and recovery.',
  array['meal_type', 'protein_g'], array['calories_kcal', 'carbs_g', 'fat_g', 'notes'],
  null,
  false),

('met_hydration', 'Hydration log', array['water_intake'],
  '{"metabolism": {"tier": 1, "subdomains": ["Energy & Nutrition"]}, "mind": {"tier": 2, "subdomains": ["Cognitive Performance"]}, "recovery": {"tier": 2, "subdomains": ["Subjective Recovery"]}}'::jsonb,
  'Hydration supports physical performance, cognitive function, and thermoregulation.',
  array['water_l'], array['caffeine_mg', 'alcohol_units', 'notes'],
  null,
  false),

-- RECOVERY
('rec_sleep_log', 'Sleep (night)', array['sleep'],
  '{"recovery": {"tier": 0, "subdomains": ["Sleep Quantity", "Sleep Quality", "Sleep Consistency"]}, "metabolism": {"tier": 1, "subdomains": ["Hormonal Health"]}, "mind": {"tier": 1, "subdomains": ["Cognitive Performance", "Stress & Emotional"]}, "heart": {"tier": 2, "subdomains": ["Cardiac Efficiency"]}}'::jsonb,
  'Sleep is the primary recovery lever: supports hormone regulation, immune function, cognitive performance, appetite regulation, and training adaptation.',
  array['bed_time', 'wake_time', 'sleep_duration_min'], array['sleep_quality_1_10', 'sleep_latency_min', 'wake_ups_count', 'notes'],
  null,
  false),

('rec_sleep_hygiene', 'Sleep hygiene routine', array['wind_down', 'screen_curfew'],
  '{"recovery": {"tier": 0, "subdomains": ["Sleep Quality", "Sleep Consistency"]}, "mind": {"tier": 1, "subdomains": ["Digital Behavior", "Stress & Emotional"]}}'::jsonb,
  'Regular wind-down, reduced light exposure, and consistent schedule improve sleep onset and sleep efficiency.',
  array['duration_min'], array['screen_off_minutes_before_bed', 'caffeine_cutoff_time', 'alcohol_units', 'notes'],
  null,
  false),

('rec_morning_light', 'Morning outdoor light exposure', array['sunlight_anchor'],
  '{"recovery": {"tier": 1, "subdomains": ["Sleep Consistency"]}, "mind": {"tier": 1, "subdomains": ["Attention & Focus"]}}'::jsonb,
  'Morning light anchors circadian rhythm, improving sleep timing and daytime alertness.',
  array['duration_min'], array['time_of_day', 'outdoors', 'notes'],
  null,
  false),

-- MIND
('mind_meditation', 'Meditation session', array['mindfulness', 'breath_meditation'],
  '{"mind": {"tier": 0, "subdomains": ["Mental Practices", "Stress & Emotional"]}, "recovery": {"tier": 1, "subdomains": ["Stress Recovery", "Autonomic Recovery"]}}'::jsonb,
  'Meditation improves emotion regulation and reduces stress reactivity, supporting sleep and perceived well-being.',
  array['duration_min'], array['style', 'stress_1_10', 'mood_1_10', 'notes'],
  null,
  false),

('mind_social_connection', 'Social connection (quality time)', array['friend_time', 'family_time'],
  '{"mind": {"tier": 0, "subdomains": ["Stress & Emotional"]}, "recovery": {"tier": 1, "subdomains": ["Stress Recovery", "Subjective Recovery"]}}'::jsonb,
  'Social connection reduces loneliness and stress load and supports psychological well-being, which strongly impacts adherence and recovery.',
  array['duration_min'], array['context', 'mood_1_10', 'notes'],
  null,
  false),

('mind_deep_work', 'Deep work (focused block)', array['focus_session'],
  '{"mind": {"tier": 1, "subdomains": ["Attention & Focus"]}}'::jsonb,
  'Single-task focused work trains attention control and improves output quality by reducing context switching.',
  array['duration_min'], array['task', 'distractions_count', 'focus_quality_1_10', 'notes'],
  null,
  false),

-- Custom activity placeholder
('custom_activity', 'Custom activity (user-defined)', array['other'],
  '{}'::jsonb,
  'Allows users to log reality even when an activity is not yet represented.',
  array['duration_min', 'notes'], array['intensity_rpe', 'location'],
  null,
  false)

on conflict (id) do nothing;

-- ============================================================
-- Helper function for activity progress aggregation
-- ============================================================

create or replace function get_weekly_activity_progress(
  p_user_id uuid,
  p_week_start_date date
) returns table (
  domain varchar(20),
  activity_definition_id varchar(50),
  target_value numeric,
  target_unit varchar(20),
  logged_value numeric,
  logged_count int,
  status varchar(20)
) as $$
begin
  return query
  select 
    pa.domain,
    pa.activity_definition_id,
    sum(pa.target_value) as target_value,
    pa.target_unit,
    coalesce(sum((al.data->>'duration_min')::numeric), 0) as logged_value,
    count(al.id)::int as logged_count,
    case 
      when count(al.id) >= count(pa.id) then 'logged'
      when bool_or(pa.status = 'skipped') then 'skipped'
      else 'planned'
    end as status
  from planned_activities pa
  left join activity_logs al on al.planned_activity_id = pa.id
  where pa.user_id = p_user_id
    and pa.week_start_date = p_week_start_date
  group by pa.domain, pa.activity_definition_id, pa.target_unit;
end;
$$ language plpgsql security definer;
