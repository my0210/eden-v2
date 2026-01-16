-- Eden v2 Metric Scoring + Unit Preferences
-- ============================================================

-- Add unit system preference to user profiles
alter table user_profiles
  add column if not exists unit_system text
  default 'metric'
  check (unit_system in ('metric', 'imperial'));

-- Extend metric definitions with unit metadata and test specificity
alter table metric_definitions
  add column if not exists canonical_unit text,
  add column if not exists unit_type text,
  add column if not exists test_type text,
  add column if not exists is_calculated boolean default false;

create index if not exists idx_metric_definitions_test_type on metric_definitions(test_type);

-- Metric scoring table (optimal ranges + curve metadata)
create table if not exists metric_scoring (
  id uuid primary key default gen_random_uuid(),
  metric_definition_id uuid references metric_definitions(id) on delete cascade not null,
  optimal_range_min numeric,
  optimal_range_max numeric,
  curve_type text not null check (curve_type in ('linear', 'logistic', 'step', 'piecewise')),
  curve_params jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_metric_scoring_metric on metric_scoring(metric_definition_id);

alter table metric_scoring enable row level security;

create policy "Authenticated users can view metric scoring"
  on metric_scoring for select
  to authenticated
  using (true);
