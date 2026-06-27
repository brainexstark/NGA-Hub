-- ============================================================
-- NGA HUB — Firebase Removal Migration
-- Date: 2026-06-27
-- Description: New tables needed after removing Firebase/Firestore.
--              All Firestore collections now map to Supabase tables.
-- Run at: https://supabase.com/dashboard/project/rhdfnxrbbzaqcedwgsfm/sql/new
-- ============================================================

-- ─── HELPER ───────────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;

create or replace function safe_add_to_realtime(tbl text) returns void as $$
begin
  execute format('alter publication supabase_realtime add table %I', tbl);
exception when duplicate_object then null;
end;
$$ language plpgsql;

-- ============================================================
-- APP USERS — extra columns added during migration
-- ============================================================
alter table app_users
  add column if not exists age_group text default '14-17',
  add column if not exists theme_variant integer default 0,
  add column if not exists profile_picture text default '',
  add column if not exists phone_number text default '',
  add column if not exists dob text default '',
  add column if not exists display_name text default '',
  add column if not exists followers_count integer default 0,
  add column if not exists following_count integer default 0,
  add column if not exists lessons_completed integer default 0,
  add column if not exists node_streak integer default 0,
  add column if not exists badges_earned integer default 0,
  add column if not exists is_breached boolean default false,
  add column if not exists privacy_level text default 'public',
  add column if not exists language text default 'en',
  add column if not exists country text default 'kenya',
  add column if not exists dark_theme boolean default true,
  add column if not exists timer_notifications boolean default false,
  add column if not exists sound_enabled boolean default true,
  add column if not exists chat_notifications boolean default true,
  add column if not exists like_notifications boolean default true,
  add column if not exists live_notifications boolean default true,
  add column if not exists watch_history text[] default '{}',
  add column if not exists search_history text[] default '{}',
  add column if not exists interests jsonb default '{}',
  add column if not exists saved_posts text[] default '{}';

-- ============================================================
-- VIDEOS — user video bank (replaces Firestore users/{id}/videos)
-- ============================================================
create table if not exists videos (
  id uuid default gen_random_uuid() primary key,
  user_id text references app_users(id) on delete cascade,
  title text not null,
  video_url text not null,
  duration text default '0:30',
  source text default 'deposit' check (source in ('deposit','record','save')),
  created_at timestamptz default now()
);
select safe_add_to_realtime('videos');
alter table videos enable row level security;
create policy "Public read videos" on videos for select using (true);
create policy "Anyone insert video" on videos for insert with check (true);
create policy "Owner delete video" on videos for delete using (true);
create index if not exists videos_user_created on videos(user_id, created_at desc);

-- ============================================================
-- SAVED POSTS — bookmarked content (replaces Firestore users/{id}/saved_posts)
-- ============================================================
create table if not exists saved_posts (
  id uuid default gen_random_uuid() primary key,
  user_id text references app_users(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, post_id)
);
alter table saved_posts enable row level security;
create policy "Owner read saved" on saved_posts for select using (true);
create policy "Owner insert saved" on saved_posts for insert with check (true);
create policy "Owner delete saved" on saved_posts for delete using (true);
create index if not exists saved_posts_user on saved_posts(user_id, created_at desc);

-- ============================================================
-- FLAGGED CONTENT — moderation (replaces Firestore flagged_content)
-- ============================================================
create table if not exists flagged_content (
  id uuid default gen_random_uuid() primary key,
  content_type text not null,
  user_id text references app_users(id) on delete cascade,
  user_name text not null default '',
  text text default '',
  media_url text default '',
  reason text default '',
  severity text default 'medium' check (severity in ('low','medium','high')),
  status text default 'pending' check (status in ('pending','reviewing','blocked','cleared')),
  created_at timestamptz default now()
);
select safe_add_to_realtime('flagged_content');
alter table flagged_content enable row level security;
create policy "Public read flagged" on flagged_content for select using (true);
create policy "Anyone insert flagged" on flagged_content for insert with check (true);
create policy "Anyone update flagged" on flagged_content for update using (true);
create index if not exists flagged_content_status on flagged_content(status, created_at desc);

-- ============================================================
-- APP STATUS — global app settings (replaces Firestore app_status)
-- ============================================================
create table if not exists app_status (
  id text primary key default 'main',
  is_locked_down boolean default false,
  message text default 'System fully operational.',
  updated_at timestamptz default now()
);
select safe_add_to_realtime('app_status');
alter table app_status enable row level security;
create policy "Public read status" on app_status for select using (true);
create policy "Anyone update status" on app_status for update using (true);
create policy "Anyone insert status" on app_status for insert with check (true);

-- Seed default app status if not exists
insert into app_status (id, is_locked_down, message)
values ('main', false, 'System fully operational.')
on conflict (id) do nothing;

-- ============================================================
-- DONE
-- ============================================================
