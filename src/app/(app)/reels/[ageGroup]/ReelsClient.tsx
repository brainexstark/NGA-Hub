'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/ui/avatar";
import { Button } from "../../../../components/ui/button";
import { Heart, MessageCircle, Share2, Zap, Globe, Newspaper, Music, Trophy, Tv, Download } from "lucide-react";
import { useToast } from "../../../../hooks/use-toast";
import { ShareDialog } from '../../../../components/share-dialog';
import { cn, getEmbedUrl } from '../../../../lib/utils';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "../../../../firebase";
import { collection, serverTimestamp, doc, addDoc } from "firebase/firestore";
import type { UserProfile } from '../../../../lib/types';
import { containsInappropriateWords } from '../../../../lib/inappropriate-words';
import { useRealtimeFeed } from '../../../../hooks/use-realtime-feed';
import { useRealtimeLikes } from '../../../../hooks/use-realtime';
import { supabase } from '../../../../lib/supabase';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Globe },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'entertainment', label: 'Fun', icon: Tv },
];

// Auto-play iframe when scrolled into view
function AutoPlayReel({ url, isActive }: { url: string; isActive: boolean }) {
  const embedUrl = React.useMemo(() => {
    const base = getEmbedUrl(url);
    // Force autoplay when active
    if (isActive) {
      if (base.includes('youtube.com/embed')) {
        return base.includes('?')
          ? `${base}&autoplay=1&mute=1&playsinline=1`
          : `${base}?autoplay=1&mute=1&playsinline=1`;
      }
    }
    return base;
  }, [url, isActive]);

  if (!url) return null;

  // Direct video file
  if (!url.includes('youtube') && !url.includes('youtu.be') && !url.includes('instagram') && !url.includes('tiktok')) {
    return (
      <video
        src={url}
        className="w-full h-full object-cover"
        autoPlay={isActive}
        muted
        loop
        playsInline
      />
    );
  }

  return (
    <iframe
      key={isActive ? 'active' : 'inactive'}
      src={embedUrl}
      className="w-full h-full border-none"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}

function ReelItem({
  reel, index, activeIndex, ageGroup, onSave,
}: {
  reel: any; index: number; activeIndex: number; ageGroup: string;
  onSave: (reel: any) => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isActive = index === activeIndex;
  const { toast } = useToast();
  const { user } = useUser();
  const { likesCount, liked, toggleLike } = useRealtimeLikes(reel.id, user?.uid || '');
  const [followed, setFollowed] = React.useState(false);
  const [isDisciple, setIsDisciple] = React.useState(false);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !reel.userId) return;
    if (followed) {
      await supabase.from('follows').delete().eq('follower_id', user.uid).eq('following_id', reel.userId);
      setFollowed(false);
      toast({ title: 'Unfollowed' });
    } else {
      await supabase.from('follows').insert({ follower_id: user.uid, following_id: reel.userId });
      setFollowed(true);
      toast({ title: `Following @${reel.userName}` });
    }
  };

  const handleDisciple = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    setIsDisciple(p => !p);
    toast({ title: isDisciple ? 'Removed from disciples' : `You are now a disciple of @${reel.userName}` });
  };

  return (
    <div
      ref={ref}
      className="h-full w-full flex items-center justify-center snap-center relative bg-black"
    >
      {/* Full-screen player */}
      <div className="absolute inset-0">
        <AutoPlayReel url={reel.url || reel.imageUrl} isActive={isActive} />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-16 p-5 z-10 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Avatar className="h-9 w-9 border-2 border-white/30 shrink-0">
            <AvatarImage src={reel.userAvatar || ''} />
            <AvatarFallback className="bg-primary/20 text-primary font-black text-xs">
              {reel.userName?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <p className="font-black text-sm text-white uppercase tracking-tight">
            @{(reel.userName || 'user').replace(/\s/g, '_').toLowerCase()}
          </p>
          {/* Follow button */}
          <button onClick={handleFollow}
            className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95",
              followed ? "bg-white/20 text-white border-white/20" : "bg-primary text-white border-primary")}>
            {followed ? 'Following' : '+ Follow'}
          </button>
          {/* Disciple button */}
          <button onClick={handleDisciple}
            className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95",
              isDisciple ? "bg-accent/20 text-accent border-accent/30" : "bg-white/10 text-white/70 border-white/20")}>
            {isDisciple ? '✓ Disciple' : 'Be Disciple?'}
          </button>
        </div>
        <p className="text-xs text-white/80 font-medium italic line-clamp-2">"{reel.description || reel.caption}"</p>
      </div>

      {/* Right actions */}
      <div className="absolute right-3 bottom-24 flex flex-col gap-5 z-20 items-center">
        <button onClick={() => toggleLike()} className="flex flex-col items-center gap-1">
          <Heart className={cn("h-7 w-7 transition-all", liked ? "fill-red-500 text-red-500" : "text-white")} />
          <span className="text-[9px] font-black text-white">{likesCount > 0 ? likesCount.toLocaleString() : '0'}</span>
        </button>
        <Link href={`/comments/${reel.id}`} className="flex flex-col items-center gap-1">
          <MessageCircle className="h-7 w-7 text-white" />
          <span className="text-[9px] font-black text-white">Chat</span>
        </Link>
        <button onClick={() => toast({ title: 'Mentor request sent' })} className="flex flex-col items-center gap-1">
          <Zap className="h-7 w-7 text-white" />
          <span className="text-[9px] font-black text-white">Mentor</span>
        </button>
        <ShareDialog title={reel.description} url={reel.url || reel.imageUrl}>
          <div className="flex flex-col items-center gap-1 cursor-pointer">
            <Share2 className="h-7 w-7 text-white" />
            <span className="text-[9px] font-black text-white">Share</span>
          </div>
        </ShareDialog>
        <button onClick={() => onSave(reel)} className="flex flex-col items-center gap-1">
          <Download className="h-7 w-7 text-white" />
          <span className="text-[9px] font-black text-white">Save</span>
        </button>
      </div>
    </div>
  );
}

export default function ReelsClient({ ageGroup }: { ageGroup: string }) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const isUnder10 = ageGroup === 'under-10';

  const profileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: profile } = useDoc<UserProfile>(profileRef);

  const [followedUsers, setFollowedUsers] = React.useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = React.useState('all');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Supabase user-uploaded reels — newest first
  const { posts: supabasePosts } = useRealtimeFeed(ageGroup);

  // Only show real user content — no static mock reels
  const allReels = React.useMemo(() => {
    const userReels = supabasePosts
      .slice() // copy to avoid mutating
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(p => ({
        id: p.id,
        description: p.caption,
        caption: p.caption,
        imageUrl: p.mediaUrl,
        url: p.url || p.mediaUrl,
        category: p.category || 'general',
        userName: p.userName,
        userAvatar: p.userAvatar,
      }));

    if (!isUnder10) return userReels;
    return userReels.filter(r => !containsInappropriateWords(`${r.description || ''}`));
  }, [supabasePosts, isUnder10]);

  const reels = React.useMemo(() => {
    if (activeCategory === 'all') return allReels;
    return allReels.filter((r: any) => r.category === activeCategory);
  }, [allReels, activeCategory]);

  // Track active reel via IntersectionObserver
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const items = container.querySelectorAll('[data-reel-item]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.reelIndex);
            setActiveIndex(idx);
            window.dispatchEvent(new CustomEvent('stark-b-entertainment-engaged'));
          }
        });
      },
      { root: container, threshold: 0.7 }
    );
    items.forEach(item => observer.observe(item));
    return () => observer.disconnect();
  }, [reels]);

  const toggleLike = (id: string) => {
    setLikedReels(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFollow = (userName: string) => {
    setFollowedUsers(prev => ({ ...prev, [userName]: true }));
    if (user && firestore && profile) {
      updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
        followersCount: (profile.followersCount || 0) + 1,
      });
    }
    toast({ title: 'Lineage Linked', description: `Following @${userName}` });
  };

  const handleSave = (reel: any) => {
    if (!user || !firestore) return;
    addDoc(collection(firestore, 'users', user.uid, 'videos'), {
      userId: user.uid, title: reel.description || 'STARK-B Asset',
      videoUrl: reel.url || reel.imageUrl, duration: '0:30',
      source: 'save', createdAt: serverTimestamp(),
    }).then(() => toast({ title: 'Saved to Video Bank' }));
  };

  return (
    <div className="flex flex-col h-screen w-screen fixed inset-0 overflow-hidden">
      {/* Category bar */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 py-3 bg-black/60 backdrop-blur-xl border-b border-white/5 shrink-0 z-10 absolute top-0 left-0 right-0">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setActiveIndex(0); }}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-[9px] uppercase tracking-widest whitespace-nowrap transition-all border shrink-0",
              activeCategory === cat.id ? "bg-primary text-white border-primary shadow-lg" : "bg-white/10 text-white/60 border-white/10"
            )}>
            <cat.icon className="h-3 w-3" />{cat.label}
          </button>
        ))}
      </div>

      {/* Full-screen snap scroll */}
      <div ref={containerRef} className="flex-1 overflow-y-scroll snap-y snap-mandatory no-scrollbar">
        {reels.length === 0 && (
          <div className="h-screen flex items-center justify-center opacity-30 flex-col gap-4">
            <Globe className="h-12 w-12" />
            <p className="font-black uppercase tracking-widest text-sm">No reels yet</p>
          </div>
        )}
        {reels.map((reel: any, i: number) => (
          <div key={reel.id} data-reel-item data-reel-index={i}
            className="h-screen w-full snap-center relative overflow-hidden bg-black flex-shrink-0">
            <ReelItem
              reel={reel} index={i} activeIndex={activeIndex} ageGroup={ageGroup}
              onSave={handleSave}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
