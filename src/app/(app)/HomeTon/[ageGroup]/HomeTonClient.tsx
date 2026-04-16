'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '../../../../firebase';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Home,
  Search,
  Clapperboard,
  Heart,
  Camera,
  PlayCircle,
  Loader2,
  Rocket,
  BookOpen
} from 'lucide-react';
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

const InternalPlayer = ({ url }: { url: string }) => {
    const embedUrl = getEmbedUrl(url);
    return <iframe src={embedUrl} className="w-full h-full border-none" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
};

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

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const storyImages = React.useMemo(() => getRecommendedContent(profile, 'story'), [profile]);
  const staticFeedPosts = React.useMemo(() => getRecommendedContent(profile, 'video'), [profile]);

  // Realtime Firestore feed
  const [realtimePosts, setRealtimePosts] = React.useState<Post[]>([]);
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
      setRealtimePosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
    }, () => {});
    return () => unsub();
  }, [firestore, ageGroup]);

  const feedPosts = React.useMemo(() => {
    if (realtimePosts.length > 0) return realtimePosts.map(p => ({
      id: p.id, title: p.title || p.caption, caption: p.caption,
      mediaUrl: p.mediaUrl, url: p.url, userName: p.userName,
      userAvatar: p.userAvatar, category: p.category,
    }));
    return staticFeedPosts;
  }, [realtimePosts, staticFeedPosts]);

  const handleTriggerCycle = () => {
    window.dispatchEvent(new CustomEvent('stark-b-entertainment-engaged'));
  };

  const handleMissionTrigger = () => {
    window.dispatchEvent(new CustomEvent('stark-b-mission-complete'));
  };

  if (!mounted) return null;

  if (isUnder10) {
    const kidsSubjects = [
        { id: 'phonics', name: 'PHONICS FUN!', category: 'LANGUAGE', color: 'from-purple-500 to-indigo-600', icon: 'A', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b', url: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ' },
        { id: 'numbers', name: 'NUMBER SAFARI', category: 'MATH', color: 'from-blue-500 to-cyan-600', icon: '1', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904', url: 'https://www.youtube.com/watch?v=DR-cfDsHCGA' },
        { id: 'animals', name: 'ANIMAL EXPLORER', category: 'SCIENCE', color: 'from-green-500 to-emerald-600', icon: '🐾', image: 'https://images.unsplash.com/photo-1474511320721-9a5ee39958a9', url: 'https://www.youtube.com/watch?v=1ZYbU82GVz4' },
        { id: 'kindness', name: 'KINDNESS CLUB', category: 'SOCIAL', color: 'from-pink-500 to-rose-600', icon: '🫂', image: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a', url: 'https://www.youtube.com/watch?v=akTRWJZMks0' },
    ];

    return (
      <div className="min-h-screen bg-[#0a052a] text-white relative overflow-x-hidden animate-in fade-in duration-1000">
        <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-blue-900/40" />
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-fuchsia-500/20 rounded-full blur-[100px] animate-pulse" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 pb-40 space-y-10 pt-6">
            <header className="hidden md:flex items-center justify-between gap-4 bg-black/40 backdrop-blur-2xl p-3 rounded-full border-2 border-white/10 shadow-2xl">
                <div className="flex items-center gap-4 ml-2">
                    <div className="h-10 w-10 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Rocket className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-center gap-4 border-l border-white/10 pl-4">
                        <SocialStatsPopover type="disciples" count={profile?.disciplesCount || 0} label="Disciples" colorClass="text-cyan-400" />
                        <SocialStatsPopover type="followers" count={profile?.followersCount || 0} label="Followers" colorClass="text-pink-400" />
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

            <section className="flex gap-8 py-4 overflow-x-auto no-scrollbar scroll-smooth">
                <div className="flex flex-col items-center gap-3 shrink-0 group cursor-pointer" onClick={() => router.push('/create-post/?type=story')}>
                    <div className="relative p-1.5 rounded-full bg-gradient-to-tr from-orange-400 to-yellow-500 shadow-xl group-hover:scale-110 transition-transform">
                        <div className="h-20 w-20 md:h-24 md:w-24 rounded-full border-4 border-[#0a052a] overflow-hidden bg-muted">
                            <Avatar className="h-full w-full">
                                <AvatarImage src={profile?.profilePicture || user?.photoURL || ''} className="object-cover" />
                                <AvatarFallback className="text-3xl">U</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                            <Camera className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <span className="bg-orange-500 px-4 py-1 rounded-full text-[9px] font-black uppercase text-white shadow-lg">MY NODE</span>
                </div>

                {storyImages.map((story, i) => (
                    <Dialog key={story.id}>
                        <DialogTrigger asChild>
                            <div className="flex flex-col items-center gap-3 shrink-0 group cursor-pointer" onClick={handleTriggerCycle}>
                                <div className={cn(
                                    "relative p-1.5 rounded-full shadow-xl group-hover:scale-110 transition-transform",
                                    i % 2 === 0 ? "bg-gradient-to-tr from-blue-400 to-cyan-500" : "bg-gradient-to-tr from-purple-400 to-pink-500"
                                )}>
                                    <div className="h-20 w-20 md:h-24 md:w-24 rounded-full border-4 border-[#0a052a] overflow-hidden">
                                        <Avatar className="h-full w-full">
                                            <AvatarImage src={story.imageUrl} className="object-cover" />
                                            <AvatarFallback className="text-3xl">S</AvatarFallback>
                                        </Avatar>
                                    </div>
                                </div>
                                <span className={cn(
                                    "px-4 py-1 rounded-full text-[9px] font-black uppercase text-white shadow-lg truncate max-w-[80px]",
                                    i % 2 === 0 ? "bg-blue-500" : "bg-purple-500"
                                )}>@{story.userName || `NODE_${i}`}</span>
                            </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-[96vw] h-[96vh] p-0 overflow-hidden border-4 border-cyan-400 bg-black rounded-[3rem] shadow-2xl flex flex-col items-center justify-center">
                            <DialogTitle className="sr-only">Trending Video Player</DialogTitle>
                            <div className="w-full h-full relative aspect-[9/16]">
                                <InternalPlayer url={story.url || story.imageUrl} />
                            </div>
                        </DialogContent>
                    </Dialog>
                ))}
            </section>

            <section className="space-y-8">
                <div className="flex items-center justify-center gap-4">
                    <BookOpen className="h-6 w-6 text-cyan-400 animate-pulse" />
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white drop-shadow-lg text-center">SUBJECT NODES</h2>
                    <BookOpen className="h-6 w-6 text-cyan-400 animate-pulse" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {kidsSubjects.map((sub) => (
                        <div key={sub.id} className="relative group">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Card className={cn(
                                        "relative h-40 md:h-48 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden cursor-pointer group shadow-2xl transition-all duration-500 hover:scale-[1.02] border-none bg-slate-900/80 backdrop-blur-xl border-4 border-white/5"
                                    )} onClick={handleMissionTrigger}>
                                        <div className={cn("absolute top-0 left-0 right-0 h-8 flex items-center justify-between px-4 z-10 bg-gradient-to-r", sub.color)}>
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{sub.category}</span>
                                            <span className="text-[10px] font-black text-white">{sub.icon}</span>
                                        </div>
                                        <div className="pt-8 h-full w-full relative">
                                            <Image src={sub.image} alt={sub.name} fill className="object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                                                <span className="text-xs md:text-sm font-black uppercase tracking-tighter text-white drop-shadow-lg leading-tight">{sub.name}</span>
                                                <div className="mt-2 bg-white/20 p-1.5 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <PlayCircle className="h-6 w-6 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </DialogTrigger>
                                <DialogContent className="max-w-[96vw] h-[96vh] p-0 overflow-hidden border-4 border-white/20 bg-black rounded-[3rem] shadow-2xl flex flex-col items-center justify-center">
                                    <DialogTitle className="sr-only">{sub.name} Lesson Node</DialogTitle>
                                    <div className="w-full h-full">
                                        <InternalPlayer url={sub.url} />
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    ))}
                </div>
            </section>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl pb-32 space-y-8 px-4 relative animate-in fade-in duration-700">
      <header className="hidden md:flex items-center justify-between py-6 sticky top-0 bg-background/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-8">
            <Logo className="scale-90" />
            <div className="flex items-center gap-6 border-l border-primary/10 pl-8">
                <SocialStatsPopover type="disciples" count={profile?.disciplesCount || 0} label="Disciples" colorClass="text-sm font-black text-primary" />
                <SocialStatsPopover type="followers" count={profile?.followersCount || 0} label="Followers" colorClass="text-sm font-black text-accent" />
                <SocialStatsPopover type="following" count={profile?.followingCount || 0} label="Following" colorClass="text-sm font-black text-foreground" />
            </div>
        </div>
        <div className="flex items-center gap-5">
            <Link href="/settings/">
                <Avatar className="h-9 w-9 ring-2 ring-primary/20 border-2 border-background">
                    <AvatarImage src={profile?.profilePicture || user?.photoURL || ''} />
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
            </Link>
        </div>
      </header>

      <section className="flex gap-5 overflow-x-auto no-scrollbar py-2 pb-6">
        <div className="flex flex-col items-center gap-3 flex-shrink-0 group cursor-pointer" onClick={() => router.push('/create-post/?type=story')}>
            <div className="p-1 rounded-full bg-muted transition-all duration-500 group-hover:scale-105">
                <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-full overflow-hidden border-2 border-background">
                    <Avatar className="h-full w-full">
                        <AvatarImage src={profile?.profilePicture || user?.photoURL || ''} className="object-cover" />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                </div>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Your Story</span>
        </div>

        {storyImages.map((story, idx) => (
            <Dialog key={story.id}>
                <DialogTrigger asChild>
                    <div className="flex flex-col items-center gap-3 flex-shrink-0 group cursor-pointer" onClick={handleTriggerCycle}>
                        <div className="p-1 rounded-full bg-gradient-to-tr from-primary to-accent shadow-lg transition-all duration-500 group-hover:scale-105">
                            <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-full overflow-hidden border-2 border-background">
                                <Avatar className="h-full w-full">
                                    <AvatarImage src={story.imageUrl} className="object-cover" />
                                    <AvatarFallback>S</AvatarFallback>
                                </Avatar>
                            </div>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-60 truncate max-w-[64px]">@{story.userName || `NODE_${idx}`}</span>
                    </div>
                </DialogTrigger>
                <DialogContent className="max-w-[96vw] h-[96vh] p-0 overflow-hidden border-2 border-primary/20 bg-black rounded-[3rem] shadow-2xl flex flex-col items-center justify-center">
                    <DialogTitle className="sr-only">Trending Node Player</DialogTitle>
                    <div className="w-full h-full relative aspect-[9/16]">
                        <InternalPlayer url={story.url || story.imageUrl} />
                    </div>
                </DialogContent>
            </Dialog>
        ))}
      </section>

      <main className="space-y-12 pb-12">
        {feedPosts.length > 0 ? feedPosts.map((post) => (
            <div key={post.id} className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-primary/20"><AvatarImage src={post.userAvatar} /></Avatar>
                        <span className="text-xs font-black uppercase tracking-widest">{post.userName}</span>
                    </div>
                </div>
                <ContentCard id={post.id} title={post.title || 'Broadcast Node'} creator={post.userName} image={{ imageUrl: post.mediaUrl || 'https://picsum.photos/seed/post/800/800', description: post.caption, id: post.id, imageHint: 'media content', url: post.url || post.mediaUrl, category: post.category } as any} />
            </div>
        )) : (
            <div className="py-20 text-center border-2 border-dashed rounded-[3rem] opacity-30 flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="italic font-medium">Synchronizing localized feeds...</p>
            </div>
        )}
      </main>
    </div>
  );
}
