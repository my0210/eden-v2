-- Eden v2 Metric Definition Updates (post-tests)
-- ============================================================
-- Normalize units, split test-specific metrics, mark inactive definitions

-- 1) Mark mixed lab metrics as inactive instead of deleting
update metric_definitions
set is_active = false
where (domain = 'heart' and sub_domain = 'Cardiovascular Health' and name in ('Blood Pressure', 'LDL / HDL'))
   or (domain = 'metabolism' and sub_domain = 'Metabolic Health Markers' and name = 'ALT / AST');

-- 2) Insert test-specific lab metrics (if not already present)
insert into metric_definitions (
  domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order,
  canonical_unit, unit_type, test_type, is_active
)
select
  domain,
  sub_domain,
  name,
  description,
  what_it_tells_you,
  unit,
  value_type,
  measurement_sources::jsonb,
  frequency_hint,
  sort_order,
  canonical_unit,
  unit_type,
  test_type,
  is_active
from (
  values
  ('heart', 'Cardiovascular Health', 'Systolic Blood Pressure', 'Clinical markers of heart disease risk', 'Top number — arterial pressure during heart beat', 'mmHg', 'number', '["Home BP cuff", "Pharmacy kiosk", "Doctor visit", "Some smartwatches"]', 'weekly', 7,
   'mmHg', 'pressure', 'bp_systolic', true),
  ('heart', 'Cardiovascular Health', 'Diastolic Blood Pressure', 'Clinical markers of heart disease risk', 'Bottom number — arterial pressure between beats', 'mmHg', 'number', '["Home BP cuff", "Pharmacy kiosk", "Doctor visit", "Some smartwatches"]', 'weekly', 8,
   'mmHg', 'pressure', 'bp_diastolic', true),
  ('heart', 'Cardiovascular Health', 'LDL Cholesterol', 'Clinical markers of heart disease risk', '"Bad" cholesterol — part of CV risk picture', 'mg/dL', 'number', '["Lab upload (standard lipid panel)"]', 'quarterly', 9,
   'mg/dL', 'lipids_cholesterol', 'ldl_cholesterol', true),
  ('heart', 'Cardiovascular Health', 'HDL Cholesterol', 'Clinical markers of heart disease risk', '"Good" cholesterol — protective lipid marker', 'mg/dL', 'number', '["Lab upload (standard lipid panel)"]', 'quarterly', 10,
   'mg/dL', 'lipids_cholesterol', 'hdl_cholesterol', true),
  ('metabolism', 'Metabolic Health Markers', 'ALT', 'Lab indicators of metabolic function', 'Liver enzyme — fatty liver and liver stress', 'U/L', 'number', '["Lab upload (bloodwork, liver panel)"]', 'quarterly', 63,
   'U/L', 'unitless', 'alt', true),
  ('metabolism', 'Metabolic Health Markers', 'AST', 'Lab indicators of metabolic function', 'Liver enzyme — liver stress marker', 'U/L', 'number', '["Lab upload (bloodwork, liver panel)"]', 'quarterly', 64,
   'U/L', 'unitless', 'ast', true)
) as v(
  domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order,
  canonical_unit, unit_type, test_type, is_active
)
where not exists (
  select 1 from metric_definitions d
  where d.domain = v.domain and d.sub_domain = v.sub_domain and d.name = v.name
);

-- 3) Mark mixed strength metrics inactive instead of deleting
update metric_definitions
set is_active = false
where domain = 'frame'
  and sub_domain in ('Upper Body Strength', 'Lower Body Strength', 'Grip Strength', 'Stability & Balance')
  and name in ('Pushing Strength', 'Pulling Strength', 'Leg Strength', 'Leg Endurance', 'Grip', 'Balance', 'Core Stability');

-- 4) Insert test-specific strength metrics
insert into metric_definitions (
  domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order,
  canonical_unit, unit_type, test_type, is_active
)
select
  domain,
  sub_domain,
  name,
  description,
  what_it_tells_you,
  unit,
  value_type,
  measurement_sources::jsonb,
  frequency_hint,
  sort_order,
  canonical_unit,
  unit_type,
  test_type,
  is_active
from (
  values
  -- Upper Body Strength
  ('frame', 'Upper Body Strength', 'Push-up Max Reps', 'Pushing capacity', 'Bodyweight pushing endurance', 'reps', 'number', '["Push-up max (self-test)"]', 'weekly', 12,
   'reps', 'count', 'pushup_max_reps', true),
  ('frame', 'Upper Body Strength', 'Bench Press 1RM', 'Pushing capacity', 'Max barbell press strength', 'kg', 'number', '["Bench press weight"]', 'weekly', 13,
   'kg', 'mass', 'bench_press_1rm', true),
  ('frame', 'Upper Body Strength', 'Dumbbell Press 1RM', 'Pushing capacity', 'Max dumbbell press strength', 'kg', 'number', '["Dumbbell press weight"]', 'weekly', 14,
   'kg', 'mass', 'dumbbell_press_1rm', true),
  ('frame', 'Upper Body Strength', 'Pull-up Max Reps', 'Pulling capacity', 'Bodyweight pulling endurance', 'reps', 'number', '["Pull-up max (self-test)"]', 'weekly', 15,
   'reps', 'count', 'pullup_max_reps', true),
  ('frame', 'Upper Body Strength', 'Barbell Row 1RM', 'Pulling capacity', 'Max barbell row strength', 'kg', 'number', '["Row weight"]', 'weekly', 16,
   'kg', 'mass', 'barbell_row_1rm', true),
  ('frame', 'Upper Body Strength', 'Lat Pulldown 1RM', 'Pulling capacity', 'Max lat pulldown strength', 'kg', 'number', '["Lat pulldown weight"]', 'weekly', 17,
   'kg', 'mass', 'lat_pulldown_1rm', true),
  -- Lower Body Strength
  ('frame', 'Lower Body Strength', '30-sec Sit-to-Stand Reps', 'Leg power and endurance', 'Functional lower-body power', 'reps', 'number', '["30-sec sit-to-stand (self-test)"]', 'weekly', 18,
   'reps', 'count', 'sit_to_stand_30s', true),
  ('frame', 'Lower Body Strength', 'Squat 1RM', 'Leg power and strength', 'Max squat strength', 'kg', 'number', '["Squat max weight"]', 'weekly', 19,
   'kg', 'mass', 'squat_1rm', true),
  ('frame', 'Lower Body Strength', 'Leg Press 1RM', 'Leg power and strength', 'Max leg press strength', 'kg', 'number', '["Leg press weight"]', 'weekly', 20,
   'kg', 'mass', 'leg_press_1rm', true),
  ('frame', 'Lower Body Strength', 'Wall Sit Hold', 'Lower body endurance', 'Isometric leg endurance', 'min', 'duration', '["Wall sit time"]', 'weekly', 21,
   'min', 'duration', 'wall_sit_hold', true),
  ('frame', 'Lower Body Strength', 'Squat Hold', 'Lower body endurance', 'Isometric squat endurance', 'min', 'duration', '["Squat hold time"]', 'weekly', 22,
   'min', 'duration', 'squat_hold', true),
  ('frame', 'Lower Body Strength', 'Bodyweight Squat Max Reps', 'Lower body endurance', 'Dynamic endurance under bodyweight load', 'reps', 'number', '["Bodyweight squat reps"]', 'weekly', 23,
   'reps', 'count', 'bodyweight_squat_max_reps', true),
  -- Grip Strength
  ('frame', 'Grip Strength', 'Dynamometer Grip', 'Hand and forearm power', 'Grip force output', 'kg', 'number', '["Dynamometer reading"]', 'weekly', 24,
   'kg', 'mass', 'dynamometer_grip', true),
  ('frame', 'Grip Strength', 'Dead Hang Hold', 'Hand and forearm power', 'Grip endurance under bodyweight load', 'min', 'duration', '["Dead hang time"]', 'weekly', 25,
   'min', 'duration', 'dead_hang_hold', true),
  ('frame', 'Grip Strength', 'Farmer Carry Hold', 'Hand and forearm power', 'Grip endurance under load', 'min', 'duration', '["Farmer carry time"]', 'weekly', 26,
   'min', 'duration', 'farmer_carry_hold', true),
  -- Stability & Balance
  ('frame', 'Stability & Balance', 'Single-leg Stand (Eyes Open)', 'Postural control and fall prevention', 'Static balance with vision', 'min', 'duration', '["Single-leg stand eyes open"]', 'weekly', 27,
   'min', 'duration', 'single_leg_open', true),
  ('frame', 'Stability & Balance', 'Single-leg Stand (Eyes Closed)', 'Postural control and fall prevention', 'Static balance without vision', 'min', 'duration', '["Single-leg stand eyes closed"]', 'weekly', 28,
   'min', 'duration', 'single_leg_closed', true),
  ('frame', 'Stability & Balance', 'Balance Board Hold', 'Postural control and fall prevention', 'Dynamic balance control', 'min', 'duration', '["Balance board time"]', 'weekly', 29,
   'min', 'duration', 'balance_board_hold', true),
  ('frame', 'Stability & Balance', 'Plank Hold', 'Postural control and fall prevention', 'Core endurance hold', 'min', 'duration', '["Plank hold time"]', 'weekly', 30,
   'min', 'duration', 'plank_hold', true),
  ('frame', 'Stability & Balance', 'Side Plank Hold', 'Postural control and fall prevention', 'Lateral core endurance', 'min', 'duration', '["Side plank time"]', 'weekly', 31,
   'min', 'duration', 'side_plank_hold', true),
  ('frame', 'Stability & Balance', 'Dead Bug Reps', 'Postural control and fall prevention', 'Core control reps', 'reps', 'number', '["Dead bug reps"]', 'weekly', 32,
   'reps', 'count', 'dead_bug_reps', true)
) as v(
  domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order,
  canonical_unit, unit_type, test_type, is_active
)
where not exists (
  select 1 from metric_definitions d
  where d.domain = v.domain and d.sub_domain = v.sub_domain and d.name = v.name
);

-- 5) Ensure unit types and canonical units are set
update metric_definitions
set unit_type = 'duration', canonical_unit = 'min', unit = 'min'
where value_type = 'duration';

update metric_definitions
set unit_type = 'mass', canonical_unit = 'kg'
where unit ilike '%kg%' or unit ilike '%lb%';

update metric_definitions
set unit_type = 'length', canonical_unit = 'cm', unit = 'cm'
where unit ilike '%inch%' or unit = 'inches';

update metric_definitions
set unit_type = 'temperature', canonical_unit = 'C'
where unit in ('C', '°C', 'celsius');

update metric_definitions
set unit_type = 'pressure', canonical_unit = 'mmHg'
where unit ilike '%mmhg%';

update metric_definitions
set unit_type = 'percentage'
where unit = '%';

update metric_definitions
set unit_type = 'score'
where unit = 'score';

update metric_definitions
set unit_type = 'count'
where unit = 'count';

update metric_definitions
set unit_type = 'ratio'
where unit = 'ratio';

update metric_definitions
set unit_type = 'rate'
where unit ilike '%bpm%' or unit ilike '%breaths/min%';

update metric_definitions
set unit_type = 'glucose'
where sub_domain = 'Glucose Regulation' and unit ilike '%mg/dl%';

update metric_definitions
set unit_type = 'lipids_triglycerides'
where name = 'Triglycerides';

update metric_definitions
set unit_type = 'lipids_cholesterol'
where name in ('LDL Cholesterol', 'HDL Cholesterol', 'ApoB', 'HDL', 'LDL');

update metric_definitions
set canonical_unit = unit
where canonical_unit is null;

-- 6) Mark calculated metrics
update metric_definitions
set is_derived = true
where name in ('Waist-to-Hip Ratio', 'HOMA-IR', 'TG/HDL Ratio');

update metric_definitions
set is_calculated = true
where name in ('Waist-to-Hip Ratio', 'HOMA-IR', 'TG/HDL Ratio');

-- 7) Normalize existing entry values to canonical units where possible
update user_metric_entries
set value = value * 0.45359237,
    unit = 'kg'
where unit in ('lb', 'lbs');

update user_metric_entries
set value = value * 2.54,
    unit = 'cm'
where unit in ('in', 'inch', 'inches');

-- 8) Add metric_tests for any newly inserted definitions
insert into metric_tests (metric_definition_id, test_key, name, unit, canonical_unit, unit_family, value_type)
select
  d.id,
  lower(regexp_replace(d.name, '[^a-zA-Z0-9]+', '_', 'g')),
  d.name,
  d.unit,
  d.canonical_unit,
  d.unit_type,
  d.value_type
from metric_definitions d
left join metric_tests t on t.metric_definition_id = d.id and t.test_key = lower(regexp_replace(d.name, '[^a-zA-Z0-9]+', '_', 'g'))
where t.id is null;
