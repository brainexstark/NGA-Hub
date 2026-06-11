'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '../../../../firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '../../../../lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Home, Search, Clapperboard, Heart, Camera, PlayCircle,
  Rocket, BookOpen, MessageCircle, Repeat2, Send,
  Bookmark, Volume2, VolumeX, Bell
} from 'lucide-react';
import { cn, getEmbedUrl } from '../../../../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "../../../../components/ui/dialog";
import { Card } from '../../../../components/ui/card';
import { useToast } from '../../../../hooks/use-toast';
import { SocialStatsPopover } from '../../../../components/social-stats-popover';
import { fetchAds, injectAds, isAd, type Ad } from '../../../../lib/ads';
import { useRealtimeFeed } from '../../../../hooks/use-realtime-feed';
import { useRealtimeFollowers, useAppUsers } from '../../../../hooks/use-realtime';
import { filterForUnder10 } from '../../../../lib/inappropriate-words';
import { supabase } from '../../../../lib/supabase';

const InternalPlayer = ({ url }: { url: string }) => {
  if (!url) return null;
  const lower = url.toLowerCase();
  const isExternal = lower.includes('youtube') || lower.includes('youtu.be') ||
    lower.includes('tiktok') || lower.includes('instagram') || lower.includes('vimeo');
  const isDirectVideo = lower.endsWith('.mp4') || lower.endsWith('.webm') ||
    lower.endsWith('.mov') || lower.startsWith('blob:') || lower.startsWith('data:video') ||
    lower.includes('/storage/v1/object/') || lower.includes('/object/public/');

  if (isExternal) {
    const embedUrl = getEmbedUrl(url);
    return <iframe src={embedUrl} className="w-full h-full border-none" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
  }
  if (isDirectVideo) {
    return <video src={url} className="w-full h-full object-contain bg-black" autoPlay controls playsInline />;
  }
  // Fallback: try iframe (covers misc embeds)
  return <iframe src={url} className="w-full h-full border-none" allowFullScreen />;
};

// Inline notification bell for HomeTon header
function NotificationBellInline({ userId, userName, userAvatar }: { userId: string; userName: string; userAvatar: string }) {
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Safe fetch — won't crash if table doesn't exist
  React.useEffect(() => {
    if (!userId) return;
    supabase.from('notifications').select('*')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
      .then(({ data, error }) => {
        if (error) return; // table may not exist yet
        if (data) {
          setNotifications(data);
          setUnreadCount(data.filter((n: any) => !n.is_read).length);
        }
      });

    const channel = supabase.channel(`notif-inline-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  React.useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(p => !p)}
        className="relative text-foreground/60 hover:text-primary transition-colors">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-500 rounded-full text-[8px] font-black text-white flex items-center justify-center border border-background animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-8 w-72 bg-slate-900/98 border border-white/10 rounded-2xl shadow-2xl z-[99999] overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-white/5">
            <p className="font-black text-xs text-white">Notifications {unreadCount > 0 && <span className="ml-1 text-primary">({unreadCount})</span>}</p>
          </div>
          <div className="max-h-64 overflow-y-auto no-scrollbar divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="p-6 text-center opacity-30"><p className="text-xs font-black">No notifications yet</p></div>
            ) : notifications.slice(0, 10).map((n: any) => (
              <div key={n.id} className={`flex items-start gap-2 p-3 hover:bg-white/5 cursor-pointer ${!n.is_read ? 'bg-primary/5' : ''}`}>
                <span className="text-sm shrink-0">{n.type === 'like' ? '❤️' : n.type === 'comment' ? '💬' : n.type === 'follow' ? '👤' : n.type === 'live' ? '🔴' : '🔔'}</span>
                <p className="text-[10px] text-white/80 line-clamp-2">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Direct media renderer — loads instantly, plays when visible ─────────────
function FeedMedia({ url }: { url: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [inView, setInView] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  const isVideo = React.useMemo(() => {
    if (!url) return false;
    const l = url.toLowerCase();
    return l.includes('youtube') || l.includes('youtu.be') || l.includes('tiktok') ||
      l.includes('instagram') || l.endsWith('.mp4') || l.endsWith('.webm') ||
      l.endsWith('.mov') || l.startsWith('data:video') || l.includes('blob:') ||
      l.includes('/storage/v1/object/') || l.includes('/object/public/');
  }, [url]);

  const isExternal = !!(url?.includes('youtube') || url?.includes('youtu.be') ||
    url?.includes('tiktok') || url?.includes('instagram'));

  // Observe visibility — low threshold so video plays as soon as it enters view
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting),
      { threshold: 0.1 }  // play as soon as 10% visible
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Play/pause native video
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
    if (!isExternal || !url) return url;
    const base = getEmbedUrl(url);
    if (!inView) return base;
    return base.includes('?') ? `${base}&autoplay=1&mute=0&playsinline=1` : `${base}?autoplay=1&mute=0&playsinline=1`;
  }, [url, isExternal, inView]);

  if (!url) return <div className="w-full aspect-[9/16] bg-zinc-900" />;

  return (
    <div ref={ref} className="w-full aspect-[9/16] bg-black overflow-hidden relative">
      {!isVideo ? (
        // Image
        <img
          src={url}
          alt="post"
          className="w-full h-full object-cover"
          loading="eager"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : isExternal ? (
        // External embed — load immediately when visible
        inView ? (
          <iframe
            key={`active-${url}`}
            src={embedUrl}
            className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full bg-zinc-900 flex items-center justify-center cursor-pointer" onClick={() => setInView(true)}>
            <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <PlayCircle className="h-8 w-8 text-white/60" />
            </div>
          </div>
        )
      ) : (
        // Native video — preload everything, play instantly
        <video
          ref={videoRef}
          src={url}
          className="w-full h-full object-contain bg-black"
          loop
          playsInline
          preload="auto"
          controls
          onLoadedData={() => setLoaded(true)}
        />
      )}
    </div>
  );
}

// ─── Post Action Buttons ────────────────────────────────────────────────────
function PostActions({ postId, userId, postUrl, postTitle, firestore, userUid, initialLikes = 0 }: {
  postId: string; userId: string; postUrl: string; postTitle: string;
  firestore: any; userUid?: string; initialLikes?: number;
}) {
  const [liked, setLiked] = React.useState(false);
  const [likesCount, setLikesCount] = React.useState(initialLikes);
  const [saved, setSaved] = React.useState(false);
  const [reposted, setReposted] = React.useState(false);
  const [muted, setMuted] = React.useState(true);
  const { toast } = useToast();

  if (!postId) return null;

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(p => newLiked ? p + 1 : Math.max(0, p - 1));
    // Fire and forget to Supabase
    try {
      if (newLiked) {
        await supabase.from('likes').insert({ post_id: postId, user_id: userId || 'anon' });
      } else {
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId || 'anon');
      }
    } catch {}
  };

  const handleMute = () => {
    setMuted(p => !p);
    const videos = document.querySelectorAll(`[data-post-id="${postId}"] video`);
    videos.forEach((v: any) => { v.muted = !muted; });
  };

  const handleSave = async () => {
    setSaved(p => !p);
    toast({ title: saved ? 'Removed from saved' : 'Saved!' });
  };

  const handleRepost = () => {
    setReposted(p => !p);
    toast({ title: reposted ? 'Repost removed' : 'Reposted!' });
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
    <div className="px-4 py-2 flex items-center justify-between border-b border-pink-500/10">
      <div className="flex items-center gap-5">
        <button onClick={handleLike} className="flex items-center gap-1.5 active:scale-125 transition-transform">
          <Heart className={cn("h-6 w-6 transition-all duration-200", liked ? "fill-pink-500 text-pink-500" : "text-white/70")} />
          {likesCount > 0 && <span className="text-xs font-black text-white/60">{likesCount}</span>}
        </button>
        <Link href={`/comments/${postId}`} className="flex items-center gap-1.5 active:scale-110 transition-transform">
          <MessageCircle className="h-6 w-6 text-blue-400/70" />
        </Link>
        <button onClick={handleRepost} className="active:scale-110 transition-transform">
          <Repeat2 className={cn("h-6 w-6 transition-all duration-200", reposted ? "text-green-400" : "text-white/70")} />
        </button>
        <button onClick={handleShare} className="active:scale-110 transition-transform">
          <Send className="h-6 w-6 text-white/70" />
        </button>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={handleMute} className="active:scale-110 transition-transform">
          {muted
            ? <VolumeX className="h-6 w-6 text-white/60" />
            : <Volume2 className="h-6 w-6 text-blue-400" />
          }
        </button>
        <button onClick={handleSave} className="active:scale-110 transition-transform">
          <Bookmark className={cn("h-6 w-6 transition-all duration-200", saved ? "fill-pink-400 text-pink-400" : "text-white/70")} />
        </button>
      </div>
    </div>
  );
}

// Captures the first frame of a video as a thumbnail.
// For direct videos: loads metadata, seeks to frame 0, draws to canvas.
// For YouTube: uses img.youtube.com thumbnail API.
// For TikTok/Instagram: shows a play icon placeholder (no API access).
function VideoThumbnail({ url }: { url: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [thumb, setThumb] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);

  const lower = url?.toLowerCase() || '';

  const isYouTube = lower.includes('youtube.com') || lower.includes('youtu.be');
  const isTikTok  = lower.includes('tiktok.com');
  const isInsta   = lower.includes('instagram.com');
  const isDirectVideo =
    lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov') ||
    lower.endsWith('.m4v') || lower.endsWith('.avi') ||
    lower.startsWith('blob:') || lower.startsWith('data:video') ||
    lower.includes('/storage/v1/object/') || lower.includes('/object/public/');

  // YouTube — free CDN thumbnail, no CORS issues
  React.useEffect(() => {
    if (!isYouTube) return;
    const m = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    if (m) setThumb(`https://img.youtube.com/vi/${m[1]}/mqdefault.jpg`);
    setReady(true);
  }, [url, isYouTube]);

  // Direct video — seek to first frame and capture via canvas
  React.useEffect(() => {
    if (!isDirectVideo || !url) return;

    const vid = document.createElement('video');
    vid.crossOrigin = 'anonymous';
    vid.muted = true;
    vid.playsInline = true;
    vid.preload = 'metadata';

    // Step 1: once metadata loaded, seek to just past start
    const onMetadata = () => { vid.currentTime = 0.01; };

    // Step 2: once seeked, draw frame to canvas
    const onSeeked = () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width  = vid.videoWidth  || 160;
        canvas.height = vid.videoHeight || 284;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
          setThumb(canvas.toDataURL('image/jpeg', 0.75));
        }
      } catch { /* cross-origin may block — that's fine */ }
      setReady(true);
      vid.src = '';
    };

    const onError = () => { setReady(true); vid.src = ''; };

    vid.addEventListener('loadedmetadata', onMetadata);
    vid.addEventListener('seeked', onSeeked);
    vid.addEventListener('error', onError);
    vid.src = url;
    vid.load();

    return () => {
      vid.removeEventListener('loadedmetadata', onMetadata);
      vid.removeEventListener('seeked', onSeeked);
      vid.removeEventListener('error', onError);
      vid.src = '';
    };
  }, [url, isDirectVideo]);

  // TikTok / Instagram — no embeddable thumbnail, show icon
  if (isTikTok || isInsta) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-pink-900/40 to-purple-900/40 flex items-center justify-center">
        <PlayCircle className="h-8 w-8 text-white/40" />
      </div>
    );
  }

  // YouTube — show fetched thumbnail
  if (isYouTube) {
    return thumb
      ? <img src={thumb} alt="" className="w-full h-full object-cover" />
      : <div className="w-full h-full bg-white/5 flex items-center justify-center"><PlayCircle className="h-8 w-8 text-white/30" /></div>;
  }

  // Direct video — canvas capture + loading shimmer
  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      {thumb
        ? <img src={thumb} alt="" className="w-full h-full object-cover" />
        : !ready
          ? <div className="w-full h-full bg-white/10 animate-pulse" />
          : <div className="w-full h-full bg-white/5 flex items-center justify-center">
              <PlayCircle className="h-8 w-8 text-white/30" />
            </div>
      }
    </>
  );
}

export default function HomeTonClient({ ageGroup }: { ageGroup: string }) {
  const isUnder13 = ageGroup === 'under-13';
  
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

  // All registered users — newest first for the "New Members" row, same age group only
  const { users: allAppUsers } = useAppUsers(ageGroup);
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

  const staticFeedPosts: any[] = []; // No mock content — only real user posts

  // Supabase realtime feed — primary source, fetches all posts
  const { posts: supabasePosts, loading: feedLoading } = useRealtimeFeed(ageGroup);

  // Ads
  const [ads, setAds] = React.useState<Ad[]>([]);
  React.useEffect(() => {
    fetchAds(ageGroup).then(setAds);
  }, [ageGroup]);

  // Map supabase posts directly — shuffle for variety
  const rawPosts = React.useMemo(() => {
    const mapped = supabasePosts
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(p => ({
        id: p.id,
        title: p.title || p.caption,
        caption: p.caption,
        mediaUrl: p.mediaUrl,
        url: p.url,
        userName: p.userName,
        userAvatar: p.userAvatar,
        category: p.category,
        likesCount: p.likesCount,
      }));
    // Keep newest 3 at top, shuffle the rest for variety
    const top = mapped.slice(0, 3);
    const rest = mapped.slice(3).sort(() => Math.random() - 0.5);
    return [...top, ...rest];
  }, [supabasePosts]);

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

  if (isUnder13) {
    return (
      <div className="min-h-screen bg-[#0d0620] text-white relative overflow-x-hidden animate-in fade-in duration-1000">
        <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-indigo-900/40 to-blue-900/50" />
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
                                          <AvatarImage src={story.user_avatar || ''} className="object-cover" />
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
                        <DialogContent className="max-w-[min(420px,96vw)] h-[90vh] p-0 overflow-hidden border-none bg-black rounded-[2rem] shadow-2xl flex items-center justify-center">
                            <DialogTitle className="sr-only">Story</DialogTitle>
                            <div className="w-full h-full">
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
                                <div className="relative overflow-hidden cursor-pointer group aspect-[9/16]" onClick={handleTriggerCycle}>
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

      {/* ── SINGLE TOP HEADER — pink-blue gradient accent ── */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-slate-950 via-purple-950/80 to-slate-950 backdrop-blur-xl border-b border-pink-500/20 px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Left: App icon + name */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-8 w-8 rounded-xl overflow-hidden border border-pink-500/30 shrink-0 ring-1 ring-pink-500/20">
            <img src="/icons/icon-192.png" alt="NGA Hub" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">NGA Hub</span>
        </div>

        {/* Center: Stats */}
        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest">
          <SocialStatsPopover type="disciples" count={profile?.disciplesCount || 0} label="Disciples" colorClass="text-pink-400" />
          <SocialStatsPopover type="followers" count={followersCount} label="Followers" colorClass="text-blue-400" />
          <SocialStatsPopover type="following" count={followingCount} label="Following" colorClass="text-foreground/60" />
        </div>

        {/* Right: Notification + Favorites */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/favorites" className="text-pink-400/70 hover:text-pink-400 transition-colors">
            <Heart className="h-5 w-5" />
          </Link>
          {user && (
            <NotificationBellInline
              userId={user.uid}
              userName={profile?.displayName || user.displayName || ''}
              userAvatar={profile?.profilePicture || user.photoURL || ''}
            />
          )}
        </div>
      </header>

      {/* ── PROFILES / STORIES ROW — logged-in user first, then all app users ── */}
      <div className={`transition-all duration-300 overflow-hidden border-b border-pink-500/10 bg-gradient-to-r from-slate-950/80 via-purple-950/30 to-slate-950/80 ${profilesVisible ? 'max-h-36 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 py-3">

          {/* ── LOGGED-IN USER — always first, full profile pic ── */}
          <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group" onClick={() => router.push('/create-post/?type=story')}>
            <div className="relative">
              {/* Pink-blue gradient ring for own profile */}
              <div className="h-16 w-16 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 via-blue-500 to-purple-500 group-hover:scale-105 transition-all">
                <div className="h-full w-full rounded-full overflow-hidden border-2 border-background">
                  {(profile?.profilePicture || user?.photoURL) ? (
                    <img
                      src={profile?.profilePicture || user?.photoURL || ''}
                      alt="You"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-500 to-blue-500 flex items-center justify-center">
                      <span className="text-white font-black text-lg">
                        {(profile?.displayName || user?.displayName || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {/* + add story button */}
              <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 bg-gradient-to-br from-pink-500 to-blue-500 rounded-full border-2 border-background flex items-center justify-center">
                <span className="text-white text-[10px] font-black">+</span>
              </div>
            </div>
            <span className="text-[9px] font-bold text-white/60 truncate max-w-[60px] text-center">
              {profile?.displayName?.split(' ')[0] || 'You'}
            </span>
          </div>

          {/* ── OTHER REGISTERED USERS — real profiles with green online dot ── */}
          {newMembers.map((member, idx) => (
            <div key={member.id} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
              <div className="relative">
                {/* Blue ring for online, white/grey for offline */}
                <div className={`h-16 w-16 rounded-full p-[2px] transition-all group-hover:scale-105 ${member.is_online ? 'bg-gradient-to-tr from-blue-400 to-cyan-400' : 'bg-white/20'}`}>
                  <div className="h-full w-full rounded-full overflow-hidden border-2 border-background">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.display_name || ''} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/10 flex items-center justify-center">
                        <span className="text-white font-black text-lg">
                          {(member.display_name || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Green online dot — outside overflow-hidden */}
                {member.is_online && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-400 rounded-full border-2 border-background animate-pulse z-20" />
                )}
              </div>
              <span className="text-[9px] font-medium text-white/50 truncate max-w-[60px] text-center">
                {member.display_name?.split(' ')[0] || `user_${idx}`}
              </span>
            </div>
          ))}

          {/* ── STORIES ── */}
          {realtimeStories.map((story, idx) => (
            <Dialog key={story.id}>
              <DialogTrigger asChild>
                <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group" onClick={handleTriggerCycle}>
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 to-purple-500 group-hover:scale-105 transition-all">
                      <div className="h-full w-full rounded-full overflow-hidden border-2 border-background">
                        {story.user_avatar ? (
                          <img src={story.user_avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-pink-900 flex items-center justify-center">
                            <span className="text-white font-black">{story.user_name?.[0]?.toUpperCase() || 'U'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-medium text-white/50 truncate max-w-[60px] text-center">
                    {story.user_name?.split(' ')[0] || `user_${idx}`}
                  </span>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-[min(420px,96vw)] h-[90vh] p-0 overflow-hidden border-none bg-black rounded-[2rem] shadow-2xl">
                <DialogTitle className="sr-only">Story</DialogTitle>
                <div className="w-full h-full"><InternalPlayer url={story.media_url} /></div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>

      {/* ── FEED POSTS ── */}
      <main className="divide-y divide-white/5">
        {/* Skeleton while loading */}
        {feedLoading && feedPosts.length === 0 && (
          <div>
            {[1,2,3].map(i => (
              <div key={i} className="border-b border-white/5 animate-pulse">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="h-9 w-9 rounded-full bg-white/10 shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-24 bg-white/10 rounded-full" />
                    <div className="h-2 w-16 bg-white/5 rounded-full" />
                  </div>
                </div>
                <div className="w-full aspect-[9/16] bg-white/5" />
                <div className="px-4 py-3 flex gap-5">
                  <div className="h-6 w-6 rounded-full bg-white/10" />
                  <div className="h-6 w-6 rounded-full bg-white/10" />
                  <div className="h-6 w-6 rounded-full bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        )}

        {feedPosts.map((post, index) => {
          // ── Ad post ──
          if (isAd(post)) {
            return (
              <div key={post.id} className="border-b border-white/5">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-400 font-black text-xs border border-yellow-400/20">Ad</div>
                    <div>
                      <p className="font-black text-sm">{post.partner_name}</p>
                      <p className="text-[9px] text-yellow-400 font-black uppercase tracking-widest">Sponsored</p>
                    </div>
                  </div>
                </div>
                <FeedMedia url={post.video_url || post.media_url} />
              </div>
            );
          }

          // ── Real post ──
          const p = post as any;
          const showSuggested = (index + 1) % 10 === 0 && supabasePosts.length > 0;

          return (
            <React.Fragment key={p.id}>
              <div data-post-id={p.id} className="border-b border-white/5">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full overflow-hidden border border-white/10 ring-2 ring-primary/20 shrink-0 bg-primary/20">
                      {p.userAvatar
                        ? <img src={p.userAvatar} alt="" className="w-full h-full object-cover" />
                        : <span className="w-full h-full flex items-center justify-center text-primary font-black text-xs">{p.userName?.[0]?.toUpperCase() || 'U'}</span>
                      }
                    </div>
                    <div>
                      <p className="font-black text-sm">@{(p.userName || 'user').replace(/\s/g,'_').toLowerCase()}</p>
                      {p.category && <p className="text-[9px] text-white/40">{p.category}</p>}
                    </div>
                  </div>
                  <span className="text-white/20 text-lg">···</span>
                </div>

                {/* Media — direct render, no wrapper components */}
                <FeedMedia url={p.url || p.mediaUrl} />

                {/* Actions */}
                <PostActions
                  postId={p.id} userId={user?.uid || ''}
                  postUrl={p.url || p.mediaUrl} postTitle={p.title || p.caption}
                  firestore={firestore} initialLikes={p.likesCount || 0}
                />

                {/* Caption */}
                {p.caption && (
                  <div className="px-4 pb-3">
                    <span className="font-black text-xs mr-2">@{(p.userName || 'user').replace(/\s/g,'_').toLowerCase()}</span>
                    <span className="text-xs text-white/70">{p.caption}</span>
                  </div>
                )}
              </div>

              {/* Suggested Reels strip every 10 posts */}
              {showSuggested && (
                <div className="px-4 py-4 bg-background/50 border-y border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-black text-sm uppercase tracking-tight">Suggested Reels</p>
                    <Link href={`/reels/${ageGroup}`} className="text-[10px] font-black uppercase tracking-widest text-primary">See all →</Link>
                  </div>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {supabasePosts.slice(0, 6).map(reel => (
                      <Link key={reel.id} href={`/reels/${ageGroup}`}
                        className="shrink-0 w-28 aspect-[9/16] rounded-2xl overflow-hidden relative bg-black border border-white/10 block">
                        <VideoThumbnail url={reel.url || reel.mediaUrl} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <p className="text-[9px] font-black text-white truncate">
                            @{(reel.userName || 'user').replace(/\s/g,'_').toLowerCase()}
                          </p>
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                          <div className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20">
                            <PlayCircle className="h-4 w-4 text-white" />
                          </div>
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
