-- ============================================================
-- NGA HUB — DATABASE FIX (no mock content)
-- Run at: https://supabase.com/dashboard/project/rhdfnxrbbzaqcedwgsfm/sql/new
-- ============================================================

-- 1. Drop FK constraints so Firebase UIDs work without being in app_users
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_user_id_fkey;
ALTER TABLE follows DROP CONSTRAINT IF EXISTS follows_follower_id_fkey;
ALTER TABLE follows DROP CONSTRAINT IF EXISTS follows_following_id_fkey;
ALTER TABLE direct_messages DROP CONSTRAINT IF EXISTS direct_messages_sender_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_actor_id_fkey;
ALTER TABLE stories DROP CONSTRAINT IF EXISTS stories_user_id_fkey;
ALTER TABLE group_chats DROP CONSTRAINT IF EXISTS group_chats_created_by_fkey;
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;
ALTER TABLE group_messages DROP CONSTRAINT IF EXISTS group_messages_sender_id_fkey;
ALTER TABLE live_streams DROP CONSTRAINT IF EXISTS live_streams_host_id_fkey;
ALTER TABLE live_chat DROP CONSTRAINT IF EXISTS live_chat_user_id_fkey;
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_user_id_fkey;
ALTER TABLE feature_requests DROP CONSTRAINT IF EXISTS feature_requests_user_id_fkey;
ALTER TABLE music_library DROP CONSTRAINT IF EXISTS music_library_uploaded_by_fkey;

-- 2. Fix any posts where is_flagged is NULL — make them visible
UPDATE posts SET is_flagged = false WHERE is_flagged IS NULL;

-- 3. Fix RLS policy to show posts where is_flagged is false OR null
DROP POLICY IF EXISTS "Public read posts" ON posts;
CREATE POLICY "Public read posts" ON posts FOR SELECT USING (is_flagged IS NOT TRUE);

-- 4. Verify — shows all your real posts
SELECT id, user_name, title, age_group, is_flagged, created_at
FROM posts
ORDER BY created_at DESC
LIMIT 30;
