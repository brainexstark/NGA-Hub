-- ============================================================
-- NGA HUB — Add Missing Columns After Firebase Removal
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/rhdfnxrbbzaqcedwgsfm/sql/new
-- ============================================================

-- ── app_users: add columns needed by the migrated code ────────────────────────
ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS theme_variant        integer   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_picture      text      DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone_number         text      DEFAULT '',
  ADD COLUMN IF NOT EXISTS dob                  text      DEFAULT '',
  ADD COLUMN IF NOT EXISTS followers_count      integer   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count      integer   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lessons_completed    integer   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS node_streak          integer   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS badges_earned        integer   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_breached          boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS privacy_level        text      DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS language             text      DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS country              text      DEFAULT 'kenya',
  ADD COLUMN IF NOT EXISTS dark_theme           boolean   DEFAULT true,
  ADD COLUMN IF NOT EXISTS timer_notifications  boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS sound_enabled        boolean   DEFAULT true,
  ADD COLUMN IF NOT EXISTS chat_notifications   boolean   DEFAULT true,
  ADD COLUMN IF NOT EXISTS like_notifications   boolean   DEFAULT true,
  ADD COLUMN IF NOT EXISTS live_notifications   boolean   DEFAULT true,
  ADD COLUMN IF NOT EXISTS watch_history        text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS search_history       text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interests            jsonb     DEFAULT '{}';

-- ── Seed default app_status row ───────────────────────────────────────────────
INSERT INTO app_status (id, is_locked_down, message)
VALUES ('main', false, 'System fully operational.')
ON CONFLICT (id) DO NOTHING;

-- ── Verify columns were added ─────────────────────────────────────────────────
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'app_users' 
ORDER BY ordinal_position;
