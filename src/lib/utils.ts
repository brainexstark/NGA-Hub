
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * STARK-B Core Utility: Class Merger
 * Safely merges Tailwind CSS classes without conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Transforms various social media URLs into embeddable formats for internal playback.
 * Supports: YouTube, Vimeo, TikTok, and Instagram.
 */
export function getEmbedUrl(url: string) {
    if (!url) return url;
    
    // YouTube Transformation
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        const watchMatch = url.match(/[?&]v=([^&]+)/);
        if (watchMatch) {
            videoId = watchMatch[1];
        } else {
            const shortMatch = url.match(/youtu\.be\/([^?]+)/);
            if (shortMatch) {
                videoId = shortMatch[1];
            } else {
                const shortsMatch = url.match(/youtube\.com\/shorts\/([^?]+)/);
                if (shortsMatch) {
                    videoId = shortsMatch[1];
                }
            }
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1` : url;
    }

    // Vimeo Transformation
    if (url.includes('vimeo.com')) {
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }

    // TikTok Transformation
    if (url.includes('tiktok.com')) {
        const tiktokMatch = url.match(/video\/(\d+)/);
        if (tiktokMatch) return `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`;
    }

    // Instagram Transformation
    if (url.includes('instagram.com/p/') || url.includes('instagram.com/reels/') || url.includes('instagram.com/tv/')) {
        const parts = url.split('?')[0].split('/');
        const id = parts[parts.indexOf('p') + 1] || parts[parts.indexOf('reels') + 1] || parts[parts.indexOf('tv') + 1];
        if (id) return `https://www.instagram.com/p/${id}/embed`;
    }

    return url;
}

export function getYoutubeEmbedUrl(url: string) {
    return getEmbedUrl(url);
}

/**
 * Detects if a URL points to video content.
 * Handles YouTube, TikTok, Instagram, Vimeo, direct video files, and data URLs.
 */
export function isVideoUrl(url: string, fileType?: string): boolean {
  if (!url) return false;

  // File MIME type takes top priority
  if (fileType) {
    if (fileType.startsWith('video/')) return true;
    if (fileType.startsWith('image/') || fileType.startsWith('audio/')) return false;
  }

  const l = url.toLowerCase().split('?')[0]; // strip query params before extension check

  // Image extensions — NEVER treat as video
  if (l.endsWith('.jpg') || l.endsWith('.jpeg') || l.endsWith('.png') ||
      l.endsWith('.gif')  || l.endsWith('.webp')  || l.endsWith('.avif') ||
      l.endsWith('.svg')  || l.endsWith('.bmp')   || l.endsWith('.tiff') ||
      l.endsWith('.ico')) {
    return false;
  }

  // Known video extensions
  if (l.endsWith('.mp4')  || l.endsWith('.webm') || l.endsWith('.mov') ||
      l.endsWith('.avi')  || l.endsWith('.mkv')  || l.endsWith('.m4v') ||
      l.endsWith('.ogv')  || l.endsWith('.3gp')  || l.endsWith('.flv')) {
    return true;
  }

  // External video platforms
  if (l.includes('youtube.com') || l.includes('youtu.be') ||
      l.includes('tiktok.com')  || l.includes('instagram.com') ||
      l.includes('vimeo.com')   || l.includes('facebook.com/watch') ||
      l.includes('fb.watch')    || l.includes('shorts/')) {
    return true;
  }

  // Data URLs — check mime prefix
  if (l.startsWith('data:video')) return true;
  if (l.startsWith('data:image')) return false;

  // Blob URLs — default image (avoid broken video player on uploaded photos)
  if (l.startsWith('blob:')) return false;

  // Supabase Storage paths — extension already checked above
  // If we reach here with no known extension, treat as image (safer default)
  return false;
}
