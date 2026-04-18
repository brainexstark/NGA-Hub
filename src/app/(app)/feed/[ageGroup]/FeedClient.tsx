'use client';

import * as React from 'react';
import { Skeleton } from '../../../../components/ui/skeleton';
import { Newspaper, Music, Trophy, Tv, Globe, Flame, Heart, MessageCircle, Send, PlayCircle } from 'lucide-react';
import { cn, getEmbedUrl } from '../../../../lib/utils';
import { useRealtimeFeed } from '../../../../hooks/use-realtime-feed';
import { aiDatabase } from '../../../../lib/ai-database';
import type { Post } from '../../../../lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import { ShareDialog } from '../../../../components/share-dialog';
import Link from 'next/link';
import { useUser, useFirestore, updateDocumentNonBlocking } from '../../../../firebase';
import { doc, arrayUnion } from 'firebase/firestore';

type AgeGroup = 'under-10' | '10-16' | '16-plus';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Globe },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'entertainment', label: 'Fun', icon: Tv },
];

// Auto-play when scrolled into view
function FeedVideo({ url, thumbnail }: { url: string; thumbnail: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPlaying(entry.isIntersecting && entry.intersectionRatio >= 0.5),
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isExternal = url.includes('youtube') || url.includes('youtu.be') || url.includes('instagram') || url.includes('tiktok');

  const embedUrl = React.useMemo(() => {
    const base = getEmbedUrl(url);
    if (playing && base.includes('youtube.com/embed')) {
      return base.includes('?') ? `${base}&autoplay=1&mute=1&playsinline=1` : `${base}?autoplay=1&mute=1&playsinline=1`;
    }
    return base;
  }, [url, playing]);

  return (
    <div ref={ref} className="w-full h-full">
      {playing ? (
        isExternal ? (
          <iframe key="play" src={embedUrl} className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : (
          <video src={url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
        )
      ) : (
        <div className="w-full h-full relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumbnail} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="p-4 rounded-full bg-red-600/90 shadow-2xl">
              <PlayCircle className="h-10 w-10 text-white fill-white" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeedPostCard({ post }: { post: Post }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [liked, setLiked] = React.useState(false);

  const handleEngagement = () => {
    window.dispatchEvent(new CustomEvent('stark-b-entertainment-engaged'));
    if (user && firestore) {
      updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
        watchHistory: arrayUnion(post.id),
      });
    }
  };

  return (
    <div className="w-full snap-center relative bg-black overflow-hidden" style={{ height: '100svh' }} onClick={handleEngagement}>
      {/* Full screen video */}
      <div className="absolute inset-0">
        <FeedVideo url={post.url || post.mediaUrl} thumbnail={post.mediaUrl || `https://picsum.photos/seed/${post.id}/800/1400`} />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {/* Bottom info */}
      <div className="absolute bottom-24 left-4 right-16 z-10 space-y-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 border-2 border-white/30">
            <AvatarImage src={post.userAvatar || `https://picsum.photos/seed/${post.userId}/100/100`} />
            <AvatarFallback>{post.userName?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <span className="font-black text-sm text-white uppercase tracking-tight">@{post.userName?.replace(/\s/g, '_').toLowerCase()}</span>
        </div>
        <p className="text-xs text-white/80 font-medium italic line-clamp-2">"{post.caption || post.title}"</p>
      </div>

      {/* Right actions */}
      <div className="absolute right-3 bottom-28 flex flex-col gap-5 z-10 items-center">
        <button onClick={() => setLiked(p => !p)} className="flex flex-col items-center gap-1">
          <Heart className={cn("h-7 w-7 transition-all", liked ? "fill-red-500 text-red-500" : "text-white")} />
          <span className="text-[9px] font-black text-white">{liked ? (post.likesCount + 1) : post.likesCount}</span>
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

  const staticPosts = React.useMemo((): Post[] =>
    (aiDatabase.superdatabasePosts[ageGroup as AgeGroup] || []).map(p => ({
      id: p.id, userId: 'system', userName: p.userName,
      userAvatar: `https://picsum.photos/seed/${p.id}/100/100`,
      type: 'video' as const, category: p.category,
      mediaUrl: p.mediaUrl, url: p.url, caption: p.caption,
      title: p.title, ageGroup, likesCount: 0, commentsCount: 0,
      createdAt: new Date(), isFlagged: false,
    })), [ageGroup]);

  const displayPosts = realtimePosts.length > 0 ? realtimePosts : staticPosts;

  return (
    <div className="fixed inset-0 bg-black z-0">
      {/* Category bar — floating on top */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-2 overflow-x-auto no-scrollbar px-4 pt-3 pb-2 bg-gradient-to-b from-black/60 to-transparent">
        <div className="mr-2">
          <p className="font-headline text-sm font-black tracking-tight text-white">Feeds</p>
          <p className="text-[8px] font-black uppercase tracking-widest text-white/40">
            {realtimePosts.length > 0 ? `${realtimePosts.length} posts` : 'Trending'} · <span className="text-green-400">● Live</span>
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

      {/* New posts banner */}
      {newCount > 0 && (
        <button onClick={loadNewPosts}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 py-2 px-5 bg-primary text-white rounded-full font-black text-[11px] uppercase tracking-widest shadow-lg animate-in slide-in-from-top-2">
          <Flame className="h-4 w-4" />
          {newCount} new — tap to load
        </button>
      )}

      {/* Full-screen snap scroll */}
      {loading ? (
        <div className="h-full flex items-center justify-center">
          <div className="space-y-4 w-full px-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)}
          </div>
        </div>
      ) : (
        <div className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar">
          {displayPosts.map(post => (
            <FeedPostCard key={post.id} post={post} />
          ))}
          {displayPosts.length === 0 && (
            <div className="h-full flex items-center justify-center opacity-30 flex-col gap-4">
              <Globe className="h-10 w-10" />
              <p className="italic font-medium text-sm text-white">No posts yet. Be the first!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
