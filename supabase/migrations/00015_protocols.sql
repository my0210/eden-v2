-- Migration: Add protocols table for 12-week protocol system
-- ============================================================

-- Protocols table (12-week plans)
create table protocols (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade not null,
  start_date date not null,
  end_date date not null,
  status text default 'active' check (status in ('active', 'completed', 'paused')),
  goal_summary text not null,
  weeks jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for quick user lookups
create index idx_protocols_user on protocols(user_id);
create index idx_protocols_status on protocols(user_id, status);

-- RLS policies for protocols
alter table protocols enable row level security;

create policy "Users can view own protocols"
  on protocols for select
  using (auth.uid() = user_id);

create policy "Users can insert own protocols"
  on protocols for insert
  with check (auth.uid() = user_id);

create policy "Users can update own protocols"
  on protocols for update
  using (auth.uid() = user_id);

create policy "Users can delete own protocols"
  on protocols for delete
  using (auth.uid() = user_id);

-- Add protocol reference to weekly_plans
alter table weekly_plans 
  add column protocol_id uuid references protocols(id) on delete set null,
  add column week_number int check (week_number between 1 and 12);

-- Index for protocol lookups on weekly_plans
create index idx_weekly_plans_protocol on weekly_plans(protocol_id);

-- Comment on the weeks JSONB structure
comment on column protocols.weeks is 'Array of week outlines: [{week_number, focus, domains: {heart, frame, recovery, metabolism, mind}}]';
