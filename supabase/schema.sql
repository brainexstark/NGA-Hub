-- NGA Hub Supabase Schema
-- Run this in your Supabase SQL editor at:
-- https://supabase.com/dashboard/project/wscaigurnkqbzdipktlr/sql

-- POSTS TABLE (realtime feed)
create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
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

-- Enable realtime
alter publication supabase_realtime add table posts;

-- Row Level Security
alter table posts enable row level security;

-- Anyone can read non-flagged posts
create policy "Public read" on posts
  for select using (is_flagged = false);

-- Authenticated users can insert
create policy "Auth insert" on posts
  for insert with check (true);

-- Owner can update/delete
create policy "Owner update" on posts
  for update using (user_id = auth.uid()::text);

create policy "Owner delete" on posts
  for delete using (user_id = auth.uid()::text);

-- Index for fast feed queries
create index if not exists posts_age_group_created on posts(age_group, created_at desc);
create index if not exists posts_category on posts(category);

-- COMMENTS TABLE
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade,
  user_id text not null,
  user_name text not null,
  user_avatar text default '',
  text text not null,
  created_at timestamptz default now()
);

alter publication supabase_realtime add table comments;
alter table comments enable row level security;

create policy "Public read comments" on comments for select using (true);
create policy "Auth insert comments" on comments for insert with check (true);
create policy "Owner delete comment" on comments for delete using (user_id = auth.uid()::text);

-- LIKES TABLE
create table if not exists likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade,
  user_id text not null,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

alter table likes enable row level security;
create policy "Public read likes" on likes for select using (true);
create policy "Auth insert likes" on likes for insert with check (true);
create policy "Owner delete like" on likes for delete using (user_id = auth.uid()::text);
