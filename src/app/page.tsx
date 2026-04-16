'use client';

import * as React from 'react';
import { Logo } from '../components/logo';
import { Button } from '../components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '../firebase';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '../lib/types';
import { supabase, type SupabasePost } from '../lib/supabase';
import { aiDatabase } from '../lib/ai-database';
import { PlayCircle, Heart, Loader2, Zap, Users, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '../components/ui/dialog';
import { getEmbedUrl, cn } from '../lib/utils';

const InternalPlayer = ({ url }: { url: string }) => {
  const embedUrl = getEmbedUrl(url);
  return (
    <iframe
      src={embedUrl}
      className="w-full h-full border-none"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
};

// Fallback posts from database when Supabase has no data yet
const FALLBACK_POSTS = [
  ...aiDatabase.superdatabasePosts['10-16'].slice(0, 4),
  ...aiDatabase.superdatabasePosts['16-plus'].slice(0, 4),
  ...aiDatabase.superdatabasePosts['under-10'].slice(0, 4),
].map(p => ({
  id: p.id,
  user_name: p.userName,
  user_avatar: `https://picsum.photos/seed/${p.id}/100/100`,
  title: p.title,
  caption: p.caption,
  media_url: p.mediaUrl,
  video_url: p.url,
  category: p.category,
  age_group: 'all',
  likes_count: Math.floor(Math.random() * 2000),
  comments_count: Math.floor(Math.random() * 200),
  is_flagged: false,
  created_at: new Date().toISOString(),
} as SupabasePost));

export default function Home() {
  const [mounted, setMounted] = React.useState(false);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [posts, setPosts] = React.useState<SupabasePost[]>([]);
  const [feedLoading, setFeedLoading] = React.useState(true);
  const [activePost, setActivePost] = React.useState<SupabasePost | null>(null);
  const [likedPosts, setLikedPosts] = React.useState<Record<string, boolean>>({});

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  React.useEffect(() => { setMounted(true); }, []);

  // Redirect logged-in users
  React.useEffect(() => {
    if (mounted && !isUserLoading && user && !profileLoading) {
      if (userProfile?.ageGroup) router.replace(`/HomeTon/${userProfile.ageGroup}`);
      else if (userProfile === null) router.replace('/select-age');
    }
  }, [user, isUserLoading, userProfile, profileLoading, router, mounted]);

  // Load live feed from Supabase
  React.useEffect(() => {
    const loadFeed = async () => {
      setFeedLoading(true);
      if (supabase) {
        const { data } = await supabase
          .from('posts')
          .select('*')
          .eq('is_flagged', false)
          .order('created_at', { ascending: false })
          .limit(30);
        if (data && data.length > 0) {
          setPosts(data);
          setFeedLoading(false);
          return;
        }
      }
      // Fallback to static database content
      setPosts(FALLBACK_POSTS);
      setFeedLoading(false);
    };

    loadFeed();

    // Realtime new posts
    if (!supabase) return;
    const channel = supabase
      .channel('landing-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        setPosts(prev => [payload.new as SupabasePost, ...prev.slice(0, 29)]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#0a051a] text-white overflow-x-hidden">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 flex w-full items-center justify-between px-4 py-3 bg-[#0a051a]/90 backdrop-blur-xl border-b border-white/5">
        <Logo />
        <div className="flex items-center gap-3">
          {!isUserLoading && !user ? (
            <>
              <Link href="/sign-in">
                <Button variant="outline" size="sm" className="font-black uppercase text-[10px] tracking-widest border-white/20 text-white hover:bg-white/10 rounded-full px-5">
                  Log In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="font-black uppercase text-[10px] tracking-widest rounded-full px-5 animate-bg-color-sync border-none text-white">
                  Sign Up
                </Button>
              </Link>
            </>
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-4 pt-10 pb-6 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            Live Feed Active
          </div>
          <h1 className="font-headline text-4xl sm:text-6xl font-black tracking-tighter uppercase dynamic-text-mesh">
            NGA Hub
          </h1>
          <p className="text-white/50 text-sm font-medium max-w-md mx-auto">
            The next-generation platform for learning, entertainment & creativity.
          </p>
          <div className="flex items-center justify-center gap-6 pt-2 text-[10px] font-black uppercase tracking-widest text-white/30">
            <span className="flex items-center gap-1.5"><Users className="h-3 w-3" /> Community</span>
            <span className="flex items-center gap-1.5"><BookOpen className="h-3 w-3" /> Learning</span>
            <span className="flex items-center gap-1.5"><Zap className="h-3 w-3" /> Entertainment</span>
          </div>
        </div>
      </section>

      {/* Live Feed */}
      <section className="px-4 pb-32 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-lg font-black uppercase tracking-widest text-primary">
            Live Community Feed
          </h2>
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-green-400">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            {posts.length} posts
          </div>
        </div>

        {feedLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={cn("rounded-[2rem] bg-white/5 animate-pulse", i === 0 ? "col-span-2 aspect-video" : "aspect-square")} />
            ))}
          </div>
        ) : (
          <div className="columns-2 gap-3 space-y-3">
            {posts.map((post, i) => (
              <div
                key={post.id}
                onClick={() => setActivePost(post)}
                className={cn(
                  "break-inside-avoid rounded-[2rem] overflow-hidden relative cursor-pointer group border border-white/5 shadow-xl",
                  i === 0 ? "col-span-2" : ""
                )}
              >
                <div className={cn("relative w-full", i === 0 ? "aspect-video" : "aspect-square")}>
                  <Image
                    src={post.media_url || `https://picsum.photos/seed/${post.id}/800/800`}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/20">
                      <PlayCircle className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  {/* Post info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="font-black text-xs uppercase tracking-tight text-white line-clamp-1">{post.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] font-bold text-white/50 uppercase">@{post.user_name}</span>
                      <div className="flex items-center gap-1 text-[9px] text-white/50">
                        <Heart className="h-3 w-3" />
                        <span>{post.likes_count}</span>
                      </div>
                    </div>
                  </div>

                  {/* Category badge */}
                  {post.category && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary/80 backdrop-blur-sm text-[8px] font-black uppercase text-white">
                      {post.category}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 text-center space-y-4 py-8 border-t border-white/5">
          <p className="text-white/40 text-sm font-medium">Join to post, comment and interact</p>
          <div className="flex gap-3 justify-center">
            <Link href="/sign-up">
              <Button className="h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest animate-bg-color-sync border-none text-white shadow-xl">
                Create Account
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline" className="h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest border-white/20 text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Video player dialog */}
      <Dialog open={!!activePost} onOpenChange={() => setActivePost(null)}>
        <DialogContent className="max-w-[96vw] h-[90vh] p-0 overflow-hidden border-2 border-primary/20 bg-black rounded-[3rem] shadow-2xl flex flex-col">
          <DialogTitle className="sr-only">{activePost?.title}</DialogTitle>
          {activePost && (
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <InternalPlayer url={activePost.video_url || activePost.media_url} />
              </div>
              <div className="p-4 bg-black/80 border-t border-white/5 flex items-center justify-between">
                <div>
                  <p className="font-black text-sm text-white uppercase tracking-tight">{activePost.title}</p>
                  <p className="text-[10px] text-white/40 font-bold uppercase">@{activePost.user_name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setLikedPosts(p => ({ ...p, [activePost.id]: !p[activePost.id] }))}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase"
                  >
                    <Heart className={cn("h-5 w-5", likedPosts[activePost.id] ? "fill-red-500 text-red-500" : "text-white/60")} />
                    <span className="text-white/60">{activePost.likes_count + (likedPosts[activePost.id] ? 1 : 0)}</span>
                  </button>
                  <Link href="/sign-up">
                    <Button size="sm" className="rounded-full font-black uppercase text-[9px] tracking-widest animate-bg-color-sync border-none text-white">
                      Join to interact
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
