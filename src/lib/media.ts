'use client';

/**
 * NGA Hub — Media Upload & Display Utilities
 * Handles all upload/display logic for images and videos.
 * - Uploads to Supabase Storage bucket 'media'
 * - Returns permanent public URLs
 * - Falls back gracefully on errors
 */

import { supabase } from './supabase';

// ─── Upload ────────────────────────────────────────────────────────────────────

export type UploadResult = {
  url: string;       // permanent public URL or original blob URL on failure
  path: string;      // storage path
  success: boolean;
  error?: string;
};

/**
 * Upload a File to Supabase Storage and return a permanent public URL.
 * Falls back to the original blob URL if upload fails so the UI never breaks.
 */
export async function uploadMedia(
  file: File,
  folder: 'posts' | 'avatars' | 'videos' | 'stories' = 'posts',
  onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  try {
    onProgress?.(10);

    const { data, error } = await supabase.storage
      .from('media')
      .upload(path, file, {
        cacheControl: '31536000', // 1 year cache
        upsert: false,
        contentType: file.type || guessMime(ext),
      });

    onProgress?.(80);

    if (error) {
      console.warn('[media] Upload failed:', error.message);
      return { url: URL.createObjectURL(file), path, success: false, error: error.message };
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
    const publicUrl = urlData?.publicUrl || '';

    onProgress?.(100);

    if (!publicUrl) {
      return { url: URL.createObjectURL(file), path, success: false, error: 'No public URL returned' };
    }

    return { url: publicUrl, path, success: true };
  } catch (err: any) {
    console.warn('[media] Upload exception:', err?.message);
    return { url: URL.createObjectURL(file), path, success: false, error: err?.message };
  }
}

/**
 * Delete a file from Supabase Storage by its path.
 */
export async function deleteMedia(path: string): Promise<void> {
  if (!path) return;
  try {
    await supabase.storage.from('media').remove([path]);
  } catch {}
}

/**
 * Get a permanent public URL for a storage path.
 */
export function getMediaUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return data?.publicUrl || '';
}

// ─── Display helpers ───────────────────────────────────────────────────────────

/**
 * Returns true if this URL is a temporary local blob/data URL.
 * These display fine in the current browser session but won't work after refresh.
 */
export function isLocalUrl(url: string): boolean {
  return url.startsWith('blob:') || url.startsWith('data:');
}

/**
 * Returns true if this URL is stored permanently in Supabase Storage.
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('supabase.co/storage') || url.includes('/object/public/');
}

/**
 * Best-effort display URL — prefers permanent URL, falls back to local.
 */
export function resolveDisplayUrl(url: string | undefined | null): string {
  if (!url) return '';
  return url;
}

// ─── MIME helpers ──────────────────────────────────────────────────────────────

function guessMime(ext: string): string {
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
    mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
    avi: 'video/x-msvideo', mkv: 'video/x-matroska',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
    pdf: 'application/pdf',
  };
  return map[ext] || 'application/octet-stream';
}

// ─── Smart media renderer props ────────────────────────────────────────────────

export type MediaType = 'image' | 'video' | 'external' | 'unknown';

export function detectMediaType(url: string, fileType?: string): MediaType {
  if (!url) return 'unknown';

  // MIME type from file input is the most reliable signal
  if (fileType?.startsWith('video/')) return 'video';
  if (fileType?.startsWith('image/')) return 'image';
  if (fileType?.startsWith('audio/')) return 'unknown';

  const l = url.toLowerCase().split('?')[0];

  // External embeds
  if (l.includes('youtube') || l.includes('youtu.be') ||
      l.includes('tiktok') || l.includes('instagram') ||
      l.includes('vimeo') || l.includes('fb.watch')) return 'external';

  // data: URLs — check mime prefix
  if (l.startsWith('data:video')) return 'video';
  if (l.startsWith('data:image')) return 'image';

  // blob: URLs — can be either image or video.
  // We can't inspect blob content from URL alone.
  // Return 'unknown' so the caller can pass fileType to disambiguate.
  // MediaRenderer handles 'unknown' as image (safe default).
  if (l.startsWith('blob:')) return 'unknown';

  // Known video extensions
  if (l.endsWith('.mp4') || l.endsWith('.webm') || l.endsWith('.mov') ||
      l.endsWith('.avi') || l.endsWith('.mkv') || l.endsWith('.m4v') ||
      l.endsWith('.ogv') || l.endsWith('.3gp') || l.endsWith('.flv')) return 'video';

  // Known image extensions
  if (l.endsWith('.jpg') || l.endsWith('.jpeg') || l.endsWith('.png') ||
      l.endsWith('.gif') || l.endsWith('.webp') || l.endsWith('.avif') ||
      l.endsWith('.svg') || l.endsWith('.bmp')) return 'image';

  // Supabase storage — inspect the path extension
  if (l.includes('/storage/v1/object/') || l.includes('/object/public/')) {
    const pathExt = l.split('.').pop() || '';
    if (['mp4','webm','mov','avi','mkv','m4v','ogv','3gp'].includes(pathExt)) return 'video';
    if (['jpg','jpeg','png','gif','webp','avif','svg','bmp'].includes(pathExt)) return 'image';
  }

  return 'image'; // safe default
}
