-- ============================================================
-- NGA HUB — COMPLETE SUPABASE SCHEMA v3.0
-- Project: https://rhdfnxrbbzaqcedwgsfm.supabase.co
-- Run at: https://supabase.com/dashboard/project/rhdfnxrbbzaqcedwgsfm/sql/new
-- ============================================================

create extension if not exists pgcrypto;

-- ─── HELPER: safe realtime publish ───────────────────────────────────────────
create or replace function safe_add_to_realtime(tbl text) returns void as $$
begin
  execute format('alter publication supabase_realtime add table %I', tbl);
exception when duplicate_object then null;
end;
$$ language plpgsql;

-- ============================================================
-- APP USERS
-- ============================================================
create table if not exists app_users (
  id text primary key,
  display_name text not null default '',
  email text default '',
  avatar text default '',
  age_group text default '10-16',
  is_online boolean default false,
  last_seen timestamptz default now(),
  created_at timestamptz default now()
);
select safe_add_to_realtime('app_users');
alter table app_users enable row level security;
create policy "Public read users" on app_users for select using (true);
create policy "Anyone insert users" on app_users for insert with check (true);
create policy "Anyone update users" on app_users for update using (true);
create index if not exists app_users_online on app_users(is_online);
create index if not exists app_users_created on app_users(created_at desc);

-- ============================================================
-- POSTS
-- ============================================================
create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  user_id text references app_users(id) on delete cascade,
  user_name text not null,
  user_avatar text default '',
  title text not null,
  caption text not null,
  media_url text not null,
  video_url text,
  category text default 'general',
  age_group text not null,
  likes_count integer default 0,
  comments_count integer default 0,
  views_count integer default 0,
  is_flagged boolean default false,
  created_at timestamptz default now()
);
select safe_add_to_realtime('posts');
alter table posts enable row level security;
create policy "Public read posts" on posts for select using (is_flagged = false);
create policy "Anyone insert posts" on posts for insert with check (true);
create policy "Anyone update posts" on posts for update using (true);
create policy "Anyone delete posts" on posts for delete using (true);
create index if not exists posts_age_group_created on posts(age_group, created_at desc);
create index if not exists posts_category on posts(category);
create index if not exists posts_user on posts(user_id);

-- ============================================================
-- COMMENTS
-- ============================================================
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade,
  user_id text references app_users(id) on delete cascade,
  user_name text not null,
  user_avatar text default '',
  text text not null,
  created_at timestamptz default now()
);
select safe_add_to_realtime('comments');
alter table comments enable row level security;
create policy "Public read comments" on comments for select using (true);
create policy "Anyone insert comments" on comments for insert with check (true);
create policy "Anyone delete comment" on comments for delete using (true);
create index if not exists comments_post_created on comments(post_id, created_at asc);

create or replace function update_comments_count() returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update posts set comments_count = greatest(comments_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$ language plpgsql;
drop trigger if exists comments_count_trigger on comments;
create trigger comments_count_trigger after insert or delete on comments
  for each row execute function update_comments_count();

-- ============================================================
-- LIKES
-- ============================================================
create table if not exists likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade,
  user_id text references app_users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);
select safe_add_to_realtime('likes');
alter table likes enable row level security;
create policy "Public read likes" on likes for select using (true);
create policy "Anyone insert likes" on likes for insert with check (true);
create policy "Anyone delete like" on likes for delete using (true);
create index if not exists likes_post on likes(post_id);
create index if not exists likes_user on likes(user_id);

create or replace function update_likes_count() returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$ language plpgsql;
drop trigger if exists likes_count_trigger on likes;
create trigger likes_count_trigger after insert or delete on likes
  for each row execute function update_likes_count();

-- ============================================================
-- FOLLOWS
-- ============================================================
create table if not exists follows (
  id uuid default gen_random_uuid() primary key,
  follower_id text references app_users(id) on delete cascade,
  following_id text references app_users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(follower_id, following_id)
);
select safe_add_to_realtime('follows');
alter table follows enable row level security;
create policy "Public read follows" on follows for select using (true);
create policy "Anyone insert follows" on follows for insert with check (true);
create policy "Anyone delete follow" on follows for delete using (true);
create index if not exists follows_follower on follows(follower_id);
create index if not exists follows_following on follows(following_id);

-- ============================================================
-- DIRECT MESSAGES
-- ============================================================
create table if not exists direct_messages (
  id uuid default gen_random_uuid() primary key,
  chat_id text not null,
  sender_id text references app_users(id) on delete cascade,
  sender_name text not null,
  sender_avatar text default '',
  text text not null,
  is_read boolean default false,
  delivered boolean default true,
  created_at timestamptz default now()
);
select safe_add_to_realtime('direct_messages');
alter table direct_messages enable row level security;
create policy "Public read DMs" on direct_messages for select using (true);
create policy "Anyone insert DMs" on direct_messages for insert with check (true);
create policy "Anyone delete DM" on direct_messages for delete using (true);
create index if not exists dm_chat_created on direct_messages(chat_id, created_at asc);
create index if not exists dm_sender on direct_messages(sender_id);

-- ============================================================
-- GROUP CHATS
-- ============================================================
create table if not exists group_chats (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text default '',
  avatar text default '',
  created_by text references app_users(id) on delete cascade,
  age_group text default '10-16',
  created_at timestamptz default now()
);
select safe_add_to_realtime('group_chats');
alter table group_chats enable row level security;
create policy "Public read groups" on group_chats for select using (true);
create policy "Anyone create group" on group_chats for insert with check (true);
create policy "Anyone update group" on group_chats for update using (true);
create index if not exists group_chats_created on group_chats(created_at desc);

-- ============================================================
-- GROUP MEMBERS
-- ============================================================
create table if not exists group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references group_chats(id) on delete cascade,
  user_id text references app_users(id) on delete cascade,
  user_name text not null,
  user_avatar text default '',
  role text default 'member' check (role in ('admin','member')),
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);
select safe_add_to_realtime('group_members');
alter table group_members enable row level security;
create policy "Public read members" on group_members for select using (true);
create policy "Anyone join group" on group_members for insert with check (true);
create policy "Anyone leave group" on group_members for delete using (true);
create index if not exists group_members_group on group_members(group_id);
create index if not exists group_members_user on group_members(user_id);

-- ============================================================
-- GROUP MESSAGES
-- ============================================================
create table if not exists group_messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references group_chats(id) on delete cascade,
  sender_id text references app_users(id) on delete cascade,
  sender_name text not null,
  sender_avatar text default '',
  text text not null,
  created_at timestamptz default now()
);
select safe_add_to_realtime('group_messages');
alter table group_messages enable row level security;
create policy "Public read group messages" on group_messages for select using (true);
create policy "Anyone send group message" on group_messages for insert with check (true);
create policy "Anyone delete group message" on group_messages for delete using (true);
create index if not exists group_messages_group_created on group_messages(group_id, created_at asc);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id text references app_users(id) on delete cascade,
  type text not null check (type in ('like','comment','follow','mention','live','message','group','system')),
  actor_id text references app_users(id) on delete cascade,
  actor_name text not null default '',
  actor_avatar text default '',
  post_id uuid references posts(id) on delete cascade,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);
select safe_add_to_realtime('notifications');
alter table notifications enable row level security;
create policy "Public read notifications" on notifications for select using (true);
create policy "Anyone insert notifications" on notifications for insert with check (true);
create policy "Anyone update notifications" on notifications for update using (true);
create index if not exists notifications_user_read on notifications(user_id, is_read, created_at desc);

-- ============================================================
-- LIVE STREAMS
-- ============================================================
create table if not exists live_streams (
  id uuid default gen_random_uuid() primary key,
  host_id text references app_users(id) on delete cascade,
  host_name text not null,
  host_avatar text default '',
  title text not null,
  age_group text not null,
  viewer_count integer default 0,
  is_active boolean default true,
  started_at timestamptz default now(),
  ended_at timestamptz
);
select safe_add_to_realtime('live_streams');
alter table live_streams enable row level security;
create policy "Public read streams" on live_streams for select using (true);
create policy "Anyone insert stream" on live_streams for insert with check (true);
create policy "Anyone update stream" on live_streams for update using (true);
create index if not exists live_streams_active on live_streams(is_active, age_group);

-- ============================================================
-- LIVE CHAT
-- ============================================================
create table if not exists live_chat (
  id uuid default gen_random_uuid() primary key,
  stream_id uuid references live_streams(id) on delete cascade,
  user_id text references app_users(id) on delete cascade,
  user_name text not null,
  user_avatar text default '',
  message text not null,
  created_at timestamptz default now()
);
select safe_add_to_realtime('live_chat');
alter table live_chat enable row level security;
create policy "Public read chat" on live_chat for select using (true);
create policy "Anyone insert chat" on live_chat for insert with check (true);
create index if not exists live_chat_stream on live_chat(stream_id, created_at asc);

-- ============================================================
-- STORIES
-- ============================================================
create table if not exists stories (
  id uuid default gen_random_uuid() primary key,
  user_id text references app_users(id) on delete cascade,
  user_name text not null,
  user_avatar text default '',
  media_url text not null,
  caption text default '',
  age_group text not null,
  views_count integer default 0,
  expires_at timestamptz default (now() + interval '24 hours'),
  created_at timestamptz default now()
);
select safe_add_to_realtime('stories');
alter table stories enable row level security;
create policy "Public read stories" on stories for select using (expires_at > now());
create policy "Anyone insert stories" on stories for insert with check (true);
create policy "Anyone delete story" on stories for delete using (true);
create index if not exists stories_age_expires on stories(age_group, expires_at desc);

-- ============================================================
-- LESSONS
-- ============================================================
create table if not exists lessons (
  id uuid default gen_random_uuid() primary key,
  user_id text references app_users(id) on delete cascade,
  topic text not null,
  age_group text not null,
  lesson_plan text not null,
  created_at timestamptz default now()
);
alter table lessons enable row level security;
create policy "Public read lessons" on lessons for select using (true);
create policy "Anyone insert lessons" on lessons for insert with check (true);
create index if not exists lessons_user on lessons(user_id, created_at desc);

-- ============================================================
-- ADS
-- ============================================================
create table if not exists ads (
  id uuid default gen_random_uuid() primary key,
  partner_name text not null,
  media_url text not null,
  video_url text,
  caption text not null,
  title text not null,
  target_age_group text default 'all',
  category text default 'general',
  click_url text,
  impressions integer default 0,
  clicks integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table ads enable row level security;
create policy "Public read ads" on ads for select using (is_active = true);
create index if not exists ads_active on ads(is_active, target_age_group);

-- ============================================================
-- INCREMENT VIEWERS RPC
-- ============================================================
create or replace function increment_viewers(stream_id uuid)
returns void as $$
begin
  update live_streams set viewer_count = viewer_count + 1 where id = stream_id;
end;
$$ language plpgsql;

-- ============================================================
-- DONE
-- ============================================================

-- ============================================================
-- FEATURE REQUESTS
-- ============================================================
create table if not exists feature_requests (
  id uuid default gen_random_uuid() primary key,
  user_id text references app_users(id) on delete cascade,
  user_name text not null,
  user_avatar text default '',
  request_text text not null,
  benefit text default '',
  votes integer default 0,
  status text default 'pending' check (status in ('pending','reviewing','planned','done')),
  created_at timestamptz default now()
);
select safe_add_to_realtime('feature_requests');
alter table feature_requests enable row level security;
create policy "Public read requests" on feature_requests for select using (true);
create policy "Anyone insert request" on feature_requests for insert with check (true);
create policy "Anyone update request" on feature_requests for update using (true);
create index if not exists feature_requests_votes on feature_requests(votes desc);

-- ============================================================
-- MUSIC LIBRARY (background music for posts)
-- ============================================================
create table if not exists music_library (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  url text not null,
  uploaded_by text references app_users(id) on delete cascade,
  duration text default '',
  is_public boolean default true,
  created_at timestamptz default now()
);
select safe_add_to_realtime('music_library');
alter table music_library enable row level security;
create policy "Public read music" on music_library for select using (is_public = true);
create policy "Anyone insert music" on music_library for insert with check (true);
create index if not exists music_library_created on music_library(created_at desc);
