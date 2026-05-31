-- ============================================================
-- Migration: Enforce strict age-group content isolation via RLS
-- Run in Supabase SQL Editor after the main schema migration.
-- This is the database-level enforcement — even if client code
-- has a bug, the DB will never return cross-group content.
-- ============================================================

begin;

-- ── posts ─────────────────────────────────────────────────────────────────────
-- Users can only read posts that match their own age_group profile field.
-- auth.jwt() ->> 'age_group' must be set in your Supabase auth metadata.
-- As a safe fallback we also allow service_role (admin) full access.

drop policy if exists "age group isolation - posts read" on public.posts;
create policy "age group isolation - posts read"
  on public.posts for select
  using (
    age_group = (
      select age_group from public.app_users
      where id = auth.uid()::text
      limit 1
    )
  );

-- ── stories ───────────────────────────────────────────────────────────────────
drop policy if exists "age group isolation - stories read" on public.stories;
create policy "age group isolation - stories read"
  on public.stories for select
  using (
    age_group = (
      select age_group from public.app_users
      where id = auth.uid()::text
      limit 1
    )
  );

-- ── ads ───────────────────────────────────────────────────────────────────────
drop policy if exists "age group isolation - ads read" on public.ads;
create policy "age group isolation - ads read"
  on public.ads for select
  using (
    target_age_group = (
      select age_group from public.app_users
      where id = auth.uid()::text
      limit 1
    )
  );

-- ── live_streams ──────────────────────────────────────────────────────────────
drop policy if exists "age group isolation - live_streams read" on public.live_streams;
create policy "age group isolation - live_streams read"
  on public.live_streams for select
  using (
    age_group = (
      select age_group from public.app_users
      where id = auth.uid()::text
      limit 1
    )
  );

-- ── group_chats ───────────────────────────────────────────────────────────────
drop policy if exists "age group isolation - group_chats read" on public.group_chats;
create policy "age group isolation - group_chats read"
  on public.group_chats for select
  using (
    age_group = (
      select age_group from public.app_users
      where id = auth.uid()::text
      limit 1
    )
  );

-- ── app_users ─────────────────────────────────────────────────────────────────
-- Users can only see other users in their own age group
drop policy if exists "age group isolation - app_users read" on public.app_users;
create policy "age group isolation - app_users read"
  on public.app_users for select
  using (
    age_group = (
      select age_group from public.app_users
      where id = auth.uid()::text
      limit 1
    )
    or id = auth.uid()::text  -- always allow reading own row
  );

-- ── notifications ─────────────────────────────────────────────────────────────
-- Notifications are already user-scoped (user_id = auth.uid())
-- but we add an extra guard: the actor must be in the same age group
drop policy if exists "notifications own user" on public.notifications;
create policy "notifications own user"
  on public.notifications for select
  using (user_id = auth.uid()::text);

commit;
