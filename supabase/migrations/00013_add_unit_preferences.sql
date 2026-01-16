-- Eden v2 User Unit Preferences
-- ============================================================

alter table user_profiles
  add column if not exists glucose_unit text default 'mg/dL' check (glucose_unit in ('mg/dL', 'mmol/L')),
  add column if not exists lipids_unit text default 'mg/dL' check (lipids_unit in ('mg/dL', 'mmol/L'));
