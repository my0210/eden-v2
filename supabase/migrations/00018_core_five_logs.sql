-- Core Five Logs table for Eden v3
-- Stores weekly protocol adherence logs for the 5 pillars: cardio, strength, sleep, clean_eating, mindfulness

create table core_five_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  pillar text not null check (pillar in ('cardio', 'strength', 'sleep', 'clean_eating', 'mindfulness')),
  value numeric not null, -- minutes for cardio/mindfulness, sessions for strength, hours for sleep, days for clean_eating
  details jsonb, -- optional: type, intensity, notes, etc.
  logged_at timestamptz not null default now(),
  week_start date not null, -- Monday of the week for easy aggregation
  created_at timestamptz default now()
);

-- Index for efficient weekly queries per user
create index idx_core_five_user_week on core_five_logs(user_id, week_start);

-- Index for pillar-specific queries
create index idx_core_five_pillar on core_five_logs(user_id, pillar, week_start);

-- Enable RLS
alter table core_five_logs enable row level security;

-- Users can only see their own logs
create policy "Users can view own core five logs"
  on core_five_logs for select
  using (auth.uid() = user_id);

-- Users can insert their own logs
create policy "Users can insert own core five logs"
  on core_five_logs for insert
  with check (auth.uid() = user_id);

-- Users can update their own logs
create policy "Users can update own core five logs"
  on core_five_logs for update
  using (auth.uid() = user_id);

-- Users can delete their own logs
create policy "Users can delete own core five logs"
  on core_five_logs for delete
  using (auth.uid() = user_id);
