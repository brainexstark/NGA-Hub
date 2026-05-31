-- ============================================================
-- Migration: Enable Supabase Realtime for dynamic edu tables
-- Run this in Supabase SQL Editor to start streaming changes
-- to the client via Postgres logical replication.
-- ============================================================

begin;

-- Broadcast row-level changes for all active dynamic entities
alter publication supabase_realtime add table public.students;
alter publication supabase_realtime add table public.schools;
alter publication supabase_realtime add table public.learning_content;
alter publication supabase_realtime add table public.content_translations;

-- Also enable the lookup/config tables so language + syllabus
-- changes stream live to the UI without a page refresh
alter publication supabase_realtime add table public.languages;
alter publication supabase_realtime add table public.syllabus_definitions;
alter publication supabase_realtime add table public.universal_concepts;
alter publication supabase_realtime add table public.syllabus_topics_mapping;

commit;
