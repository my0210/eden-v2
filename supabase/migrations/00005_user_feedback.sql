-- User Feedback System
-- ============================================================

-- Add is_admin column to user_profiles
alter table user_profiles add column if not exists is_admin boolean default false;

-- ============================================================
-- User Feedback Table
-- ============================================================

create table user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade not null,
  rating int not null check (rating between 1 and 5),
  message text,
  status text default 'new' check (status in ('new', 'reviewed', 'resolved')),
  created_at timestamptz default now()
);

-- Index for quick lookups
create index idx_user_feedback_user on user_feedback(user_id);
create index idx_user_feedback_status on user_feedback(status);
create index idx_user_feedback_created on user_feedback(created_at desc);

-- ============================================================
-- RLS Policies
-- ============================================================

alter table user_feedback enable row level security;

-- Users can insert their own feedback
create policy "Users can insert own feedback"
  on user_feedback for insert
  with check (auth.uid() = user_id);

-- Users can view their own feedback
create policy "Users can view own feedback"
  on user_feedback for select
  using (auth.uid() = user_id);

-- Admins can view all feedback
create policy "Admins can view all feedback"
  on user_feedback for select
  using (
    exists (
      select 1 from user_profiles
      where user_profiles.id = auth.uid()
      and user_profiles.is_admin = true
    )
  );

-- Admins can update feedback status
create policy "Admins can update feedback"
  on user_feedback for update
  using (
    exists (
      select 1 from user_profiles
      where user_profiles.id = auth.uid()
      and user_profiles.is_admin = true
    )
  );
