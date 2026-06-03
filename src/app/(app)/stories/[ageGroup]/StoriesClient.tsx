'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/ui/avatar";
import { ChevronLeft, ChevronRight, PlayCircle, Loader2, X, Plus, Pause, Play } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { getEmbedUrl } from '../../../../lib/utils';
import { supabase } from '../../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { cn } from '../../../../lib/utils';

const IMAGE_DURATION_MS = 5000; // 5 s for images / external embeds

function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('youtube') || lower.includes('youtu.be') ||
    lower.includes('tiktok') || lower.endsWith('.mp4') ||
    lower.endsWith('.webm') || lower.endsWith('.mov') ||
    lower.startsWith('data:video') || lower.startsWith('blob:') ||
    lower.includes('/storage/v1/object/') || lower.includes('/object/public/')
  );
}

// ─── Individual story media player ───────────────────────────────────────────
function StoryMedia({
  url,
  paused,
  onDurationKnown,
  onEnded,
}: {
  url: string;
  paused: boolean;
  onDurationKnown: (ms: number) => void;
  onEnded: () => void;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Play / pause based on parent state
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) {
      v.pause();
    } else {
      v.play().catch(() => {});
    }
  }, [paused]);

  if (!isVideoUrl(url)) {
    // Image — timer is handled by the parent, nothing to do here
    return (
      <img
        src={url}
        alt="story"
        className="w-full h-full object-contain bg-black"
        onLoad={() => onDurationKnown(IMAGE_DURATION_MS)}
      />
    );
  }

  const isExternal =
    url.includes('youtube') || url.includes('youtu.be') || url.includes('tiktok');

  if (isExternal) {
    // External embeds — use fixed duration since we can't detect video end
    React.useEffect(() => { onDurationKnown(IMAGE_DURATION_MS); }, []);
    return (
      <iframe
        src={getEmbedUrl(url)}
        className="w-full h-full border-none"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <video
      ref={videoRef}
      src={url}
      className="w-full h-full object-contain bg-black"
      autoPlay
      playsInline
      onLoadedMetadata={(e) => {
        const dur = (e.currentTarget.duration || 0) * 1000;
        onDurationKnown(dur > 0 ? Math.min(dur, 30_000) : IMAGE_DURATION_MS);
      }}
      onEnded={onEnded}
    />
  );
}

// ─── Full-screen viewer ───────────────────────────────────────────────────────
function StoryViewer({
  stories,
  startIndex,
  onClose,
}: {
  stories: any[];
  startIndex: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [index, setIndex] = React.useState(startIndex);
  const [progress, setProgress] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [duration, setDuration] = React.useState(IMAGE_DURATION_MS);

  const rafRef = React.useRef<number | null>(null);
  const startTimeRef = React.useRef<number>(0);
  const pausedAtRef = React.useRef<number>(0); // how much time elapsed when paused

  const story = stories[index];

  // When story index or duration changes, restart the progress animation
  const startProgress = React.useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startTimeRef.current = performance.now() - pausedAtRef.current;

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [duration]);

  // Reset and start when story changes
  React.useEffect(() => {
    pausedAtRef.current = 0;
    setProgress(0);
    setPaused(false);
    // Wait for onDurationKnown before starting (see handleDuration)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [index]);

  // Handle play/pause toggle
  React.useEffect(() => {
    if (!rafRef.current && !paused) return; // not started yet
    if (paused) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      pausedAtRef.current = (progress / 100) * duration;
    } else {
      startProgress();
    }
  }, [paused]);

  const handleDuration = React.useCallback((ms: number) => {
    setDuration(ms);
    pausedAtRef.current = 0;
    startTimeRef.current = performance.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const pct = Math.min((elapsed / ms) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const goNext = React.useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (index < stories.length - 1) {
      setIndex(i => i + 1);
    } else {
      // All stories done — close and go back
      onClose();
      router.back();
    }
  }, [index, stories.length, onClose, router]);

  const goPrev = React.useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (index > 0) {
      setIndex(i => i - 1);
    }
  }, [index]);

  // Keyboard nav
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') { e.preventDefault(); setPaused(p => !p); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, onClose]);

  if (!story) return null;

  return (
    <div className="w-full h-full bg-black relative overflow-hidden select-none">

      {/* ── Progress bars ── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 px-3 pt-safe pt-3">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-[3px] bg-white/25 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full"
              style={{
                width: i < index ? '100%' : i === index ? `${progress}%` : '0%',
                transition: i === index ? 'none' : undefined,
              }}
            />
          </div>
        ))}
      </div>

      {/* ── Header ── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-9">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-9 w-9 border-2 border-white/50 shrink-0">
            <AvatarImage src={story.user_avatar || ''} />
            <AvatarFallback className="bg-primary/30 text-white font-black text-xs">
              {story.user_name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-black text-sm leading-none drop-shadow">
              @{(story.user_name || 'user').replace(/\s/g, '_').toLowerCase()}
            </p>
            <p className="text-white/50 text-[9px] font-bold uppercase tracking-widest mt-0.5">
              {new Date(story.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setPaused(p => !p); }}
            className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center"
          >
            {paused
              ? <Play className="h-4 w-4 text-white" />
              : <Pause className="h-4 w-4 text-white" />
            }
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {/* ── Media ── */}
      <div className="absolute inset-0">
        <StoryMedia
          key={story.id}
          url={story.media_url}
          paused={paused}
          onDurationKnown={handleDuration}
          onEnded={goNext}
        />
      </div>

      {/* ── Caption ── */}
      {story.caption && (
        <div className="absolute bottom-10 left-4 right-4 z-20 text-center pointer-events-none">
          <p className="text-white text-sm font-medium drop-shadow-2xl bg-black/40 backdrop-blur-md rounded-2xl px-4 py-2 inline-block">
            {story.caption}
          </p>
        </div>
      )}

      {/* ── Tap zones — left 1/3 = prev, right 2/3 = next ── */}
      <div className="absolute inset-0 z-20 flex" style={{ top: '80px', bottom: '60px' }}>
        <div className="w-1/3 h-full cursor-pointer" onClick={goPrev} />
        <div className="w-2/3 h-full cursor-pointer" onClick={goNext} />
      </div>

      {/* ── Story counter badge ── */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
          {index + 1} / {stories.length}
        </span>
      </div>

      {/* ── Arrow buttons (visible on wider screens) ── */}
      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md items-center justify-center"
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>
      )}
      {index < stories.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md items-center justify-center"
        >
          <ChevronRight className="h-5 w-5 text-white" />
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StoriesClient({ ageGroup }: { ageGroup: string }) {
  const router = useRouter();
  const [stories, setStories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [startIndex, setStartIndex] = React.useState(0);

  React.useEffect(() => {
    supabase
      .from('stories')
      .select('*')
      .eq('age_group', ageGroup)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setStories(data);
        setLoading(false);
      });

    const channel = supabase
      .channel(`stories-page-${ageGroup}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'stories', filter: `age_group=eq.${ageGroup}` },
        (payload) => setStories(prev => [payload.new as any, ...prev])
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ageGroup]);

  const openStory = (i: number) => {
    setStartIndex(i);
    setViewerOpen(true);
    window.dispatchEvent(new CustomEvent('stark-b-entertainment-engaged'));
  };

  const handleClose = () => {
    setViewerOpen(false);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // ── Full-screen viewer (no dialog wrapper — avoids scroll/sizing issues) ───
  if (viewerOpen && stories.length > 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <StoryViewer
          stories={stories}
          startIndex={startIndex}
          onClose={handleClose}
        />
      </div>
    );
  }

  // ── Stories list ──────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto max-w-lg p-4 space-y-5 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <h1 className="font-black text-xl uppercase tracking-tight">Stories</h1>
        <Button
          size="sm"
          className="rounded-full font-black text-[10px] uppercase tracking-widest h-9"
          onClick={() => router.push('/create-post?type=story')}
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Story
        </Button>
      </div>

      {stories.length === 0 ? (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4 opacity-30">
          <PlayCircle className="h-12 w-12" />
          <p className="font-black text-sm uppercase tracking-widest">No stories yet</p>
          <p className="text-xs opacity-60">Be the first to post one</p>
        </div>
      ) : (
        <>
          {/* Story bubbles — tap any to open from that person */}
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {stories.map((story, i) => (
              <button
                key={story.id}
                onClick={() => openStory(i)}
                className="flex flex-col items-center gap-1.5 shrink-0 group"
              >
                <div className="p-0.5 rounded-full bg-gradient-to-tr from-primary to-accent group-active:scale-95 transition-transform">
                  <div className="h-16 w-16 rounded-full border-2 border-background overflow-hidden bg-black">
                    {story.user_avatar ? (
                      <img src={story.user_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-black text-xl">
                        {story.user_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-white/60 truncate max-w-[64px]">
                  @{(story.user_name || 'user').replace(/\s/g, '_').toLowerCase()}
                </span>
              </button>
            ))}
          </div>

          {/* Featured preview card — tapping plays from first story */}
          <div className="relative cursor-pointer group" onClick={() => openStory(0)}>
            <div className="w-full aspect-[9/16] max-h-[72vh] rounded-[2.5rem] overflow-hidden border-2 border-primary/20 shadow-2xl bg-black">
              {isVideoUrl(stories[0].media_url) ? (
                <video
                  src={stories[0].media_url}
                  className="w-full h-full object-contain bg-black"
                  muted playsInline preload="metadata"
                />
              ) : (
                <img
                  src={stories[0].media_url}
                  alt="story"
                  className="w-full h-full object-contain bg-black"
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />

              {/* Segments */}
              <div className="absolute top-4 left-4 right-4 flex gap-1 pointer-events-none">
                {stories.map((_, idx) => (
                  <div key={idx} className={cn("flex-1 h-0.5 rounded-full", idx === 0 ? "bg-white" : "bg-white/30")} />
                ))}
              </div>

              {/* Author chip */}
              <div className="absolute top-8 left-4 right-4 flex items-center gap-3 pointer-events-none">
                <Avatar className="h-9 w-9 border-2 border-white/30">
                  <AvatarImage src={stories[0].user_avatar || ''} />
                  <AvatarFallback className="bg-primary/30 text-white font-black text-xs">
                    {stories[0].user_name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <p className="text-white font-black text-sm uppercase tracking-tight">
                  @{(stories[0].user_name || 'user').replace(/\s/g, '_').toLowerCase()}
                </p>
              </div>

              {stories[0].caption && (
                <div className="absolute bottom-8 left-4 right-4 text-center pointer-events-none">
                  <p className="text-white font-medium text-sm italic">"{stories[0].caption}"</p>
                </div>
              )}

              {/* Tap hint */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-white/10 backdrop-blur-md rounded-full p-5 border border-white/20">
                  <PlayCircle className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
