-- Eden v2 Metrics Tests + Scoring + Unit Preferences
-- ============================================================

-- User unit preference (metric/imperial)
alter table user_profiles
  add column if not exists unit_system text
  default 'metric'
  check (unit_system in ('metric', 'imperial'));

-- Extend metric_definitions to support grouping and canonical units
alter table metric_definitions
  add column if not exists canonical_unit text,
  add column if not exists unit_family text,
  add column if not exists is_active boolean default true,
  add column if not exists is_derived boolean default false;

-- Metric tests (test-specific entries)
create table metric_tests (
  id uuid primary key default gen_random_uuid(),
  metric_definition_id uuid references metric_definitions(id) on delete cascade not null,
  test_key text not null,
  name text not null,
  unit text,
  canonical_unit text,
  unit_family text,
  value_type text not null check (value_type in ('number', 'duration', 'scale_1_10', 'boolean', 'text')),
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(metric_definition_id, test_key)
);

create index idx_metric_tests_definition on metric_tests(metric_definition_id);

alter table metric_tests enable row level security;

create policy "Authenticated users can view metric tests"
  on metric_tests for select
  to authenticated
  using (true);

-- Metric scoring metadata (optimal ranges + scoring curve)
drop table if exists metric_scoring;
create table metric_scoring (
  id uuid primary key default gen_random_uuid(),
  metric_test_id uuid references metric_tests(id) on delete cascade not null,
  optimal_range_min numeric,
  optimal_range_max numeric,
  lower_bound numeric,
  upper_bound numeric,
  score_curve text default 'range',
  curve_params jsonb default '{}'::jsonb,
  weight numeric default 1,
  created_at timestamptz default now(),
  unique(metric_test_id)
);

alter table metric_scoring enable row level security;

create policy "Authenticated users can view metric scoring"
  on metric_scoring for select
  to authenticated
  using (true);

-- Extend user_metric_entries to reference metric_tests
alter table user_metric_entries
  add column if not exists metric_test_id uuid references metric_tests(id) on delete set null;

create index idx_user_metric_entries_test on user_metric_entries(metric_test_id);

-- Seed default tests from existing metric_definitions
insert into metric_tests (metric_definition_id, test_key, name, unit, canonical_unit, unit_family, value_type)
select
  id,
  lower(regexp_replace(name, '[^a-zA-Z0-9]+', '_', 'g')),
  name,
  unit,
  unit,
  null,
  value_type
from metric_definitions;

-- Assign unit families for common types
update metric_tests
set unit_family = 'duration',
    canonical_unit = 'minutes'
where value_type = 'duration';

update metric_tests
set unit_family = 'count',
    canonical_unit = 'reps'
where unit ilike '%rep%' or name ilike '%rep%';

update metric_tests
set unit_family = 'mass',
    canonical_unit = 'kg'
where unit ilike '%kg%' or unit ilike '%lb%';

update metric_tests
set unit_family = 'length',
    canonical_unit = 'cm'
where unit ilike '%cm%' or unit ilike '%in%';

update metric_tests
set unit_family = 'pressure',
    canonical_unit = 'mmHg'
where unit ilike '%mmhg%';

update metric_tests
set unit_family = 'percent',
    canonical_unit = '%'
where unit like '%\%%';

update metric_tests
set unit_family = 'temperature',
    canonical_unit = 'C'
where unit ilike '%c%' and name ilike '%temperature%';

update metric_tests t
set unit_family = 'glucose',
    canonical_unit = 'mg/dL'
from metric_definitions d
where t.metric_definition_id = d.id
  and (t.name ilike '%glucose%' or d.sub_domain ilike '%glucose%');

update metric_tests
set unit_family = 'lipid',
    canonical_unit = 'mg/dL'
where name ilike '%ldl%' or name ilike '%hdl%' or name ilike '%triglycer%';

-- Test-specific entries for mixed-unit metrics
with pushing as (
  select id from metric_definitions
  where name = 'Pushing Strength' and sub_domain = 'Upper Body Strength'
  limit 1
)
insert into metric_tests (metric_definition_id, test_key, name, unit, canonical_unit, unit_family, value_type)
select id, 'pushup_max_reps', 'Push-up Max (reps)', 'reps', 'reps', 'count', 'number' from pushing
union all
select id, 'bench_press_1rm_kg', 'Bench Press 1RM (kg)', 'kg', 'kg', 'mass', 'number' from pushing
union all
select id, 'dumbbell_press_max_kg', 'Dumbbell Press Max (kg)', 'kg', 'kg', 'mass', 'number' from pushing;

with pulling as (
  select id from metric_definitions
  where name = 'Pulling Strength' and sub_domain = 'Upper Body Strength'
  limit 1
)
insert into metric_tests (metric_definition_id, test_key, name, unit, canonical_unit, unit_family, value_type)
select id, 'pullup_max_reps', 'Pull-up Max (reps)', 'reps', 'reps', 'count', 'number' from pulling
union all
select id, 'row_max_kg', 'Row Max (kg)', 'kg', 'kg', 'mass', 'number' from pulling
union all
select id, 'lat_pulldown_max_kg', 'Lat Pulldown Max (kg)', 'kg', 'kg', 'mass', 'number' from pulling;

with leg_strength as (
  select id from metric_definitions
  where name = 'Leg Strength' and sub_domain = 'Lower Body Strength'
  limit 1
)
insert into metric_tests (metric_definition_id, test_key, name, unit, canonical_unit, unit_family, value_type)
select id, 'sit_to_stand_30s_reps', '30-sec Sit-to-Stand (reps)', 'reps', 'reps', 'count', 'number' from leg_strength
union all
select id, 'squat_1rm_kg', 'Squat 1RM (kg)', 'kg', 'kg', 'mass', 'number' from leg_strength
union all
select id, 'leg_press_1rm_kg', 'Leg Press 1RM (kg)', 'kg', 'kg', 'mass', 'number' from leg_strength;

with leg_endurance as (
  select id from metric_definitions
  where name = 'Leg Endurance' and sub_domain = 'Lower Body Strength'
  limit 1
)
insert into metric_tests (metric_definition_id, test_key, name, unit, canonical_unit, unit_family, value_type)
select id, 'wall_sit_time_minutes', 'Wall Sit Time (min)', 'minutes', 'minutes', 'duration', 'duration' from leg_endurance
union all
select id, 'squat_hold_time_minutes', 'Squat Hold Time (min)', 'minutes', 'minutes', 'duration', 'duration' from leg_endurance
union all
select id, 'bodyweight_squat_reps', 'Bodyweight Squat (reps)', 'reps', 'reps', 'count', 'number' from leg_endurance;

with grip as (
  select id from metric_definitions
  where name = 'Grip' and sub_domain = 'Grip Strength'
  limit 1
)
insert into metric_tests (metric_definition_id, test_key, name, unit, canonical_unit, unit_family, value_type)
select id, 'dynamometer_kg', 'Dynamometer (kg)', 'kg', 'kg', 'mass', 'number' from grip
union all
select id, 'dead_hang_time_minutes', 'Dead Hang Time (min)', 'minutes', 'minutes', 'duration', 'duration' from grip
union all
select id, 'farmer_carry_time_minutes', 'Farmer Carry Time (min)', 'minutes', 'minutes', 'duration', 'duration' from grip;

with balance as (
  select id from metric_definitions
  where name = 'Balance' and sub_domain = 'Stability & Balance'
  limit 1
)
insert into metric_tests (metric_definition_id, test_key, name, unit, canonical_unit, unit_family, value_type)
select id, 'single_leg_stand_closed_minutes', 'Single-Leg Stand Eyes Closed (min)', 'minutes', 'minutes', 'duration', 'duration' from balance
union all
select id, 'single_leg_stand_open_minutes', 'Single-Leg Stand Eyes Open (min)', 'minutes', 'minutes', 'duration', 'duration' from balance
union all
select id, 'balance_board_time_minutes', 'Balance Board Time (min)', 'minutes', 'minutes', 'duration', 'duration' from balance;

with core as (
  select id from metric_definitions
  where name = 'Core Stability' and sub_domain = 'Stability & Balance'
  limit 1
)
insert into metric_tests (metric_definition_id, test_key, name, unit, canonical_unit, unit_family, value_type)
select id, 'plank_hold_minutes', 'Plank Hold (min)', 'minutes', 'minutes', 'duration', 'duration' from core
union all
select id, 'side_plank_hold_minutes', 'Side Plank Hold (min)', 'minutes', 'minutes', 'duration', 'duration' from core
union all
select id, 'dead_bug_reps', 'Dead Bug (reps)', 'reps', 'reps', 'count', 'number' from core;

with bp as (
  select id from metric_definitions
  where name = 'Blood Pressure' and sub_domain = 'Cardiovascular Health'
  limit 1
)
insert into metric_tests (metric_definition_id, test_key, name, unit, canonical_unit, unit_family, value_type)
select id, 'systolic_mmhg', 'Systolic (mmHg)', 'mmHg', 'mmHg', 'pressure', 'number' from bp
union all
select id, 'diastolic_mmhg', 'Diastolic (mmHg)', 'mmHg', 'mmHg', 'pressure', 'number' from bp;

with lipids as (
  select id from metric_definitions
  where name = 'LDL / HDL' and sub_domain = 'Cardiovascular Health'
  limit 1
)
insert into metric_tests (metric_definition_id, test_key, name, unit, canonical_unit, unit_family, value_type)
select id, 'ldl_mg_dl', 'LDL (mg/dL)', 'mg/dL', 'mg/dL', 'lipid', 'number' from lipids
union all
select id, 'hdl_mg_dl', 'HDL (mg/dL)', 'mg/dL', 'mg/dL', 'lipid', 'number' from lipids;

-- Deactivate default tests for mixed metrics
update metric_tests
set is_active = false
where metric_definition_id in (
  select id from metric_definitions
  where name in (
    'Pushing Strength',
    'Pulling Strength',
    'Leg Strength',
    'Leg Endurance',
    'Grip',
    'Balance',
    'Core Stability',
    'Blood Pressure',
    'LDL / HDL'
  )
);

-- Backfill metric_test_id for existing entries (default test)
update user_metric_entries e
set metric_test_id = t.id
from metric_tests t
where e.metric_test_id is null
  and t.metric_definition_id = e.metric_definition_id
  and t.is_active = true;
