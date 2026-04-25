
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
  // File type takes priority
  if (fileType) return fileType.startsWith('video/');
  const lower = url.toLowerCase();
  return (
    lower.includes('youtube.com') ||
    lower.includes('youtu.be') ||
    lower.includes('tiktok.com') ||
    lower.includes('instagram.com') ||
    lower.includes('vimeo.com') ||
    lower.includes('facebook.com/watch') ||
    lower.includes('fb.watch') ||
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.avi') ||
    lower.endsWith('.mkv') ||
    lower.endsWith('.m4v') ||
    lower.endsWith('.ogv') ||
    lower.startsWith('data:video') ||
    lower.includes('/video/') ||
    lower.includes('video_url') ||
    lower.includes('shorts/')
  );
}
