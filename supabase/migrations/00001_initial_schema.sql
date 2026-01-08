-- Eden v2 Initial Schema
-- ============================================================

-- Use gen_random_uuid() which is available by default in PostgreSQL 14+

-- ============================================================
-- User Profiles (extends Supabase auth.users)
-- ============================================================

create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  goals jsonb default '{}'::jsonb,
  constraints jsonb default '{}'::jsonb,
  coaching_style jsonb default '{"tone": "supportive", "density": "balanced", "formality": "professional"}'::jsonb,
  current_fitness_level text default 'moderate' check (current_fitness_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS policies for user_profiles
alter table user_profiles enable row level security;

create policy "Users can view own profile"
  on user_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on user_profiles for insert
  with check (auth.uid() = id);

-- Trigger to create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into user_profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- Weekly Plans
-- ============================================================

create table weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade not null,
  week_start_date date not null,
  eden_intro text,
  generation_context jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  unique(user_id, week_start_date)
);

-- Index for quick lookups
create index idx_weekly_plans_user_week on weekly_plans(user_id, week_start_date);

-- RLS policies for weekly_plans
alter table weekly_plans enable row level security;

create policy "Users can view own plans"
  on weekly_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert own plans"
  on weekly_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own plans"
  on weekly_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete own plans"
  on weekly_plans for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Plan Items
-- ============================================================

create table plan_items (
  id uuid primary key default gen_random_uuid(),
  weekly_plan_id uuid references weekly_plans(id) on delete cascade not null,
  domain text not null check (domain in ('heart', 'muscle', 'sleep', 'metabolism', 'mind')),
  day_of_week int not null check (day_of_week between 0 and 6),
  title text not null,
  duration_minutes int,
  personalization_context text,
  reasoning text,
  status text default 'pending' check (status in ('pending', 'done', 'skipped')),
  completed_at timestamptz,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Index for quick lookups
create index idx_plan_items_plan on plan_items(weekly_plan_id);
create index idx_plan_items_day on plan_items(weekly_plan_id, day_of_week);

-- RLS policies for plan_items (through weekly_plans relationship)
alter table plan_items enable row level security;

create policy "Users can view own plan items"
  on plan_items for select
  using (
    exists (
      select 1 from weekly_plans
      where weekly_plans.id = plan_items.weekly_plan_id
      and weekly_plans.user_id = auth.uid()
    )
  );

create policy "Users can insert own plan items"
  on plan_items for insert
  with check (
    exists (
      select 1 from weekly_plans
      where weekly_plans.id = plan_items.weekly_plan_id
      and weekly_plans.user_id = auth.uid()
    )
  );

create policy "Users can update own plan items"
  on plan_items for update
  using (
    exists (
      select 1 from weekly_plans
      where weekly_plans.id = plan_items.weekly_plan_id
      and weekly_plans.user_id = auth.uid()
    )
  );

create policy "Users can delete own plan items"
  on plan_items for delete
  using (
    exists (
      select 1 from weekly_plans
      where weekly_plans.id = plan_items.weekly_plan_id
      and weekly_plans.user_id = auth.uid()
    )
  );

-- ============================================================
-- Conversations
-- ============================================================

create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade not null,
  messages jsonb not null default '[]'::jsonb,
  context jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for user conversations
create index idx_conversations_user on conversations(user_id, created_at desc);

-- RLS policies for conversations
alter table conversations enable row level security;

create policy "Users can view own conversations"
  on conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert own conversations"
  on conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on conversations for update
  using (auth.uid() = user_id);

-- ============================================================
-- Adaptations Log
-- ============================================================

create table adaptations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade not null,
  weekly_plan_id uuid references weekly_plans(id) on delete cascade,
  trigger_type text not null check (trigger_type in ('missed_items', 'user_request', 'pattern_detected', 'constraint_change', 'weekly_generation')),
  description text not null,
  changes_made jsonb,
  created_at timestamptz default now()
);

-- Index for user adaptations
create index idx_adaptations_user on adaptations(user_id, created_at desc);

-- RLS policies for adaptations
alter table adaptations enable row level security;

create policy "Users can view own adaptations"
  on adaptations for select
  using (auth.uid() = user_id);

create policy "Users can insert own adaptations"
  on adaptations for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- Updated at trigger function
-- ============================================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to tables with updated_at
create trigger update_user_profiles_updated_at
  before update on user_profiles
  for each row execute function update_updated_at_column();

create trigger update_conversations_updated_at
  before update on conversations
  for each row execute function update_updated_at_column();

