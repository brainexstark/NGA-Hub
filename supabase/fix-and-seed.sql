-- ============================================================
-- NGA HUB — COMPLETE FIX + SEED
-- Run this in: https://supabase.com/dashboard/project/rhdfnxrbbzaqcedwgsfm/sql/new
-- ============================================================

-- STEP 1: Drop ALL foreign key constraints so Firebase UIDs work freely
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

-- STEP 2: Fix is_flagged = NULL rows (they were invisible due to RLS policy)
UPDATE posts SET is_flagged = false WHERE is_flagged IS NULL;

-- STEP 3: Fix RLS policy to also show posts where is_flagged is NULL
DROP POLICY IF EXISTS "Public read posts" ON posts;
CREATE POLICY "Public read posts" ON posts FOR SELECT USING (is_flagged IS NOT TRUE);

-- STEP 4: Seed starter posts so the feed is never empty
-- These show immediately for all users on first load
INSERT INTO posts (user_id, user_name, user_avatar, title, caption, media_url, video_url, category, age_group, likes_count, comments_count, is_flagged)
VALUES
  ('nga-hub-official', 'NGA Hub', '/icons/icon-192.png',
   'Welcome to NGA Hub!',
   'The community is live. Share your world, learn something new, and connect with others. 🚀',
   'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80',
   'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
   'general', '10-16', 12, 3, false),

  ('nga-hub-official', 'NGA Hub', '/icons/icon-192.png',
   'Learning is power',
   'Every day is a chance to grow. Check out the Learning Hub for lessons, challenges and more. 📚',
   'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80',
   'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
   'education', '10-16', 8, 1, false),

  ('nga-hub-official', 'NGA Hub', '/icons/icon-192.png',
   'Music & creativity',
   'Express yourself through music, art, and video. Upload your first reel today! 🎵',
   'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
   'https://www.youtube.com/watch?v=JGwWNGJdvx8',
   'music', '16-plus', 21, 5, false),

  ('nga-hub-official', 'NGA Hub', '/icons/icon-192.png',
   'Sports & fitness',
   'Stay active, stay sharp. Share your training, your wins, and your journey. 🏆',
   'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80',
   'https://www.youtube.com/watch?v=2pLT-olgUJs',
   'sports', '16-plus', 15, 2, false),

  ('nga-hub-official', 'NGA Hub', '/icons/icon-192.png',
   'Kids corner',
   'A safe, fun space to learn and play. Explore stories, games, and cool facts! 🧒',
   'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80',
   'https://www.youtube.com/watch?v=1ZYbU82GVz4',
   'education', 'under-10', 30, 7, false),

  ('nga-hub-official', 'NGA Hub', '/icons/icon-192.png',
   'Tech & innovation',
   'The future belongs to those who build it. Share your projects and ideas here. 💡',
   'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
   'https://www.youtube.com/watch?v=Sagg08DrO5U',
   'tech', '16-plus', 18, 4, false),

  ('nga-hub-official', 'NGA Hub', '/icons/icon-192.png',
   'Community news',
   'Stay updated with what is happening in the NGA Hub community. 📰',
   'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',
   'https://www.youtube.com/watch?v=9bZkp7q19f0',
   'news', '10-16', 9, 2, false),

  ('nga-hub-official', 'NGA Hub', '/icons/icon-192.png',
   'Entertainment zone',
   'Laugh, enjoy, and have fun. The best entertainment content is right here. 🎬',
   'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
   'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
   'entertainment', '10-16', 25, 6, false)

ON CONFLICT DO NOTHING;

-- STEP 5: Make sure the seed posts also appear for under-10 and 16-plus
-- by inserting copies with different age_group
INSERT INTO posts (user_id, user_name, user_avatar, title, caption, media_url, video_url, category, age_group, likes_count, comments_count, is_flagged)
SELECT user_id, user_name, user_avatar, title, caption, media_url, video_url, category, 'under-10', likes_count, comments_count, false
FROM posts WHERE user_id = 'nga-hub-official' AND age_group = '10-16'
ON CONFLICT DO NOTHING;

INSERT INTO posts (user_id, user_name, user_avatar, title, caption, media_url, video_url, category, age_group, likes_count, comments_count, is_flagged)
SELECT user_id, user_name, user_avatar, title, caption, media_url, video_url, category, '16-plus', likes_count, comments_count, false
FROM posts WHERE user_id = 'nga-hub-official' AND age_group = '10-16'
ON CONFLICT DO NOTHING;

-- STEP 6: Verify — should show all posts
SELECT id, user_name, title, age_group, is_flagged, created_at FROM posts ORDER BY created_at DESC LIMIT 20;
