-- Eden v2 Metrics Tables
-- ============================================================
-- Tables for tracking user health metrics across Primespan domains

-- ============================================================
-- Metric Definitions (static reference data)
-- ============================================================

create table metric_definitions (
  id uuid primary key default gen_random_uuid(),
  domain text not null check (domain in ('heart', 'frame', 'mind', 'metabolism', 'recovery')),
  sub_domain text not null,
  name text not null,
  description text,
  what_it_tells_you text,
  unit text,
  value_type text not null check (value_type in ('number', 'duration', 'scale_1_10', 'boolean', 'text')),
  measurement_sources jsonb default '[]'::jsonb,
  frequency_hint text check (frequency_hint in ('daily', 'weekly', 'monthly', 'quarterly', 'once')),
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Index for lookups by domain and sub_domain
create index idx_metric_definitions_domain on metric_definitions(domain);
create index idx_metric_definitions_domain_subdomain on metric_definitions(domain, sub_domain);

-- metric_definitions is read-only reference data, accessible to all authenticated users
alter table metric_definitions enable row level security;

create policy "Authenticated users can view metric definitions"
  on metric_definitions for select
  to authenticated
  using (true);

-- ============================================================
-- User Metric Entries (user-logged data)
-- ============================================================

create table user_metric_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade not null,
  metric_definition_id uuid references metric_definitions(id) on delete cascade not null,
  value numeric not null,
  unit text,
  source text default 'manual' check (source in ('manual', 'apple_health', 'garmin', 'whoop', 'oura', 'lab', 'other')),
  recorded_at timestamptz default now(),
  notes text,
  raw_data jsonb,
  created_at timestamptz default now()
);

-- Indexes for efficient queries
create index idx_user_metric_entries_user on user_metric_entries(user_id);
create index idx_user_metric_entries_user_metric on user_metric_entries(user_id, metric_definition_id);
create index idx_user_metric_entries_user_recorded on user_metric_entries(user_id, recorded_at desc);
create index idx_user_metric_entries_metric_recorded on user_metric_entries(metric_definition_id, recorded_at desc);

-- RLS policies for user_metric_entries
alter table user_metric_entries enable row level security;

create policy "Users can view own metric entries"
  on user_metric_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own metric entries"
  on user_metric_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own metric entries"
  on user_metric_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own metric entries"
  on user_metric_entries for delete
  using (auth.uid() = user_id);
