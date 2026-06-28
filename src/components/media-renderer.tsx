'use client';

/**
 * MediaRenderer — Universal media display component
 * Handles images, videos, blob URLs, Supabase URLs, and external embeds.
 * Never breaks — always shows something.
 */

import React, { useRef, useEffect, useState } from 'react';
import { cn, getEmbedUrl } from '../lib/utils';
import { detectMediaType } from '../lib/media';
import { PlayCircle, ImageOff } from 'lucide-react';

interface MediaRendererProps {
  url: string;
  fileType?: string;
  className?: string;
  /** Play video when scrolled into view */
  autoPlayOnView?: boolean;
  /** CSS filter string for editing */
  filter?: string;
  /** Show controls on video */
  controls?: boolean;
  /** Loop video */
  loop?: boolean;
  /** Alt text for images */
  alt?: string;
  /** Called when media fails to load */
  onError?: () => void;
  /** Called when media loads successfully */
  onLoad?: () => void;
}

export function MediaRenderer({
  url,
  fileType,
  className,
  autoPlayOnView = false,
  filter,
  controls = false,
  loop = true,
  alt = 'media',
  onError,
  onLoad,
}: MediaRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const type = detectMediaType(url, fileType);

  // IntersectionObserver for autoplay
  useEffect(() => {
    if (!autoPlayOnView || (type !== 'video' && type !== 'unknown')) return;
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= 0.5),
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [autoPlayOnView, type]);

  // Play/pause on view change
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (inView) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [inView]);

  if (!url) {
    return (
      <div className={cn('flex items-center justify-center bg-zinc-900', className)}>
        <ImageOff className="h-8 w-8 text-white/20" />
      </div>
    );
  }

  const filterStyle = filter ? { filter } : undefined;

  // ── External embed (YouTube, TikTok, Instagram, Vimeo) ──────────────────────
  if (type === 'external') {
    const embedUrl = getEmbedUrl(url);
    return (
      <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
        <iframe
          src={embedUrl}
          className="w-full h-full border-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          style={filterStyle}
          onLoad={onLoad}
        />
      </div>
    );
  }

  // ── Native video (blob, data:video, .mp4, Supabase video) ───────────────────
  // Also handles 'unknown' blob: URLs by trying video first
  if (type === 'video' || type === 'unknown') {
    if (videoError && type === 'unknown') {
      // blob: URL failed as video — try as image
      return (
        <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
          <img
            src={url}
            alt={alt}
            className="w-full h-full object-cover"
            style={filterStyle}
            loading="lazy"
            onLoad={onLoad}
            onError={() => { setImgError(true); onError?.(); }}
          />
        </div>
      );
    }
    if (videoError) {
      return (
        <div className={cn('flex flex-col items-center justify-center bg-zinc-900 gap-2', className)}>
          <PlayCircle className="h-12 w-12 text-white/30" />
          <p className="text-[10px] text-white/30 font-medium">Video unavailable</p>
        </div>
      );
    }
    return (
      <div ref={containerRef} className={cn('relative overflow-hidden bg-black', className)}>
        <video
          ref={videoRef}
          src={url}
          className="w-full h-full object-contain"
          style={filterStyle}
          loop={loop}
          playsInline
          muted={autoPlayOnView}
          controls={controls}
          preload="metadata"
          onLoadedData={onLoad}
          onError={() => { setVideoError(true); onError?.(); }}
        />
        {/* Play overlay when not autoplaying */}
        {!autoPlayOnView && !controls && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-14 w-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <PlayCircle className="h-8 w-8 text-white/80" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Image (blob, data:image, .jpg/.png, Supabase image) ─────────────────────
  if (imgError) {
    return (
      <div className={cn('flex items-center justify-center bg-zinc-900', className)}>
        <ImageOff className="h-8 w-8 text-white/20" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
      {/* Use native <img> instead of Next.js <Image> to support all URL types */}
      <img
        src={url}
        alt={alt}
        className="w-full h-full object-cover"
        style={filterStyle}
        loading="lazy"
        decoding="async"
        onLoad={onLoad}
        onError={() => { setImgError(true); onError?.(); }}
      />
    </div>
  );
}

// ─── Upload progress indicator ─────────────────────────────────────────────────
interface UploadProgressProps {
  progress: number; // 0-100
  label?: string;
}

export function UploadProgress({ progress, label = 'Uploading...' }: UploadProgressProps) {
  if (progress <= 0 || progress >= 100) return null;
  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-inherit">
      <div className="w-2/3 space-y-2 text-center">
        <p className="text-xs font-black uppercase tracking-widest text-white">{label}</p>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-white/40 font-bold">{progress}%</p>
      </div>
    </div>
  );
}
