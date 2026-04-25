'use client';

import * as React from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '../firebase';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '../lib/types';
import { supabase, type SupabasePost } from '../lib/supabase';
import { Heart, Play, ArrowRight, Loader2 } from 'lucide-react';
import { getEmbedUrl, cn, isVideoUrl } from '../lib/utils';

// Animated background — AI-style dynamic colour blobs
function DynamicBg({ children }: { children: React.ReactNode }) {
  const [pos, setPos] = React.useState({ x: 50, y: 50 });
  const [colorSet, setColorSet] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);

  const colors = [
    ['#ff007f', '#9d00ff', '#0044ff'],
    ['#9d00ff', '#0044ff', '#00c3ff'],
    ['#0044ff', '#00c3ff', '#00e676'],
    ['#ff6d00', '#ff007f', '#9d00ff'],
    ['#00c3ff', '#9d00ff', '#ff007f'],
  ];

  React.useEffect(() => {
    const t = setInterval(() => setColorSet(p => (p + 1) % colors.length), 3000);
    return () => clearInterval(t);
  }, []);

  const handleMove = (x: number, y: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ x: ((x - r.left) / r.width) * 100, y: ((y - r.top) / r.height) * 100 });
  };

  const [a, b, c] = colors[colorSet];

  return (
    <div ref={ref} className="relative min-h-screen overflow-hidden"
      style={{ background: '#0a051a' }}
      onMouseMove={e => handleMove(e.clientX, e.clientY)}
      onTouchMove={e => { const t = e.touches[0]; if (t) handleMove(t.clientX, t.clientY); }}>
      {/* Animated blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute rounded-full blur-[130px] opacity-70 w-[500px] h-[500px]"
          style={{ background: `radial-gradient(circle, ${a}88, transparent 70%)`, left: `${pos.x - 25}%`, top: `${pos.y - 25}%`, transform: 'translate(-50%,-50%)', transition: 'left 1.5s ease, top 1.5s ease, background 3s ease' }} />
        <div className="absolute rounded-full blur-[100px] opacity-60 w-[400px] h-[400px]"
          style={{ background: `radial-gradient(circle, ${b}77, transparent 70%)`, left: `${100 - pos.x}%`, top: `${100 - pos.y}%`, transform: 'translate(-50%,-50%)', transition: 'left 2s ease, top 2s ease, background 3s ease' }} />
        <div className="absolute rounded-full blur-[80px] opacity-40 w-[300px] h-[300px]"
          style={{ background: `radial-gradient(circle, ${c}66, transparent 70%)`, left: '50%', top: '50%', transform: 'translate(-50%,-50%)', transition: 'background 3s ease' }} />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = React.useState(false);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [posts, setPosts] = React.useState<SupabasePost[]>([]);
  const [feedLoading, setFeedLoading] = React.useState(true);
  const [activePost, setActivePost] = React.useState<SupabasePost | null>(null);
  const [likedPosts, setLikedPosts] = React.useState<Record<string, boolean>>({});
  const [userCount, setUserCount] = React.useState(0);

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  React.useEffect(() => { setMounted(true); }, []);

  React.useEffect(() => {
    if (mounted && !isUserLoading && user && !profileLoading) {
      if (userProfile?.ageGroup) router.replace(`/HomeTon/${userProfile.ageGroup}`);
      else if (userProfile === null) router.replace('/select-age');
    }
  }, [user, isUserLoading, userProfile, profileLoading, router, mounted]);

  React.useEffect(() => {
    const load = async () => {
      setFeedLoading(true);
      try {
        const { data } = await supabase.from('posts').select('*')
          .eq('is_flagged', false).order('created_at', { ascending: false }).limit(30);
        if (data) setPosts(data);
      } catch {}
      setFeedLoading(false);
    };
    load();

    const ch = supabase.channel('landing')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' },
        p => setPosts(prev => [p.new as SupabasePost, ...prev.slice(0, 29)]))
      .subscribe();

    supabase.from('app_users').select('*', { count: 'exact', head: true })
      .then(({ count }) => { if (count) setUserCount(count); });

    return () => { supabase.removeChannel(ch); };
  }, []);

  if (!mounted) return <div className="min-h-screen bg-[#0a051a]" />;

  return (
    <DynamicBg>
      {/* Minimal top bar — just logo */}
      <div className="flex items-center justify-between px-5 py-4 bg-black/20 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl overflow-hidden border border-white/20">
            <img src="/icons/icon-192.png" alt="NGA Hub" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-white text-base tracking-tight">NGA Hub</span>
        </div>
        {userCount > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-medium">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            {userCount.toLocaleString()} members
          </div>
        )}
      </div>

      {/* HERO — welcoming, fun, emojis */}
      <section className="px-5 pt-12 pb-8 text-center max-w-lg mx-auto">
        {/* Fun emoji row */}
        <div className="flex items-center justify-center gap-3 mb-6 text-3xl animate-in fade-in duration-700">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>🎉</span>
          <span className="animate-bounce" style={{ animationDelay: '150ms' }}>🚀</span>
          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>✨</span>
          <span className="animate-bounce" style={{ animationDelay: '450ms' }}>🎨</span>
          <span className="animate-bounce" style={{ animationDelay: '600ms' }}>🌟</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-3 leading-tight">
          Hey there! 👋<br />
          <span className="dynamic-text-mesh">Welcome to NGA Hub</span>
        </h1>

        <p className="text-white/60 text-base font-normal leading-relaxed mb-2">
          Your fun space to learn, create, share and connect — for all ages! 🎓📱
        </p>
        <p className="text-white/40 text-sm mb-8">
          Join thousands already posting, going live and making friends 🤝
        </p>

        {/* Live feed preview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-white/70">
              🔴 Live community feed
            </p>
            <span className="text-[10px] text-green-400 font-bold">
              {posts.length > 0 ? `${posts.length} posts` : 'Loading...'}
            </span>
          </div>

          {feedLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="py-10 text-center bg-white/5 rounded-3xl border border-white/10 space-y-2">
              <div className="text-4xl">📸</div>
              <p className="text-white/40 text-sm font-medium">No posts yet — be the first!</p>
              <p className="text-white/20 text-xs">Sign up and share something amazing 🌟</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {posts.slice(0, 9).map((post, i) => (
                <div key={post.id} onClick={() => setActivePost(post)}
                  className={cn("relative rounded-2xl overflow-hidden cursor-pointer group border border-white/10 hover:border-primary/40 transition-all active:scale-95",
                    i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square")}>
                  {post.media_url ? (
                    isVideoUrl(post.media_url) ? (
                      <div className="w-full h-full bg-black/60 flex items-center justify-center">
                        <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                          <Play className="h-4 w-4 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                    ) : (
                      <img src={post.media_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-2xl">📸</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-1.5 left-2 right-2">
                    <p className="text-[9px] text-white/80 font-bold truncate">@{post.user_name}</p>
                  </div>
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/40 px-1.5 py-0.5 rounded-full">
                    <Heart className="h-2.5 w-2.5 text-white/60" />
                    <span className="text-[8px] text-white/60">{post.likes_count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fun emoji row 2 */}
        <div className="flex items-center justify-center gap-2 mb-8 text-2xl">
          <span>🎵</span><span>🏆</span><span>💬</span><span>📚</span><span>🎬</span><span>🌍</span>
        </div>

        {/* CTA buttons — at the BOTTOM */}
        <div className="space-y-3">
          <Link href="/sign-up"
            className="flex items-center justify-center gap-2 w-full h-14 bg-primary rounded-2xl font-bold text-white text-base hover:bg-primary/90 active:scale-[0.98] transition-all shadow-2xl shadow-primary/30">
            Create free account 🚀 <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/sign-in"
            className="flex items-center justify-center gap-2 w-full h-12 bg-white/5 border border-white/15 rounded-2xl font-semibold text-white text-sm hover:bg-white/10 transition-all">
            Already have an account? Sign in →
          </Link>
        </div>

        <p className="text-white/20 text-xs mt-4">Free forever · No credit card needed 💜</p>
      </section>

      {/* Video dialog */}
      {activePost && (
        <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActivePost(null)}>
          <div className="w-full max-w-sm bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="aspect-video bg-black">
              {isVideoUrl(activePost.video_url || activePost.media_url) ? (
                <iframe src={getEmbedUrl(activePost.video_url || activePost.media_url)}
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              ) : (
                <img src={activePost.media_url} alt="" className="w-full h-full object-contain" />
              )}
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-white">{activePost.title || activePost.caption}</p>
                <p className="text-[10px] text-white/40">@{activePost.user_name}</p>
              </div>
              <Link href="/sign-up"
                className="h-9 px-4 bg-primary rounded-full font-bold text-white text-xs flex items-center">
                Join 🎉
              </Link>
            </div>
          </div>
        </div>
      )}
    </DynamicBg>
  );
}
