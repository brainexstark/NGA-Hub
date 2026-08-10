'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppSidebar } from '../../components/app-sidebar';
import { SidebarProvider, SidebarInset, useSidebar } from '../../components/ui/sidebar';
import { useUser } from '../../auth';
import { supabase } from '../../lib/supabase';
import { updateDocNonBlocking, docRef } from '../../lib/db';
import type { UserProfile } from '../../lib/types';
import { Loader2, Heart, Bell, Plus, Home, Search, GraduationCap, Instagram, Facebook, MessageSquareText, Zap, Power, Video, BookImage, Clapperboard, Radio, Camera, ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LockdownOverlay } from '../../components/lockdown-overlay';
import { TimesUp } from '../../components/times-up';
import { Logo } from '../../components/logo';
import { OnboardingTour } from '../../components/onboarding-tour';
import Link from 'next/link';
import { Avatar, AvatarImage } from '../../components/ui/avatar';
import { useToast } from '../../hooks/use-toast';
import { Dialog, DialogContent, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { useRealtimeNotifications, usePresence, upsertAppUser } from '../../hooks/use-realtime';
import { showNativeNotification, setupPushNotifications } from '../../hooks/use-push-notifications';
import { ThemeToggle } from '../../components/theme-toggle';
import { InstallBanner } from '../../components/install-banner';

// ─── Push Notification Helper ─────────────────────────────────────────────────
async function requestPushPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function sendPushNotification(title: string, body: string, icon = '/icons/icon-192.png') {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, {
      body,
      icon,
      badge: '/icons/icon-32.png',
      tag: 'nga-hub-notification',
      silent: false,
    });
    n.onclick = () => { window.focus(); n.close(); };
  } catch {}
}
function NotificationBell({ userId, userName, userAvatar }: { userId: string; userName: string; userAvatar: string }) {
  const { unreadCount, notifications, markAllRead } = useRealtimeNotifications(userId);
  const [open, setOpen] = React.useState(false);
  const [prevCount, setPrevCount] = React.useState(0);
  const [bgIndex, setBgIndex] = React.useState(0);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Black gradient backgrounds for notification dropdown
  const gradients = [
    'linear-gradient(135deg, #000000 0%, #111111 50%, #000000 100%)',
    'linear-gradient(135deg, #0a0a0a 0%, #141414 50%, #000000 100%)',
    'linear-gradient(135deg, #111111 0%, #000000 50%, #0a0a0a 100%)',
    'linear-gradient(135deg, #000000 0%, #0d0d0d 50%, #111111 100%)',
  ];

  // Cycle background gradient
  React.useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setBgIndex(p => (p + 1) % gradients.length), 2000);
    return () => clearInterval(t);
  }, [open]);

  // Request push permission on mount
  React.useEffect(() => {
    if (userId) setupPushNotifications();
  }, [userId]);

  // Auto-open + send push notification when NEW notification arrives
  React.useEffect(() => {
    if (unreadCount > prevCount && prevCount >= 0 && unreadCount > 0) {
      setOpen(true);
      // Send native phone notification via service worker
      const latest = notifications[0];
      if (latest) {
        showNativeNotification({
          title: 'NGA Hub',
          body: latest.message,
          icon: userAvatar || '/icons/icon-192.png',
          url: latest.post_id ? `/comments/${latest.post_id}` : '/',
          tag: `nga-${latest.type}-${latest.id}`,
        });
      }
    }
    setPrevCount(unreadCount);
  }, [unreadCount, notifications]);

  // Close on click outside
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setOpen(p => !p)}
        className="relative text-foreground/60 hover:text-foreground transition-colors">
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="nga-badge absolute -top-1 -right-1 border-2 border-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 rounded-2xl shadow-2xl z-[99999] overflow-hidden animate-in slide-in-from-top-2 duration-200 nga-card">
          {/* Header */}
          <div className="px-4 py-3 nga-divider flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              Notifications
            </p>
            {unreadCount > 0 && (
              <button onClick={() => { markAllRead(); }}
                className="text-xs font-semibold text-nga-action hover:opacity-70 transition-opacity">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto no-scrollbar divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="h-8 w-8 mx-auto text-muted-foreground opacity-30" />
                <p className="text-xs text-muted-foreground">No notifications yet</p>
              </div>
            ) : notifications.slice(0, 20).map(n => (
              <div key={n.id}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors ${!n.is_read ? 'bg-nga-action/5' : ''}`}
                onClick={() => {
                  setOpen(false);
                  markAllRead();
                  if ((n.type as string) === 'live') router.push('/live-stream');
                  else if (n.post_id) router.push(`/comments/${n.post_id}`);
                  else if ((n.type as string) === 'follow') router.push('/network');
                  else if ((n.type as string) === 'message') router.push('/chat');
                }}>
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm">
                  {n.type === 'like' ? '❤️'
                    : n.type === 'comment' ? '💬'
                    : n.type === 'follow' ? '👤'
                    : (n.type as string) === 'message' ? '✉️'
                    : n.type === 'live' ? '🔴'
                    : '🔔'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-foreground line-clamp-2 leading-[18px]">{n.message}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!n.is_read && <div className="h-2 w-2 rounded-full bg-nga-action shrink-0" />}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 nga-divider" style={{ borderTop: '1px solid' }}>
            <button onClick={() => { setOpen(false); router.push('/activity'); }}
              className="w-full text-center text-[13px] font-semibold text-nga-action hover:opacity-70 transition-opacity py-0.5">
              See all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Presence Tracker (registers user as online) ──────────────────────────────
function PresenceTracker({ userId, userName, userAvatar }: { userId: string; userName: string; userAvatar: string }) {
  usePresence(userId, userName, userAvatar);

  React.useEffect(() => {
    if (!userId || !userName) return;
    // Never save blob: or data: URLs — only real http URLs
    const safeAvatar = userAvatar?.startsWith('http') ? userAvatar : '';
    upsertAppUser({ id: userId, display_name: userName, avatar: safeAvatar, is_online: true, last_seen: new Date().toISOString() });
    const handleUnload = () => {
      upsertAppUser({ id: userId, is_online: false, last_seen: new Date().toISOString() });
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [userId, userName, userAvatar]);

  return null;
}

// New user join notification banner — uses Supabase realtime
function NewUserBanner() {
  const [banner, setBanner] = React.useState<{ name: string; uid: string } | null>(null);
  const router = useRouter();
  const seenRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    // Fetch recently joined users
    supabase.from('app_users')
      .select('id,display_name,created_at')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        data?.forEach(u => {
          if (seenRef.current.has(u.id)) return;
          seenRef.current.add(u.id);
          const createdAt = new Date(u.created_at);
          if (Date.now() - createdAt.getTime() < 60000) {
            setBanner({ name: u.display_name || 'Someone', uid: u.id });
            setTimeout(() => setBanner(null), 6000);
          }
        });
      });

    // Real-time subscription for new users
    const channel = supabase.channel('new-users-banner')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'app_users' }, (payload) => {
        const u = payload.new as any;
        if (seenRef.current.has(u.id)) return;
        seenRef.current.add(u.id);
        setBanner({ name: u.display_name || 'Someone', uid: u.id });
        setTimeout(() => setBanner(null), 6000);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (!banner) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[99998] animate-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-3 bg-black/95 backdrop-blur-xl border border-white/15 rounded-full px-5 py-3 shadow-2xl">
        <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        <p className="text-xs font-black text-white">
          <span className="text-white font-black">@{banner.name.replace(/\s/g, '_').toLowerCase()}</span> just joined — wanna check?
        </p>
        <button onClick={() => { setBanner(null); router.push('/network'); }}
          className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors ml-1">
          View →
        </button>
        <button onClick={() => setBanner(null)} className="text-white/30 hover:text-white ml-1">
          <span className="text-xs">✕</span>
        </button>
      </div>
    </div>
  );
}

// Top ad banner — shows most broadcast ad for a few seconds
function TopAdBanner() {
  const [ad, setAd] = React.useState<{ title: string; partner: string } | null>(null);
  const { supabase } = React.useMemo(() => {
    try { return { supabase: require('../../lib/supabase').supabase }; } catch { return { supabase: null }; }
  }, []);

  React.useEffect(() => {
    if (!supabase) return;
    // Fetch most broadcast (most impressions) active ad
    supabase.from('ads').select('title,partner_name,impressions').eq('is_active', true)
      .order('impressions', { ascending: false }).limit(1)
      .then(({ data }: any) => {
        if (data?.[0]) {
          setAd({ title: data[0].title, partner: data[0].partner_name });
          setTimeout(() => setAd(null), 5000);
        }
      });
  }, [supabase]);

  if (!ad) return null;

  return (
    <div className="fixed top-2 right-4 z-[99997] animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 shadow-xl max-w-[200px]">
        <div className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
        <p className="text-[9px] font-black text-white/80 truncate">{ad.title}</p>
      </div>
    </div>
  );
}

// Instagram-style create modal
function CreateModal({ ageGroup }: { ageGroup: string }) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const options = [
    { label: 'New Post', icon: BookImage, href: '/create-post', color: 'text-primary', desc: 'Photo or video to your feed' },
    { label: 'Story', icon: Clapperboard, href: '/create-post?type=story', color: 'text-white/70', desc: '24-hour story node' },
    { label: 'Reel', icon: Video, href: '/create-post?type=reel', color: 'text-white/70', desc: 'Short-form video reel' },
    { label: 'Record', icon: Camera, href: '/record-video', color: 'text-orange-400', desc: 'Record directly from camera' },
    { label: 'Go Live', icon: Radio, href: '/live-stream', color: 'text-red-400', desc: 'Start a live broadcast' },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex flex-col items-center gap-1 text-foreground/40 hover:text-primary transition-all active:scale-95"
      >
        <div className="h-10 w-10 rounded-2xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
          <Plus className="h-6 w-6 text-primary" />
        </div>
        <span className="text-[8px] font-black uppercase tracking-widest text-primary">Create</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-black border-white/10 rounded-[2.5rem] max-w-sm p-6 shadow-2xl">
          <DialogTitle className="text-sm font-black uppercase tracking-widest text-center mb-4">Create</DialogTitle>
          <div className="space-y-2">
            {options.map(opt => (
              <button
                key={opt.label}
                onClick={() => { setOpen(false); router.push(opt.href); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all border border-white/5"
              >
                <div className={`h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 ${opt.color}`}>
                  <opt.icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-black text-sm uppercase tracking-tight">{opt.label}</p>
                  <p className="text-[10px] text-white/40 font-medium">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

type ProtocolStatus = 'MISSION_REQUIRED' | 'AUTHORIZED' | 'ENTERTANING' | 'EDU_LIMIT';

const ENTERTAINMENT_LIMIT = 3600; // 1 hour entertainment
const EDUCATIONAL_LIMIT = 1800;   // 30 minutes educational

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

function MobileSwipeHandler({ children }: { children: React.ReactNode }) {
  const { setOpenMobile, isMobile, openMobile } = useSidebar();
  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile || touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);

    // Only trigger if horizontal swipe is dominant (not a scroll)
    if (dy > Math.abs(dx)) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    // Swipe right from left half → open
    if (!openMobile && dx > 60 && touchStartX.current < 160) {
      setOpenMobile(true);
    }
    // Swipe left anywhere when open → close
    if (openMobile && dx < -60) {
      setOpenMobile(false);
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div
      className="flex-1 flex flex-col min-h-screen w-full relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull handle — visible on mobile when sidebar is closed */}
      {isMobile && !openMobile && (
        <button
          aria-label="Open menu"
          onClick={() => setOpenMobile(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-[70] flex items-center justify-center w-5 h-16 bg-primary/80 backdrop-blur-md rounded-r-xl shadow-lg active:scale-95 transition-all"
        >
          <div className="flex flex-col gap-1">
            <div className="w-1 h-1 rounded-full bg-white/80" />
            <div className="w-1 h-1 rounded-full bg-white/80" />
            <div className="w-1 h-1 rounded-full bg-white/80" />
          </div>
        </button>
      )}
      {children}
    </div>
  );
}

// ─── Back Button — navigates to previous page in history ─────────────────────
function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      aria-label="Go back"
      className="h-8 w-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10 shrink-0"
    >
      <ArrowLeft className="h-4 w-4 text-white/70" />
    </button>
  );
}

export default function AppLayout({ 
  children,
}: { 
  children: React.ReactNode;
}) {
  const urlAgeGroup = undefined;
  
  const educationalPaths = ['/learning-hub', '/announcements', '/assignments', '/competitions', '/discussions', '/settings', '/activity', '/security', '/video-bank', '/network', '/search', '/adult-guidance'];

  const [mounted, setMounted] = React.useState(false);
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = React.useState(true);
  
  const [protocolStatus, setProtocolStatus] = React.useState<ProtocolStatus>('AUTHORIZED');
  const [remainingSeconds, setRemainingSeconds] = React.useState(ENTERTAINMENT_LIMIT);
  const [eduRemainingSeconds, setEduRemainingSeconds] = React.useState(EDUCATIONAL_LIMIT);
  const [themeVariant, setThemeVariant] = React.useState(0);
  const [showBranding, setShowBranding] = React.useState(false);
  const [navCollapsed, setNavCollapsed] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    // Generate new random theme variant on mount (changes each session)
    setThemeVariant(Math.floor(Math.random() * 6));
  }, []);

  // Save new theme to Supabase whenever user logs in fresh
  React.useEffect(() => {
    if (!user || !mounted) return;
    const newVariant = Math.floor(Math.random() * 6);
    setThemeVariant(newVariant);
    // Persist to Supabase so all devices get same theme this session
    updateDocNonBlocking(docRef('users', user.uid), { themeVariant: newVariant });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]); // only fires when user changes (new login)

  React.useEffect(() => {
    if (user && mounted) {
      const hasSeenBranding = sessionStorage.getItem('stark-b-branding-seen');
      if (!hasSeenBranding) {
        setShowBranding(true);
        sessionStorage.setItem('stark-b-branding-seen', 'true');
      }
    }
  }, [user, mounted]);

  React.useEffect(() => {
    if (mounted) {
        window.dispatchEvent(new CustomEvent('stark-b-timer-sync', { 
            detail: { remainingSeconds, protocolStatus } 
        }));
    }
  }, [remainingSeconds, protocolStatus, mounted]);

  React.useEffect(() => {
    const handleEngagement = () => {
        setProtocolStatus('ENTERTANING');
        setRemainingSeconds(prev => prev > 0 ? prev : ENTERTAINMENT_LIMIT);
    };
    const handleMission = () => {
        setProtocolStatus('AUTHORIZED');
        setEduRemainingSeconds(prev => prev > 0 ? prev : EDUCATIONAL_LIMIT);
    };
    const handleEduReset = () => {
        setProtocolStatus('AUTHORIZED');
        setEduRemainingSeconds(EDUCATIONAL_LIMIT);
    };
    window.addEventListener('stark-b-entertainment-engaged', handleEngagement);
    window.addEventListener('stark-b-mission-complete', handleMission);
    window.addEventListener('stark-b-edu-reset', handleEduReset);
    return () => {
        window.removeEventListener('stark-b-entertainment-engaged', handleEngagement);
        window.removeEventListener('stark-b-mission-complete', handleMission);
        window.removeEventListener('stark-b-edu-reset', handleEduReset);
    };
  }, []);

  // Entertainment countdown — 1 hour
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (protocolStatus === 'ENTERTANING') {
      if (remainingSeconds > 0) {
        interval = setInterval(() => setRemainingSeconds(prev => prev - 1), 1000);
      } else {
        setProtocolStatus('MISSION_REQUIRED');
      }
    }
    return () => clearInterval(interval);
  }, [protocolStatus, remainingSeconds]);

  // Educational countdown — 30 minutes (only while on educational paths)
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    const isEduPath = educationalPaths.some(p => pathname.startsWith(p));
    if (protocolStatus === 'AUTHORIZED' && isEduPath) {
      if (eduRemainingSeconds > 0) {
        interval = setInterval(() => setEduRemainingSeconds(prev => prev - 1), 1000);
      } else {
        setProtocolStatus('EDU_LIMIT');
      }
    }
    return () => clearInterval(interval);
  }, [protocolStatus, eduRemainingSeconds, pathname]);

  React.useEffect(() => {
    if (!user || !mounted) {
        if (!user && mounted && !isUserLoading) setProfileLoading(false);
        return;
    }
    const syncProfile = async () => {
        try {
            const { data } = await supabase.from('app_users').select('*').eq('id', user.uid).single();
            if (data) {
                setUserProfile(data as UserProfile);
                if (typeof data.themeVariant === 'number') {
                  setThemeVariant(data.themeVariant);
                }
            } else {
                setUserProfile(null);
            }
        } catch (error) {
            console.warn("Profile localization failed.");
        } finally {
            setProfileLoading(false);
        }
    };
    syncProfile();
  }, [user, mounted, isUserLoading]);

  React.useEffect(() => {
    if (!mounted || isUserLoading) return;
    if (!user) {
      const publicPaths = ['/sign-in', '/sign-up', '/add-phone', '/auth/', '/'];
      if (!publicPaths.some(p => pathname.startsWith(p))) {
        router.replace('/sign-in');
      }
      return;
    }
    // Wait for profile to load before routing
    if (profileLoading) return;
    const isAuthFlow = ['/sign-in', '/sign-up', '/add-phone'].includes(pathname) || pathname.startsWith('/auth/');
    if (userProfile?.age_group) {
      if (isAuthFlow || pathname === '/' || pathname === '/select-age') {
        router.replace(`/HomeTon/${userProfile.age_group}`);
      }
    } else if (!isAuthFlow) {
      // User logged in but no age_group — send to sign-up to complete profile
      router.replace('/sign-up');
    }
  }, [user, userProfile, isUserLoading, profileLoading, router, pathname, mounted]);

  if (!mounted) return null;

  const isAuthFlow = ['/sign-in', '/sign-up', '/add-phone'].includes(pathname);
  
  if (isUserLoading || (user && profileLoading)) {
     if (isAuthFlow || pathname === '/') return null;
     return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-6 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="font-headline text-2xl font-black uppercase mt-4">Synchronizing Node</h2>
      </div>
    );
  }

  if (isAuthFlow || pathname === '/') return <div className={`theme-${userProfile?.age_group || '14-17'}-v${themeVariant}`}>{children}</div>;

  const ageGroup = userProfile?.age_group || '14-17';
  const isEducationalNode = educationalPaths.some(path => pathname.startsWith(path));
  const shouldShowLockdown = (protocolStatus === 'MISSION_REQUIRED' && !isEducationalNode) || (protocolStatus === 'EDU_LIMIT' && isEducationalNode);
  // Active timer to show in header
  const activeTimer = protocolStatus === 'ENTERTANING' ? remainingSeconds : (isEducationalNode ? eduRemainingSeconds : null);

  return (
    <div className={`theme-${ageGroup}-v${themeVariant} min-h-screen bg-background`}>
      <SidebarProvider>
        <AppSidebar 
          remainingSeconds={protocolStatus === 'ENTERTANING' ? remainingSeconds : eduRemainingSeconds} 
          ageGroup={ageGroup}
          protocolStatus={protocolStatus}
        />
        <SidebarInset className="flex flex-col relative overflow-hidden bg-background">
          <header className={cn(
              "flex md:hidden items-center justify-between px-4 py-3 sticky top-0 nga-header backdrop-blur-xl z-[60]",
              pathname.startsWith('/HomeTon') ? "hidden" : "flex"
            )}>
              <div className="flex items-center gap-2">
                <BackButton />
                <Logo className="scale-75 origin-left" />
              </div>
              <div className="flex items-center gap-4">
                  {activeTimer !== null && (
                      <div className={`px-3 py-1 rounded-full border text-[10px] font-black tabular-nums shadow-lg ${protocolStatus === 'ENTERTANING' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'}`}>
                          {Math.floor(activeTimer / 60)}:{String(activeTimer % 60).padStart(2, '0')}
                      </div>
                  )}
                  <ThemeToggle />
                  {user && (
                    <NotificationBell
                      userId={user.uid}
                      userName={userProfile?.displayName || user.displayName || ''}
                      userAvatar={userProfile?.profilePicture || user.photoURL || ''}
                    />
                  )}
              </div>
          </header>

          <MobileSwipeHandler>
              <main className={cn(
                  "flex-1 overflow-y-auto relative z-10 pb-24 md:pb-0 flex flex-col items-center",
                  pathname.startsWith('/HomeTon') ? "p-0" : "p-4 sm:p-6 lg:p-10"
              )}>
                 <div className={cn("w-full", pathname.startsWith('/HomeTon') ? "" : "max-w-2xl")}>
                     {children}
                 </div>

                 <footer className="fixed bottom-0 left-0 right-0 md:hidden z-[60]">
                      {/* Collapse handle */}
                      <div className="flex justify-center">
                        <button
                          onClick={() => setNavCollapsed(p => !p)}
                          className="nga-card border rounded-full px-6 py-1 mb-1 shadow-lg"
                        >
                          <div className={cn("w-8 h-0.5 bg-foreground/20 rounded-full transition-transform", navCollapsed ? "rotate-180" : "")} />
                        </button>
                      </div>
                      {/* Instagram-style bottom nav — icons only */}
                      <div className={cn(
                        "nga-nav flex items-center justify-around px-6 transition-all duration-300 overflow-hidden",
                        navCollapsed ? "h-0 border-none" : "h-14"
                      )}>
                          <Link href={`/HomeTon/${ageGroup}`} className={cn("flex items-center justify-center h-10 w-10 transition-all active:opacity-50", pathname.startsWith('/HomeTon') ? "text-foreground" : "text-muted-foreground")}>
                              <Home className={cn("h-6 w-6", pathname.startsWith('/HomeTon') ? "stroke-[2.5]" : "stroke-[1.5]")} />
                          </Link>
                          <Link href="/search" className={cn("flex items-center justify-center h-10 w-10 transition-all active:opacity-50", pathname === '/search' ? "text-foreground" : "text-muted-foreground")}>
                              <Search className={cn("h-6 w-6", pathname === '/search' ? "stroke-[2.5]" : "stroke-[1.5]")} />
                          </Link>
                          <CreateModal ageGroup={ageGroup} />
                          <Link href="/learning-hub" className={cn("flex items-center justify-center h-10 w-10 transition-all active:opacity-50", pathname === '/learning-hub' ? "text-foreground" : "text-muted-foreground")}>
                              <GraduationCap className={cn("h-6 w-6", pathname === '/learning-hub' ? "stroke-[2.5]" : "stroke-[1.5]")} />
                          </Link>
                          <Link href="/settings" className="flex items-center justify-center transition-all active:opacity-50">
                              <div className={cn("h-7 w-7 rounded-full overflow-hidden border-2 transition-all", pathname === '/settings' ? "border-foreground" : "border-transparent")}>
                                {(userProfile?.profilePicture || user?.photoURL) ? (
                                  <img
                                    src={userProfile?.profilePicture || user?.photoURL || ''}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-pink-500 to-blue-500 flex items-center justify-center">
                                    <span className="text-white font-black text-xs">
                                      {(userProfile?.displayName || user?.displayName || 'U')[0].toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                          </Link>
                      </div>
                 </footer>

                 {userProfile?.isBreached && pathname !== '/security' && (
                     <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-md">
                       <LockdownOverlay message={"Node suspension active."} />
                     </div>
                 )}
                 
                 {shouldShowLockdown && (
                     <div className="fixed inset-0 z-[9998] bg-background/80 backdrop-blur-md">
                       <TimesUp mode={protocolStatus === 'EDU_LIMIT' ? 'educational' : 'entertainment'} />
                     </div>
                 )}
                 {/* First-time onboarding tour */}
                 {user && <OnboardingTour />}
                 {/* Presence tracker — registers user online in Supabase */}
                 {user && (
                   <PresenceTracker
                     userId={user.uid}
                     userName={userProfile?.displayName || user.displayName || ''}
                     userAvatar={userProfile?.profilePicture || user.photoURL || ''}
                   />
                 )}
                 {/* New user join notification */}
                 <NewUserBanner />
                 {/* Top ad banner */}
                 <TopAdBanner />
                 {/* PWA install banner */}
                 <InstallBanner />
              </main>
          </MobileSwipeHandler>
        </SidebarInset>
      </SidebarProvider>

      <Dialog open={showBranding} onOpenChange={setShowBranding}>
        <DialogContent className="bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-900 border-purple-500/30 rounded-[3rem] max-w-md p-8 text-center shadow-2xl">
          <DialogTitle className="sr-only">BRAINEXSTARK Branding</DialogTitle>
          <div className="space-y-5">
            <div className="mx-auto h-20 w-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl">
              <Zap className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tighter dynamic-text-mesh font-headline">
                Made by BRAINEXSTARK COMPANIES
              </h2>
              <p className="text-sm font-medium italic text-white/50">Connecting communities across the world.</p>
            </div>
            <div className="pt-4 border-t border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">Follow us</p>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { label: 'Instagram', href: 'https://instagram.com/brainexstark',  bg: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400', logo: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png' },
                  { label: 'TikTok',    href: 'https://tiktok.com/@brainexstark',    bg: 'bg-black border border-white/20',                                logo: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png' },
                  { label: 'Facebook',  href: 'https://facebook.com/brainexstark',   bg: 'bg-[#1877F2]',                                                   logo: 'https://cdn-icons-png.flaticon.com/512/145/145802.png' },
                  { label: 'YouTube',   href: 'https://youtube.com/@brainexstark',   bg: 'bg-[#FF0000]',                                                   logo: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png' },
                  { label: 'WhatsApp',  href: 'https://wa.me/brainexstark',          bg: 'bg-[#25D366]',                                                   logo: 'https://cdn-icons-png.flaticon.com/512/733/733585.png' },
                  { label: 'X',         href: 'https://x.com/brainexstark',          bg: 'bg-black border border-white/20',                                logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968830.png' },
                ] as const).map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    className={cn('flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:scale-105 transition-transform', s.bg)}>
                    <img src={s.logo} alt={s.label} className="h-7 w-7 object-contain" />
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">{s.label}</span>
                  </a>
                ))}
              </div>
            </div>
            <Button onClick={() => setShowBranding(false)}
              className="w-full h-12 rounded-2xl font-black uppercase shadow-xl bg-white text-black hover:bg-white/90 border-none">
              Get Started 🚀
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}