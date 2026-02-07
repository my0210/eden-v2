-- Progress Photos table + Supabase Storage bucket for body selfie tracking

-- ============================================================
-- Storage Bucket
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'progress-photos',
  'progress-photos',
  false,
  5242880, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Storage RLS: users can manage their own folder (progress-photos/{user_id}/*)

create policy "Users can upload own progress photos"
  on storage.objects for insert
  with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view own progress photos"
  on storage.objects for select
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own progress photos"
  on storage.objects for delete
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- Progress Photos Table
-- ============================================================

create table progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  storage_path text not null,        -- e.g. "{user_id}/{uuid}.jpg"
  taken_at date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

-- Indexes
create index idx_progress_photos_user_date on progress_photos(user_id, taken_at desc);

-- Enable RLS
alter table progress_photos enable row level security;

-- Users can only see their own photos
create policy "Users can view own progress photos"
  on progress_photos for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress photos"
  on progress_photos for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own progress photos"
  on progress_photos for delete
  using (auth.uid() = user_id);
