-- Eden v2 Metric Scoring Seed (Optimal Ranges)
-- ============================================================
-- These ranges are initial defaults and should be refined per user/profile.

-- Helper: insert if not exists
insert into metric_scoring (metric_test_id, optimal_range_min, optimal_range_max, score_curve, curve_params)
select t.id, v.min_val, v.max_val, v.curve, v.params::jsonb
from (
  values
  -- Heart
  ('resting_heart_rate', 50, 65, 'range', '{}'),
  ('heart_rate_recovery', 20, 40, 'range', '{}'),
  ('hrv', 40, 80, 'range', '{}'),
  ('systolic_blood_pressure', 105, 120, 'range', '{}'),
  ('diastolic_blood_pressure', 65, 80, 'range', '{}'),
  ('ldl_cholesterol', 60, 100, 'range', '{}'),
  ('hdl_cholesterol', 50, 80, 'range', '{}'),
  ('apob', 50, 80, 'range', '{}'),
  -- Metabolism
  ('fasting_glucose', 70, 90, 'range', '{}'),
  ('hba1c', 4.8, 5.4, 'range', '{}'),
  ('triglycerides', 50, 100, 'range', '{}'),
  ('hscrp', 0, 1, 'range', '{}'),
  -- Recovery
  ('sleep_duration', 420, 540, 'range', '{"outer_margin":120}'),
  ('sleep_efficiency', 85, 95, 'range', '{}'),
  ('sleep_latency', 10, 20, 'range', '{}'),
  ('wake_ups', 0, 2, 'range', '{}'),
  ('morning_hrv', 40, 80, 'range', '{}')
) as v(test_key, min_val, max_val, curve, params)
join metric_tests t on t.test_key = v.test_key
left join metric_scoring s on s.metric_test_id = t.id
where s.id is null;
