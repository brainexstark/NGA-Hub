-- NGA Hub Supabase Schema
-- Project: https://qoarbpjevfzmxgfyhxoa.supabase.co
-- Run this at: https://supabase.com/dashboard/project/qoarbpjevfzmxgfyhxoa/sql/new

-- Enable UUID + crypto
create extension if not exists pgcrypto;

--------------------------------------------------
-- POSTS TABLE (Realtime Feed)
--------------------------------------------------
create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
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
  is_flagged boolean default false,
  created_at timestamptz default now()
);

-- Realtime safe add
do $$ begin
  alter publication supabase_realtime add table posts;
exception when duplicate_object then null;
end $$;

alter table posts enable row level security;

create policy "Public read posts"
on posts for select using (is_flagged = false);

create policy "Auth insert posts"
on posts for insert with check (auth.uid() is not null);

create policy "Owner update posts"
on posts for update using (user_id = auth.uid());

create policy "Owner delete posts"
on posts for delete using (user_id = auth.uid());

create index if not exists posts_age_group_created 
on posts(age_group, created_at desc);

create index if not exists posts_category 
on posts(category);

--------------------------------------------------
-- COMMENTS TABLE
--------------------------------------------------
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  user_name text not null,
  user_avatar text default '',
  text text not null,
  created_at timestamptz default now()
);

do $$ begin
  alter publication supabase_realtime add table comments;
exception when duplicate_object then null;
end $$;

alter table comments enable row level security;

create policy "Public read comments"
on comments for select using (true);

create policy "Auth insert comments"
on comments for insert with check (auth.uid() is not null);

create policy "Owner delete comment"
on comments for delete using (user_id = auth.uid());

create index if not exists comments_post_created 
on comments(post_id, created_at desc);

--------------------------------------------------
-- LIKES TABLE (FIXED)
--------------------------------------------------
create table if not exists likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

do $$ begin
  alter publication supabase_realtime add table likes;
exception when duplicate_object then null;
end $$;

alter table likes enable row level security;

create policy "Public read likes"
on likes for select using (true);

create policy "Auth insert likes"
on likes for insert with check (auth.uid() is not null);

create policy "Owner delete like"
on likes for delete using (user_id = auth.uid());

create index if not exists likes_post 
on likes(post_id);

--------------------------------------------------
-- AUTO UPDATE LIKE COUNT (PRO FEATURE)
--------------------------------------------------
create or replace function update_likes_count()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update posts set likes_count = likes_count - 1 where id = old.post_id;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists likes_count_trigger on likes;

create trigger likes_count_trigger
after insert or delete on likes
for each row execute function update_likes_count();

--------------------------------------------------
-- LIVE STREAMS TABLE
--------------------------------------------------
create table if not exists live_streams (
  id uuid default gen_random_uuid() primary key,
  host_id uuid references auth.users(id) on delete cascade,
  host_name text not null,
  host_avatar text default '',
  title text not null,
  age_group text not null,
  viewer_count integer default 0,
  is_active boolean default true,
  started_at timestamptz default now(),
  ended_at timestamptz
);

do $$ begin
  alter publication supabase_realtime add table live_streams;
exception when duplicate_object then null;
end $$;

alter table live_streams enable row level security;

create policy "Public read streams"
on live_streams for select using (true);

create policy "Auth insert stream"
on live_streams for insert with check (auth.uid() is not null);

create policy "Host update stream"
on live_streams for update using (host_id = auth.uid());

create index if not exists live_streams_active 
on live_streams(is_active, age_group);

--------------------------------------------------
-- LIVE CHAT TABLE
--------------------------------------------------
create table if not exists live_chat (
  id uuid default gen_random_uuid() primary key,
  stream_id uuid references live_streams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  user_name text not null,
  user_avatar text default '',
  message text not null,
  created_at timestamptz default now()
);

do $$ begin
  alter publication supabase_realtime add table live_chat;
exception when duplicate_object then null;
end $$;

alter table live_chat enable row level security;

create policy "Public read chat"
on live_chat for select using (true);

create policy "Auth insert chat"
on live_chat for insert with check (auth.uid() is not null);

create index if not exists live_chat_stream 
on live_chat(stream_id, created_at desc);

--------------------------------------------------
-- LESSONS TABLE (AI HISTORY)
--------------------------------------------------
create table if not exists lessons (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  topic text not null,
  age_group text not null,
  lesson_plan text not null,
  created_at timestamptz default now()
);

alter table lessons enable row level security;

create policy "Owner read lessons"
on lessons for select using (user_id = auth.uid());

create policy "Owner insert lessons"
on lessons for insert with check (user_id = auth.uid());

create index if not exists lessons_user 
on lessons(user_id, created_at desc);

--------------------------------------------------
-- ADS TABLE
--------------------------------------------------
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

create policy "Public read ads"
on ads for select using (is_active = true);

create index if not exists ads_active 
on ads(is_active, target_age_group);