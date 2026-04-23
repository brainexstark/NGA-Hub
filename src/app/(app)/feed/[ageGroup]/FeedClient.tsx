'use client';

import * as React from 'react';
import { Skeleton } from '../../../../components/ui/skeleton';
import { Newspaper, Music, Trophy, Tv, Globe, Flame, Heart, MessageCircle, Send, PlayCircle, Volume2, VolumeX } from 'lucide-react';
import { cn, getEmbedUrl } from '../../../../lib/utils';
import { useRealtimeFeed } from '../../../../hooks/use-realtime-feed';
import { useRealtimeLikes, useLiveReactions } from '../../../../hooks/use-realtime';
import type { Post } from '../../../../lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import { ShareDialog } from '../../../../components/share-dialog';
import Link from 'next/link';
import { useUser, useFirestore, updateDocumentNonBlocking } from '../../../../firebase';
import { doc, arrayUnion } from 'firebase/firestore';
import { isAd, type Ad } from '../../../../lib/ads';
import { supabase } from '../../../../lib/supabase';
import { useToast } from '../../../../hooks/use-toast';

type AgeGroup = 'under-10' | '10-16' | '16-plus';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Globe },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'entertainment', label: 'Fun', icon: Tv },
];

function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.includes('youtube') || lower.includes('youtu.be') ||
    lower.includes('tiktok') || lower.includes('instagram') ||
    lower.endsWith('.mp4') || lower.endsWith('.webm') ||
    lower.endsWith('.mov') || lower.endsWith('.avi') ||
    lower.endsWith('.mkv') || lower.startsWith('data:video');
}

// Instagram-style video: shows first frame when not in view, plays when scrolled to
function FeedVideo({ url, thumbnail }: { url: string; thumbnail: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [inView, setInView] = React.useState(false);
  const [muted, setMuted] = React.useState(true);
  const isVideo = isVideoUrl(url);
  const isExternal = url.includes('youtube') || url.includes('youtu.be') ||
    url.includes('tiktok') || url.includes('instagram');

  React.useEffect(() => {
    if (!isVideo || isExternal) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= 0.6),
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isVideo, isExternal]);

  // Play/pause based on visibility
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (inView) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [inView]);

  const embedUrl = React.useMemo(() => {
    if (!isExternal) return url;
    const base = getEmbedUrl(url);
    if (inView && base.includes('youtube.com/embed')) {
      return base.includes('?') ? `${base}&autoplay=1&mute=1&playsinline=1` : `${base}?autoplay=1&mute=1&playsinline=1`;
    }
    return base;
  }, [url, inView, isExternal]);

  if (!isVideo) {
    // Static photo — just display, never autoplay
    return (
      <div ref={containerRef} className="w-full h-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url || thumbnail} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  if (isExternal) {
    return (
      <div ref={containerRef} className="w-full h-full">
        {inView ? (
          <iframe key="play" src={embedUrl} className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : (
          <div className="w-full h-full relative bg-black flex items-center justify-center">
            {thumbnail && <img src={thumbnail} alt="" className="w-full h-full object-cover opacity-60" />}
            <PlayCircle className="absolute h-16 w-16 text-white/80 drop-shadow-2xl" />
          </div>
        )}
      </div>
    );
  }

  // Local/direct video — Instagram style
  return (
    <div ref={containerRef} className="w-full h-full relative">
      {/* Video element — always rendered, first frame shows as cover */}
      <video
        ref={videoRef}
        src={url}
        className="w-full h-full object-cover"
        muted={muted}
        loop
        playsInline
        preload="metadata"
      />
      {/* Mute toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); setMuted(p => !p); }}
        className="absolute bottom-4 right-4 z-10 p-2 bg-black/40 backdrop-blur-md rounded-full"
      >
        {muted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-white" />}
      </button>
      {/* Play indicator when paused */}
      {!inView && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <PlayCircle className="h-14 w-14 text-white/60 drop-shadow-2xl" />
        </div>
      )}
    </div>
  );
}

// Full-screen YouTube-style ad
function AdCard({ ad }: { ad: Ad }) {
  const [skippable, setSkippable] = React.useState(false);
  const [countdown, setCountdown] = React.useState(5);
  const [skipped, setSkipped] = React.useState(false);

  React.useEffect(() => {
    const t = setInterval(() => {
      setCountdown(p => {
        if (p <= 1) { setSkippable(true); clearInterval(t); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  if (skipped) return null;

  return (
    <div className="w-full snap-center relative bg-black overflow-hidden" style={{ height: '100svh' }}>
      <div className="absolute inset-0">
        {ad.video_url ? (
          <video src={ad.video_url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.media_url} alt={ad.title} className="w-full h-full object-cover" />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

      {/* Ad label */}
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full">
        <span className="text-[9px] font-black uppercase text-yellow-400 tracking-widest">Ad</span>
      </div>

      {/* Skip button */}
      <div className="absolute bottom-32 right-4 z-10">
        {skippable ? (
          <button onClick={() => setSkipped(true)}
            className="bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-white/20 active:scale-95 transition-all">
            Skip Ad →
          </button>
        ) : (
          <div className="bg-black/70 backdrop-blur-md text-white/60 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-white/10">
            Skip in {countdown}s
          </div>
        )}
      </div>

      {/* Ad info */}
      <div className="absolute bottom-24 left-4 right-20 z-10 space-y-1">
        <p className="font-black text-sm text-white uppercase tracking-tight">{ad.title}</p>
        <p className="text-xs text-white/60">{ad.caption}</p>
        {ad.click_url && (
          <a href={ad.click_url} target="_blank" rel="noopener noreferrer"
            className="inline-block mt-1 bg-white text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
            Learn More
          </a>
        )}
      </div>
    </div>
  );
}

function FeedPostCard({ post }: { post: Post }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { likesCount, liked, toggleLike } = useRealtimeLikes(post.id, user?.uid || '');
  const { reactions, sendReaction } = useLiveReactions(post.id);
  const [followed, setFollowed] = React.useState(false);
  const [isDisciple, setIsDisciple] = React.useState(false);
  const [showHeart, setShowHeart] = React.useState(false);
  const { toast } = useToast();
  const lastTapRef = React.useRef<number>(0);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !post.userId || post.userId === user.uid) return;
    if (followed) {
      await supabase.from('follows').delete().eq('follower_id', user.uid).eq('following_id', post.userId);
      setFollowed(false);
    } else {
      await supabase.from('follows').insert({ follower_id: user.uid, following_id: post.userId });
      setFollowed(true);
    }
  };

  const handleDisciple = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    setIsDisciple(p => !p);
    toast({ title: isDisciple ? 'Removed from disciples' : `You are now a disciple of @${post.userName}` });
  };

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap — like!
      if (!liked) toggleLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 900);
    }
    lastTapRef.current = now;
    window.dispatchEvent(new CustomEvent('stark-b-entertainment-engaged'));
    if (user && firestore) {
      updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
        watchHistory: arrayUnion(post.id),
      });
    }
  };

  return (
    <div className="w-full snap-center relative bg-black overflow-hidden" style={{ height: '100svh' }} onClick={handleTap}>
      <div className="absolute inset-0">
        <FeedVideo url={post.url || post.mediaUrl} thumbnail={post.mediaUrl || ''} />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {/* Double-tap heart animation */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <Heart className="h-28 w-28 fill-red-500 text-red-500 animate-in zoom-in-50 duration-300 drop-shadow-2xl" />
        </div>
      )}

      {/* Floating live reactions */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {reactions.map(r => (
          <div key={r.id} className="absolute bottom-32 animate-in slide-in-from-bottom-4 fade-in duration-300"
            style={{ left: `${r.x}%`, animationFillMode: 'forwards' }}>
            <span className="text-3xl drop-shadow-2xl">{r.emoji}</span>
          </div>
        ))}
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-24 left-4 right-16 z-10 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Avatar className="h-8 w-8 border-2 border-white/30 shrink-0">
            <AvatarImage src={post.userAvatar || ''} />
            <AvatarFallback className="bg-primary/20 text-primary font-black text-xs">
              {post.userName?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="font-black text-sm text-white uppercase tracking-tight">
            @{post.userName?.replace(/\s/g, '_').toLowerCase()}
          </span>
          {/* Follow button */}
          {post.userId !== user?.uid && (
            <>
              <button onClick={handleFollow}
                className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-300 active:scale-95",
                  followed
                    ? "bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-600/30"
                    : "bg-primary text-white border-primary shadow-lg shadow-primary/30")}>
                {followed ? '✓ Following' : '+ Follow'}
              </button>
              <button onClick={handleDisciple}
                className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-300 active:scale-95",
                  isDisciple
                    ? "bg-yellow-400 text-black border-yellow-400 shadow-lg shadow-yellow-400/30"
                    : "bg-white/10 text-white/70 border-white/20")}>
                {isDisciple ? '⭐ Disciple' : 'Be Disciple?'}
              </button>
            </>
          )}
        </div>
        <p className="text-xs text-white/80 font-medium italic line-clamp-2">"{post.caption || post.title}"</p>
      </div>

      {/* Right actions */}
      <div className="absolute right-3 bottom-28 flex flex-col gap-5 z-10 items-center">
        <button onClick={(e) => { e.stopPropagation(); toggleLike(); }} className="flex flex-col items-center gap-1">
          <Heart className={cn("h-7 w-7 transition-all", liked ? "fill-red-500 text-red-500" : "text-white")} />
          <span className="text-[9px] font-black text-white">{likesCount}</span>
        </button>
        <Link href={`/comments/${post.id}`} className="flex flex-col items-center gap-1">
          <MessageCircle className="h-7 w-7 text-white" />
          <span className="text-[9px] font-black text-white">{post.commentsCount}</span>
        </Link>
        <ShareDialog title={post.title || post.caption} url={post.url || post.mediaUrl}>
          <div className="flex flex-col items-center gap-1 cursor-pointer">
            <Send className="h-7 w-7 text-white" />
            <span className="text-[9px] font-black text-white">Share</span>
          </div>
        </ShareDialog>
      </div>
    </div>
  );
}

export default function FeedClient({ ageGroup }: { ageGroup: string }) {
  const [activeCategory, setActiveCategory] = React.useState('all');
  const { posts: realtimePosts, loading, newCount, loadNewPosts } = useRealtimeFeed(ageGroup, activeCategory);

  return (
    <div className="fixed inset-0 bg-black z-0">
      {/* Category bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-2 overflow-x-auto no-scrollbar px-4 pt-3 pb-2 bg-gradient-to-b from-black/60 to-transparent">
        <div className="mr-2">
          <p className="font-headline text-sm font-black tracking-tight text-white">Feed</p>
          <p className="text-[8px] font-black uppercase tracking-widest text-white/40">
            {realtimePosts.length > 0 ? `${realtimePosts.length} posts` : 'Live'} · <span className="text-green-400">● Live</span>
          </p>
        </div>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest whitespace-nowrap transition-all border shrink-0",
              activeCategory === cat.id ? "bg-primary text-white border-primary" : "bg-white/10 text-white/60 border-white/10"
            )}>
            <cat.icon className="h-3 w-3" />{cat.label}
          </button>
        ))}
      </div>

      {newCount > 0 && (
        <button onClick={loadNewPosts}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 py-2 px-5 bg-primary text-white rounded-full font-black text-[11px] uppercase tracking-widest shadow-lg animate-in slide-in-from-top-2">
          <Flame className="h-4 w-4" />
          {newCount} new — tap to load
        </button>
      )}

      {loading ? (
        <div className="h-full flex items-center justify-center">
          <div className="space-y-4 w-full px-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)}
          </div>
        </div>
      ) : (
        <div className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar">
          {realtimePosts.map((post, i) => (
            <FeedPostCard key={post.id} post={post} />
          ))}
          {realtimePosts.length === 0 && (
            <div className="h-full flex items-center justify-center opacity-30 flex-col gap-4">
              <Globe className="h-10 w-10 text-white" />
              <p className="italic font-medium text-sm text-white">No posts yet. Be the first!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
