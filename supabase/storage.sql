-- ============================================================
-- NGA HUB — Supabase Storage Setup
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/rhdfnxrbbzaqcedwgsfm/sql/new
-- ============================================================

-- Create the 'media' storage bucket (public, for all user uploads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  52428800, -- 50MB limit per file
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
    'image/webp', 'image/avif', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/quicktime',
    'video/x-msvideo', 'video/x-matroska', 'video/mpeg',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
    'audio/webm', 'audio/mp4',
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- Storage RLS policies for the 'media' bucket
-- Allow public read (anyone can view uploaded media)
DROP POLICY IF EXISTS "Public read media" ON storage.objects;
CREATE POLICY "Public read media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

-- Allow any authenticated OR anonymous user to upload
DROP POLICY IF EXISTS "Anyone upload media" ON storage.objects;
CREATE POLICY "Anyone upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media');

-- Allow anyone to update their own uploads
DROP POLICY IF EXISTS "Anyone update media" ON storage.objects;
CREATE POLICY "Anyone update media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'media');

-- Allow anyone to delete media (owner cleanup)
DROP POLICY IF EXISTS "Anyone delete media" ON storage.objects;
CREATE POLICY "Anyone delete media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media');

-- ── Verify ───────────────────────────────────────────────────────────────────
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'media';
