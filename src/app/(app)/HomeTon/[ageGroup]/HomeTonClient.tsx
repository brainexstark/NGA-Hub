'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '../../../../firebase';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Home, Search, Clapperboard, Heart, Camera, PlayCircle,
  Loader2, Rocket, BookOpen, MessageCircle, Repeat2, Send,
  Bookmark, Volume2, VolumeX
} from 'lucide-react';
import { useRealtimeLikes } from '../../../../hooks/use-realtime';
import { supabase as supabaseClient } from '../../../../lib/supabase';
import { ContentCard } from '../../../../components/content-card';
import { doc, collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import type { Post, UserProfile } from '../../../../lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "../../../../components/ui/dialog";
import { useToast } from '../../../../hooks/use-toast';
import { cn, getEmbedUrl } from '../../../../lib/utils';
import { getRecommendedContent } from '../../../../lib/recommendation-engine';
import { Logo } from '../../../../components/logo';
import { SocialStatsPopover } from '../../../../components/social-stats-popover';
import { fetchAds, injectAds, isAd, type Ad } from '../../../../lib/ads';
import { useRealtimeFeed } from '../../../../hooks/use-realtime-feed';
import { useRealtimeFollowers, useAppUsers } from '../../../../hooks/use-realtime';
import { getEmbedUrl as _getEmbedUrl } from '../../../../lib/utils';
import { filterForUnder10 } from '../../../../lib/inappropriate-words';
import { supabase } from '../../../../lib/supabase';

const InternalPlayer = ({ url }: { url: string }) => {
    const embedUrl = getEmbedUrl(url);
    return <iframe src={embedUrl} className="w-full h-full border-none" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
};

// ─── Post Action Buttons (Like, Comment, Repost, Send, Save, Volume) ─────────
function PostActions({ postId, userId, postUrl, postTitle, firestore, userUid }: {
  postId: string; userId: string; postUrl: string; postTitle: string;
  firestore: any; userUid?: string;
}) {
  const { likesCount, liked, toggleLike } = useRealtimeLikes(postId, userId);
  const [saved, setSaved] = React.useState(false);
  const [reposted, setReposted] = React.useState(false);
  const [muted, setMuted] = React.useState(true);
  const { toast } = useToast();

  // Toggle mute on all videos in this post
  const handleMute = () => {
    setMuted(p => !p);
    // Find video elements near this post and toggle mute
    const videos = document.querySelectorAll(`[data-post-id="${postId}"] video`);
    videos.forEach((v: any) => { v.muted = !muted; });
  };

  const handleSave = async () => {
    setSaved(p => !p);
    if (!saved && firestore && userUid) {
      const { addDoc, collection: col, serverTimestamp } = await import('firebase/firestore');
      addDoc(col(firestore, 'users', userUid, 'saved_posts'), {
        postId, savedAt: serverTimestamp(),
      }).catch(() => {});
    }
    toast({ title: saved ? 'Removed from saved' : 'Saved!' });
  };

  const handleRepost = () => {
    setReposted(p => !p);
    toast({ title: reposted ? 'Repost removed' : 'Reposted to your feed!' });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: postTitle, url: postUrl || window.location.href }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(postUrl || window.location.href);
      toast({ title: 'Link copied!' });
    }
  };

  return (
    <div className="px-4 py-2 flex items-center justify-between">
      {/* Left: Like, Comment, Repost, Send */}
      <div className="flex items-center gap-5">
        <button onClick={toggleLike} className="flex items-center gap-1.5 active:scale-125 transition-transform">
          <Heart className={cn("h-6 w-6 transition-all duration-200", liked ? "fill-red-500 text-red-500" : "text-white/80")} />
          {likesCount > 0 && <span className="text-xs font-black text-white/60">{likesCount}</span>}
        </button>
        <Link href={`/comments/${postId}`} className="flex items-center gap-1.5 active:scale-110 transition-transform">
          <MessageCircle className="h-6 w-6 text-white/80" />
        </Link>
        <button onClick={handleRepost} className="active:scale-110 transition-transform">
          <Repeat2 className={cn("h-6 w-6 transition-all duration-200", reposted ? "text-green-400" : "text-white/80")} />
        </button>
        <button onClick={handleShare} className="active:scale-110 transition-transform">
          <Send className="h-6 w-6 text-white/80" />
        </button>
      </div>
      {/* Right: Volume + Save */}
      <div className="flex items-center gap-4">
        <button onClick={handleMute} className="active:scale-110 transition-transform">
          {muted
            ? <VolumeX className="h-6 w-6 text-white/80" />
            : <Volume2 className="h-6 w-6 text-white" />
          }
        </button>
        <button onClick={handleSave} className="active:scale-110 transition-transform">
          <Bookmark className={cn("h-6 w-6 transition-all duration-200", saved ? "fill-white text-white" : "text-white/80")} />
        </button>
      </div>
    </div>
  );
}

export default function HomeTonClient({ ageGroup }: { ageGroup: string }) {
  const isUnder10 = ageGroup === 'under-10';
  
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [mounted, setMounted] = React.useState(false);

  const profileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: profile } = useDoc<UserProfile>(profileRef);

  // Realtime follower/following counts from Supabase
  const { followersCount, followingCount } = useRealtimeFollowers(user?.uid || '');

  // All registered users — newest first for the "New Members" row
  const { users: allAppUsers } = useAppUsers();
  const newMembers = allAppUsers.filter(u => u.id !== user?.uid).slice(0, 20);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Real stories from Supabase — only real registered users
  const [realtimeStories, setRealtimeStories] = React.useState<any[]>([]);
  React.useEffect(() => {
    supabase.from('stories')
      .select('*')
      .eq('age_group', ageGroup)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }: any) => { if (data) setRealtimeStories(data); });

    const channel = supabase.channel(`stories-${ageGroup}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stories', filter: `age_group=eq.${ageGroup}` },
        (payload: any) => setRealtimeStories((prev: any[]) => [payload.new, ...prev]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ageGroup]);

  const staticFeedPosts: any[] = []; // No mock fallback — only real user content

  // Supabase realtime feed
  const { posts: supabasePosts } = useRealtimeFeed(ageGroup);

  // Firestore realtime feed (fallback)
  const [firestorePosts, setFirestorePosts] = React.useState<Post[]>([]);
  React.useEffect(() => {
    if (!firestore) return;
    const q = query(
      collection(firestore, 'posts'),
      where('ageGroup', '==', ageGroup),
      where('isFlagged', '!=', true),
      orderBy('isFlagged'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(q, snap => {
      setFirestorePosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
    }, () => {});
    return () => unsub();
  }, [firestore, ageGroup]);

  // Ads
  const [ads, setAds] = React.useState<Ad[]>([]);
  React.useEffect(() => {
    fetchAds(ageGroup).then(setAds);
  }, [ageGroup]);

  // Always show content — newest user posts first, then static trending
  const rawPosts = React.useMemo(() => {
    const userPosts = supabasePosts.length > 0
      ? supabasePosts
          .slice()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map(p => ({ id: p.id, title: p.title || p.caption, caption: p.caption, mediaUrl: p.mediaUrl, url: p.url, userName: p.userName, userAvatar: p.userAvatar, category: p.category }))
      : firestorePosts.length > 0
      ? firestorePosts.map(p => ({ id: p.id, title: p.title || p.caption, caption: p.caption, mediaUrl: p.mediaUrl, url: p.url, userName: p.userName, userAvatar: p.userAvatar as string | undefined, category: p.category }))
      : [];
    const trending = staticFeedPosts.map(p => ({ ...p, _static: true }));
    return userPosts.length >= 3 ? userPosts : [...userPosts, ...trending];
  }, [supabasePosts, firestorePosts, staticFeedPosts]);

  // Inject ads every 5 posts
  const feedPosts = React.useMemo(() => injectAds(rawPosts, ads, 5), [rawPosts, ads]);

  const handleTriggerCycle = () => {
    window.dispatchEvent(new CustomEvent('stark-b-entertainment-engaged'));
  };

  const handleMissionTrigger = () => {
    window.dispatchEvent(new CustomEvent('stark-b-mission-complete'));
  };

  // ALL hooks must be before any return — Rules of Hooks
  const [profilesVisible, setProfilesVisible] = React.useState(true);
  const lastScrollY = React.useRef(0);
  React.useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current + 10) setProfilesVisible(false);
      else if (currentY < lastScrollY.current - 10) setProfilesVisible(true);
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Non-hook derived values — safe after hooks
  const kidsSubjects = [
    { id: 'phonics', name: 'PHONICS FUN!', category: 'LANGUAGE', color: 'from-purple-500 to-indigo-600', icon: 'A', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b', url: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ' },
    { id: 'numbers', name: 'NUMBER SAFARI', category: 'MATH', color: 'from-blue-500 to-cyan-600', icon: '1', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904', url: 'https://www.youtube.com/watch?v=DR-cfDsHCGA' },
    { id: 'animals', name: 'ANIMAL EXPLORER', category: 'SCIENCE', color: 'from-green-500 to-emerald-600', icon: '🐾', image: 'https://images.unsplash.com/photo-1474511320721-9a5ee39958a9', url: 'https://www.youtube.com/watch?v=1ZYbU82GVz4' },
    { id: 'kindness', name: 'KINDNESS CLUB', category: 'SOCIAL', color: 'from-pink-500 to-rose-600', icon: '🫂', image: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a', url: 'https://www.youtube.com/watch?v=akTRWJZMks0' },
    { id: 'space', name: 'SPACE ADVENTURE', category: 'SCIENCE', color: 'from-indigo-500 to-blue-700', icon: '🚀', image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa', url: 'https://www.youtube.com/watch?v=D0Ajq682yrA' },
    { id: 'art', name: 'ART STUDIO', category: 'ARTS', color: 'from-orange-400 to-pink-500', icon: '🎨', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f', url: 'https://www.youtube.com/watch?v=URUJD5NEXC8' },
  ];

  const kidsVideos = supabasePosts
    .filter(p => !filterForUnder10(`${p.caption} ${p.title || ''}`))
    .slice(0, 6);

  if (!mounted) return null;

  if (isUnder10) {
    return (
      <div className="min-h-screen bg-[#0a052a] text-white relative overflow-x-hidden animate-in fade-in duration-1000">
        <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-blue-900/40" />
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-fuchsia-500/20 rounded-full blur-[100px] animate-pulse" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 pb-40 space-y-10 pt-6">
            {/* Header */}
            <header className="hidden md:flex items-center justify-between gap-4 bg-black/40 backdrop-blur-2xl p-3 rounded-full border-2 border-white/10 shadow-2xl">
                <div className="flex items-center gap-4 ml-2">
                    <div className="h-10 w-10 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Rocket className="h-6 w-6 text-white" />
                    </div>
                </div>
                <nav className="flex items-center gap-3">
                    {[
                        { icon: Home, label: 'HOME', color: 'text-cyan-400', bg: 'bg-cyan-400/10', href: `/HomeTon/${ageGroup}/` },
                        { icon: Search, label: 'SEARCH', color: 'text-purple-400', bg: 'bg-purple-400/10', href: '/search/' },
                        { icon: Clapperboard, label: 'REELS', color: 'text-pink-400', bg: 'bg-pink-400/10', href: `/reels/${ageGroup}/` },
                        { icon: Heart, label: 'FAVORITES', color: 'text-orange-400', bg: 'bg-orange-400/10', href: '/favorites/' }
                    ].map((item) => (
                        <Link key={item.label} href={item.href}>
                            <button className={cn("px-4 py-2 rounded-full flex items-center gap-2 border border-white/5 transition-all active:scale-95 shadow-lg", item.bg)}>
                                <item.icon className={cn("h-4 w-4", item.color)} />
                                <span className={cn("text-[10px] font-black tracking-widest", item.color)}>{item.label}</span>
                            </button>
                        </Link>
                    ))}
                </nav>
                <Link href="/settings/" className="mr-2">
                    <Avatar className="h-10 w-10 border-2 border-cyan-400 ring-2 ring-cyan-400/20">
                        <AvatarImage src={profile?.profilePicture || user?.photoURL || ''} />
                        <AvatarFallback className="bg-cyan-900 text-white font-black">U</AvatarFallback>
                    </Avatar>
                </Link>
            </header>

            {/* Welcome banner */}
            <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-[2rem] p-5 border border-white/10 flex items-center gap-4">
                <div className="text-4xl">👋</div>
                <div>
                    <p className="font-black text-lg uppercase tracking-tight text-white">
                        Hey {profile?.displayName?.split(' ')[0] || 'Explorer'}!
                    </p>
                    <p className="text-[11px] text-white/50 font-bold uppercase tracking-widest">Ready to learn something amazing today?</p>
                </div>
            </div>

            {/* Stories row */}
            <section className="flex gap-8 py-4 overflow-x-auto no-scrollbar scroll-smooth">
                <div className="flex flex-col items-center gap-3 shrink-0 group cursor-pointer" onClick={() => router.push('/create-post/?type=story')}>
                    <div className="relative p-1.5 rounded-full bg-gradient-to-tr from-orange-400 to-yellow-500 shadow-xl group-hover:scale-110 transition-transform">
                        <div className="h-20 w-20 rounded-full border-4 border-[#0a052a] overflow-hidden bg-muted">
                            <Avatar className="h-full w-full">
                                <AvatarImage src={profile?.profilePicture || user?.photoURL || ''} className="object-cover" />
                                <AvatarFallback className="text-3xl">U</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                            <Camera className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <span className="bg-orange-500 px-4 py-1 rounded-full text-[9px] font-black uppercase text-white shadow-lg">MY STORY</span>
                </div>
                {realtimeStories.filter(s => !filterForUnder10(`${s.caption || ''}`)).map((story, i) => (
                    <Dialog key={story.id}>
                        <DialogTrigger asChild>
                            <div className="flex flex-col items-center gap-3 shrink-0 group cursor-pointer" onClick={handleTriggerCycle}>
                                <div className={cn("relative p-1.5 rounded-full shadow-xl group-hover:scale-110 transition-transform", i % 2 === 0 ? "bg-gradient-to-tr from-blue-400 to-cyan-500" : "bg-gradient-to-tr from-purple-400 to-pink-500")}>
                                    <div className="h-20 w-20 rounded-full border-4 border-[#0a052a] overflow-hidden">
                                        <Avatar className="h-full w-full">
                                          <AvatarImage src={story.user_avatar || story.media_url} className="object-cover" />
                                          <AvatarFallback className="bg-cyan-900 text-white font-black">
                                            {story.user_name?.[0]?.toUpperCase() || 'U'}
                                          </AvatarFallback>
                                        </Avatar>
                                    </div>
                                </div>
                                <span className={cn("px-4 py-1 rounded-full text-[9px] font-black uppercase text-white shadow-lg truncate max-w-[80px]", i % 2 === 0 ? "bg-blue-500" : "bg-purple-500")}>
                                  @{story.user_name?.split(' ')[0] || `user_${i}`}
                                </span>
                            </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-[96vw] h-[96vh] p-0 overflow-hidden border-4 border-cyan-400 bg-black rounded-[3rem] shadow-2xl flex items-center justify-center">
                            <DialogTitle className="sr-only">Story</DialogTitle>
                            <div className="w-full h-full relative aspect-[9/16]">
                                <InternalPlayer url={story.media_url} />
                            </div>
                        </DialogContent>
                    </Dialog>
                ))}
            </section>

            {/* Subject nodes */}
            <section className="space-y-6">
                <div className="flex items-center justify-center gap-4">
                    <BookOpen className="h-6 w-6 text-cyan-400 animate-pulse" />
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white text-center">LEARN & EXPLORE</h2>
                    <BookOpen className="h-6 w-6 text-cyan-400 animate-pulse" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {kidsSubjects.map((sub) => (
                        <Dialog key={sub.id}>
                            <DialogTrigger asChild>
                                <Card className="relative h-40 rounded-[2rem] overflow-hidden cursor-pointer shadow-2xl transition-all duration-300 hover:scale-[1.03] border-none bg-slate-900/80" onClick={handleMissionTrigger}>
                                    <div className={cn("absolute top-0 left-0 right-0 h-8 flex items-center justify-between px-4 z-10 bg-gradient-to-r", sub.color)}>
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{sub.category}</span>
                                        <span className="text-sm">{sub.icon}</span>
                                    </div>
                                    <div className="pt-8 h-full w-full relative">
                                        <Image src={sub.image} alt={sub.name} fill className="object-cover opacity-40" />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
                                            <span className="text-xs font-black uppercase tracking-tighter text-white drop-shadow-lg leading-tight">{sub.name}</span>
                                            <div className="mt-2 bg-white/20 p-1.5 rounded-full backdrop-blur-md">
                                                <PlayCircle className="h-5 w-5 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </DialogTrigger>
                            <DialogContent className="max-w-[96vw] h-[96vh] p-0 overflow-hidden border-4 border-white/20 bg-black rounded-[3rem] shadow-2xl flex items-center justify-center">
                                <DialogTitle className="sr-only">{sub.name}</DialogTitle>
                                <div className="w-full h-full"><InternalPlayer url={sub.url} /></div>
                            </DialogContent>
                        </Dialog>
                    ))}
                </div>
            </section>

            {/* Famous kids videos from live feed */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🌟</span>
                    <h2 className="text-xl font-black uppercase tracking-tighter text-white">TRENDING FOR KIDS</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {kidsVideos.slice(0, 6).map((v: any) => (
                        <Dialog key={v.id}>
                            <DialogTrigger asChild>
                                <div className="relative overflow-hidden cursor-pointer group aspect-video" onClick={handleTriggerCycle}>
                                    <Image src={v.mediaUrl || v.imageUrl || ''} alt={v.title || v.caption || 'video'} fill className="object-cover opacity-70 group-hover:opacity-90 transition-opacity rounded-[1.5rem]" unoptimized />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent rounded-[1.5rem]" />
                                    <div className="absolute bottom-3 left-4 right-4">
                                        <p className="font-black text-sm text-white uppercase tracking-tight line-clamp-1">{v.title || v.caption}</p>
                                        <p className="text-[10px] text-white/50 font-bold uppercase">{v.userName}</p>
                                    </div>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="max-w-[96vw] h-[96vh] p-0 overflow-hidden border-4 border-cyan-400 bg-black rounded-[3rem] shadow-2xl flex items-center justify-center">
                                <DialogTitle className="sr-only">{v.title || 'Video'}</DialogTitle>
                                <div className="w-full h-full"><InternalPlayer url={v.url || v.mediaUrl} /></div>
                            </DialogContent>
                        </Dialog>
                    ))}
                </div>
            </section>
        </div>
      </div>
    );
  }

  // non-under-10 return below — Instagram-style layout

  return (
    <div className="mx-auto max-w-2xl pb-32 relative animate-in fade-in duration-700">

      {/* ── TOP HEADER — App icon + NGA Hub + stats ── */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* App icon */}
          <div className="h-9 w-9 rounded-xl overflow-hidden border border-white/10 shrink-0">
            <img src="/icons/icon-192.png" alt="NGA Hub" className="w-full h-full object-cover" />
          </div>
          <span className="font-headline text-xl font-black tracking-tight dynamic-text-mesh">NGA Hub</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
            <SocialStatsPopover type="disciples" count={profile?.disciplesCount || 0} label="Disciples" colorClass="text-primary" />
            <SocialStatsPopover type="followers" count={followersCount} label="Followers" colorClass="text-accent" />
            <SocialStatsPopover type="following" count={followingCount} label="Following" colorClass="text-foreground/60" />
          </div>
          <Link href="/settings/">
            <Avatar className="h-8 w-8 ring-2 ring-primary/20 border-2 border-background">
              <AvatarImage src={profile?.profilePicture || user?.photoURL || ''} />
              <AvatarFallback className="bg-primary/20 text-primary font-black text-xs">
                {profile?.displayName?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </header>

      {/* ── STORIES / PROFILES ROW — hides on scroll down ── */}
      <div className={`transition-all duration-300 overflow-hidden border-b border-white/5 ${profilesVisible ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 py-3">
          {/* Your Story */}
          <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group" onClick={() => router.push('/create-post/?type=story')}>
            <div className="relative">
              <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-background ring-2 ring-white/20 group-hover:ring-primary/60 transition-all">
                <Avatar className="h-full w-full">
                  <AvatarImage src={profile?.profilePicture || user?.photoURL || ''} className="object-cover" />
                  <AvatarFallback className="bg-primary/20 text-primary font-black">
                    {profile?.displayName?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 bg-primary rounded-full border-2 border-background flex items-center justify-center">
                <span className="text-white text-[10px] font-black">+</span>
              </div>
            </div>
            <span className="text-[9px] font-medium text-white/50 truncate max-w-[60px] text-center">Your story</span>
          </div>

          {/* Other users */}
          {newMembers.map((member, idx) => (
            <div key={member.id} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
              <div className={`h-16 w-16 rounded-full overflow-hidden border-2 border-background ring-2 transition-all group-hover:scale-105 ${member.is_online ? 'ring-green-400' : 'ring-primary/60'}`}>
                <Avatar className="h-full w-full">
                  <AvatarImage src={member.avatar || ''} className="object-cover" />
                  <AvatarFallback className="bg-primary/20 text-primary font-black">
                    {member.display_name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="text-[9px] font-medium text-white/50 truncate max-w-[60px] text-center">
                {member.display_name?.split(' ')[0] || `user_${idx}`}
              </span>
            </div>
          ))}

          {/* Stories */}
          {realtimeStories.map((story, idx) => (
            <Dialog key={story.id}>
              <DialogTrigger asChild>
                <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group" onClick={handleTriggerCycle}>
                  <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-background ring-2 ring-primary group-hover:scale-105 transition-all">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={story.user_avatar || story.media_url} className="object-cover" />
                      <AvatarFallback className="bg-primary/20 text-primary font-black">
                        {story.user_name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="text-[9px] font-medium text-white/50 truncate max-w-[60px] text-center">
                    {story.user_name?.split(' ')[0] || `user_${idx}`}
                  </span>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-[96vw] h-[96vh] p-0 overflow-hidden border-2 border-primary/20 bg-black rounded-[3rem] shadow-2xl">
                <DialogTitle className="sr-only">Story</DialogTitle>
                <div className="w-full h-full"><InternalPlayer url={story.media_url} /></div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>

      {/* ── FEED POSTS — Instagram style ── */}
      <main className="divide-y divide-white/5">
        {feedPosts.length === 0 && (
          <div className="py-20 text-center opacity-30 space-y-3">
            <div className="h-12 w-12 rounded-full border-2 border-white/20 mx-auto flex items-center justify-center">
              <span className="text-xl">📸</span>
            </div>
            <p className="text-sm font-black uppercase tracking-widest">No posts yet</p>
            <p className="text-xs">Be the first to post something!</p>
          </div>
        )}
        {feedPosts.map((post, index) => {
          const postElement = (() => {
            if (isAd(post)) {
              return (
                <div key={post.id} className="space-y-0">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-white/10">
                        <AvatarImage src={post.media_url} />
                        <AvatarFallback className="bg-yellow-400/20 text-yellow-400 font-black text-xs">Ad</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-black text-sm">{post.partner_name}</p>
                        <p className="text-[9px] text-yellow-400 font-black uppercase tracking-widest">Sponsored</p>
                      </div>
                    </div>
                    <span className="text-white/20">···</span>
                  </div>
                  <div className="aspect-square w-full bg-black overflow-hidden">
                    <ContentCard id={post.id} title={post.title} creator={post.partner_name}
                      image={{ imageUrl: post.media_url, description: post.caption, id: post.id, url: post.video_url || post.media_url, category: post.category } as any} />
                  </div>
                </div>
              );
            }
            const p = post as any;
            return (
              <div key={p.id} data-post-id={p.id} className="space-y-0 border-b border-white/5">
                {/* Post header */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-white/10 ring-2 ring-primary/20">
                      <AvatarImage src={p.userAvatar || ''} className="object-cover" />
                      <AvatarFallback className="bg-primary/20 text-primary font-black text-xs">
                        {p.userName?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-black text-sm">@{p.userName?.replace(/\s/g,'_').toLowerCase()}</p>
                      {p.category && (
                        <div className="flex items-center gap-1">
                          <span className="text-[9px]">🎵</span>
                          <span className="text-[9px] text-white/40 font-medium">{p.category}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-white/20 text-lg cursor-pointer">···</span>
                </div>

                {/* Post media */}
                <div className="w-full bg-black overflow-hidden">
                  <ContentCard id={p.id} title={p.title || ''} creator={p.userName || ''}
                    image={{ imageUrl: p.mediaUrl || '', description: p.caption, id: p.id, url: p.url || p.mediaUrl, category: p.category, userAvatar: p.userAvatar } as any} />
                </div>

                {/* Action buttons — Instagram style */}
                <PostActions postId={p.id} userId={user?.uid || ''} postUrl={p.url || p.mediaUrl} postTitle={p.title || p.caption} firestore={firestore} userUid={user?.uid} />

                {/* Caption */}
                {p.caption && (
                  <div className="px-4 pb-3">
                    <span className="font-black text-xs mr-2">@{p.userName?.replace(/\s/g,'_').toLowerCase()}</span>
                    <span className="text-xs text-white/70">{p.caption}</span>
                  </div>
                )}
              </div>
            );
          })();

          // Insert "Suggested Reels" after every 10 posts
          const showSuggested = (index + 1) % 10 === 0 && supabasePosts.length > 0;

          return (
            <React.Fragment key={isAd(post) ? post.id : (post as any).id}>
              {postElement}
              {showSuggested && (
                <div className="px-4 py-4 bg-background/50 border-y border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-black text-sm uppercase tracking-tight">Suggested Reels</p>
                    <Link href={`/reels/${ageGroup}`} className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors">
                      See all →
                    </Link>
                  </div>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {supabasePosts.slice(0, 6).map(reel => (
                      <Link key={reel.id} href={`/reels/${ageGroup}`}
                        className="shrink-0 w-28 rounded-2xl overflow-hidden relative bg-black border border-white/10 active:scale-95 transition-all">
                        <div className="aspect-[9/16] relative">
                          {reel.mediaUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={reel.mediaUrl} alt={reel.title || ''} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-white/5 flex items-center justify-center">
                              <span className="text-2xl">🎬</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-[9px] font-black text-white truncate">@{reel.userName?.replace(/\s/g,'_').toLowerCase()}</p>
                          </div>
                          {/* Three dots */}
                          <button className="absolute top-1.5 right-1.5 text-white/60 text-xs">···</button>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </main>
    </div>
  );
}
