'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppSidebar } from '../../components/app-sidebar';
import { SidebarProvider, SidebarInset, useSidebar } from '../../components/ui/sidebar';
import { useUser, useFirestore } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '../../lib/types';
import { Loader2, Heart, Bell, Plus, Home, Search, GraduationCap, Instagram, Facebook, MessageSquareText, Zap, Power } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LockdownOverlay } from '../../components/lockdown-overlay';
import { TimesUp } from '../../components/times-up';
import { Logo } from '../../components/logo';
import Link from 'next/link';
import { Avatar, AvatarImage } from '../../components/ui/avatar';
import { useToast } from '../../hooks/use-toast';
import { Dialog, DialogContent, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";

type ProtocolStatus = 'MISSION_REQUIRED' | 'AUTHORIZED' | 'ENTERTANING';

const SESSION_LIMIT = 1800; // STARK-B STRICT GOVERNANCE LIMIT (30 Minutes)

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

function MobileSwipeHandler({ children }: { children: React.ReactNode }) {
  const { setOpenMobile, isMobile, openMobile } = useSidebar();
  const [touchStart, setTouchStart] = React.useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile || openMobile) return;
    const x = e.touches[0].clientX;
    if (x < 30) {
      setTouchStart(x);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile || touchStart === null || openMobile) return;
    const x = e.changedTouches[0].clientX;
    const deltaX = x - touchStart;
    if (deltaX > 50) {
      setOpenMobile(true);
    }
    setTouchStart(null);
  };

  return (
    <div 
      className="flex-1 flex flex-col min-h-screen w-full relative" 
      onTouchStart={handleTouchStart} 
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

export default function AppLayout({ 
  children,
  params 
}: { 
  children: React.ReactNode;
  params: Promise<{ ageGroup?: string }>;
}) {
  const { ageGroup: urlAgeGroup } = React.use(params);
  
  const [mounted, setMounted] = React.useState(false);
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = React.useState(true);
  
  const [protocolStatus, setProtocolStatus] = React.useState<ProtocolStatus>('AUTHORIZED');
  const [remainingSeconds, setRemainingSeconds] = React.useState(SESSION_LIMIT);
  const [themeVariant, setThemeVariant] = React.useState(0);
  const [showBranding, setShowBranding] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setThemeVariant(Math.floor(Math.random() * 6));
  }, []);

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
        setRemainingSeconds(SESSION_LIMIT);
    };
    const handleMission = () => {
        setProtocolStatus('AUTHORIZED');
        setRemainingSeconds(SESSION_LIMIT);
    };
    window.addEventListener('stark-b-entertainment-engaged', handleEngagement);
    window.addEventListener('stark-b-mission-complete', handleMission);
    return () => {
        window.removeEventListener('stark-b-entertainment-engaged', handleEngagement);
        window.removeEventListener('stark-b-mission-complete', handleMission);
    };
  }, []);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (protocolStatus === 'ENTERTANING' && remainingSeconds > 0) {
        interval = setInterval(() => {
            setRemainingSeconds(prev => prev - 1);
        }, 1000);
    } else if (remainingSeconds === 0 && protocolStatus === 'ENTERTANING') {
        setProtocolStatus('MISSION_REQUIRED');
    }
    return () => clearInterval(interval);
  }, [protocolStatus, remainingSeconds]);

  React.useEffect(() => {
    if (!user || !firestore || !mounted) {
        if (!user && mounted) setProfileLoading(false);
        return;
    }
    const syncProfile = async () => {
        try {
            const docRef = doc(firestore, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setUserProfile(docSnap.data() as UserProfile);
            }
        } catch (error) {
            console.warn("Profile localization failed.");
        } finally {
            setProfileLoading(false);
        }
    };
    syncProfile();
  }, [user, firestore, mounted]);

  React.useEffect(() => {
    if (!mounted || isUserLoading) return;
    if (!user) {
      const publicPaths = ['/sign-in', '/sign-up', '/'];
      if (!publicPaths.includes(pathname)) {
        router.replace('/sign-in');
      }
      return;
    }
    if (!profileLoading && userProfile) {
      const isAuthFlow = ['/sign-in', '/sign-up', '/select-age', '/add-phone'].includes(pathname);
      if (!userProfile.ageGroup) {
        if (pathname !== '/select-age') router.replace('/select-age');
        return; 
      }
      if (urlAgeGroup && userProfile.ageGroup !== urlAgeGroup) {
        router.replace(pathname.replace(urlAgeGroup, userProfile.ageGroup));
      } else if (isAuthFlow || pathname === '/') {
         router.replace(`/HomeTon/${userProfile.ageGroup}`);
      }
    }
  }, [user, userProfile, isUserLoading, profileLoading, router, pathname, urlAgeGroup, mounted]);

  if (!mounted) return null;

  const isAuthFlow = ['/sign-in', '/sign-up', '/select-age', '/add-phone'].includes(pathname);
  
  if (isUserLoading || (user && profileLoading)) {
     if (isAuthFlow || pathname === '/') return null;
     return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-6 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="font-headline text-2xl font-black uppercase mt-4">Synchronizing Node</h2>
      </div>
    );
  }

  if (isAuthFlow || pathname === '/') return <div className={`theme-${userProfile?.ageGroup || '10-16'}-v${themeVariant}`}>{children}</div>;

  const ageGroup = userProfile?.ageGroup || urlAgeGroup || 'under-10';
  const educationalPaths = ['/learning-hub', '/announcements', '/assignments', '/competitions', '/discussions', '/settings', '/activity', '/security', '/video-bank', '/network', '/search', '/adult-guidance'];
  const isEducationalNode = educationalPaths.some(path => pathname.startsWith(path));
  const shouldShowLockdown = protocolStatus === 'MISSION_REQUIRED' && !isEducationalNode;

  return (
    <div className={`theme-${ageGroup}-v${themeVariant} min-h-screen bg-background`}>
      <SidebarProvider>
        <AppSidebar 
          remainingSeconds={remainingSeconds} 
          ageGroup={ageGroup}
          protocolStatus={protocolStatus}
        />
        <SidebarInset className="flex flex-col relative overflow-hidden bg-background">
          <header className="flex md:hidden items-center justify-between p-4 sticky top-0 bg-background/80 backdrop-blur-xl z-[60] border-b border-white/5">
              <Logo className="scale-75 origin-left" />
              <div className="flex items-center gap-4">
                  {protocolStatus === 'ENTERTANING' && (
                      <div className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20 text-[10px] font-black tabular-nums text-primary shadow-lg">
                          {remainingSeconds}s
                      </div>
                  )}
                  <Link href="/favorites" className="text-foreground/60 hover:text-primary transition-colors">
                      <Heart className="h-6 w-6" />
                  </Link>
                  <button onClick={() => toast({ title: "System Synchronized" })} className="text-foreground/60 hover:text-primary transition-colors">
                      <Bell className="h-6 w-6" />
                  </button>
              </div>
          </header>

          <MobileSwipeHandler>
              <main className={cn(
                  "flex-1 overflow-y-auto relative z-10 pb-24 md:pb-0 flex flex-col items-center",
                  pathname.startsWith('/HomeTon') ? "p-0" : "p-4 sm:p-6 lg:p-10"
              )}>
                 <div className="w-full max-w-2xl">
                     {children}
                 </div>

                 <footer className="fixed bottom-0 left-0 right-0 h-20 bg-background/90 backdrop-blur-2xl border-t border-white/5 md:hidden z-[60] flex items-center justify-around px-6">
                      <Link href={`/HomeTon/${ageGroup}`} className={cn("transition-all", pathname.startsWith('/HomeTon') ? "text-primary" : "text-foreground/40")}>
                          <Home className="h-7 w-7" />
                      </Link>
                      <Link href="/search" className={cn("transition-all", pathname === '/search' ? "text-primary" : "text-foreground/40")}>
                          <Search className="h-7 w-7" />
                      </Link>
                      <Link href="/create-post" className="relative -top-6 h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent p-0.5 shadow-2xl flex items-center justify-center">
                          <div className="h-full w-full bg-background rounded-[14px] flex items-center justify-center">
                              <Plus className="h-8 w-8 text-primary" />
                          </div>
                      </Link>
                      <Link href="/learning-hub" className={cn("transition-all", pathname === '/learning-hub' ? "text-primary" : "text-foreground/40")}>
                          <GraduationCap className="h-7 w-7" />
                      </Link>
                      <Link href="/settings" className={cn("transition-all", pathname === '/settings' ? "text-primary" : "text-foreground/40")}>
                          <Avatar className={cn("h-7 w-7 border-2", pathname === '/settings' ? "border-primary" : "border-transparent")}>
                              <AvatarImage src={userProfile?.profilePicture || user?.photoURL || ''} />
                          </Avatar>
                      </Link>
                 </footer>

                 {userProfile?.isBreached && pathname !== '/security' && (
                     <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-md">
                       <LockdownOverlay message={"Node suspension active."} />
                     </div>
                 )}
                 
                 {shouldShowLockdown && (
                     <div className="fixed inset-0 z-[9998] bg-background/80 backdrop-blur-md">
                       <TimesUp />
                     </div>
                 )}
              </main>
          </MobileSwipeHandler>
        </SidebarInset>
      </SidebarProvider>

      <Dialog open={showBranding} onOpenChange={setShowBranding}>
        <DialogContent className="bg-slate-900 border-primary/20 rounded-[3rem] max-w-md p-10 text-center shadow-2xl">
          <DialogTitle className="sr-only">BRAINEXSTARK Branding</DialogTitle>
          <div className="space-y-6">
            <div className="mx-auto h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20 animate-pulse">
              <Zap className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-white font-headline">Made by BRAINEXSTARK COMPANIES</h2>
                <p className="text-sm font-medium italic text-muted-foreground">Synchronizing high-performance legacy nodes.</p>
            </div>
            <div className="space-y-4 pt-6 border-t border-white/5 text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Follow the Mission</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-pink-500" />
                  <span className="text-[10px] font-bold">brainexstark</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquareText className="h-4 w-4 text-purple-400" />
                  <span className="text-[10px] font-bold">brainexstark</span>
                </div>
                <div className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-blue-600" />
                  <span className="text-[10px] font-bold">brainexstark</span>
                </div>
                <div className="flex items-center gap-2">
                  <XIcon className="h-4 w-4 text-white" />
                  <span className="text-[10px] font-bold">brainexstark</span>
                </div>
              </div>
            </div>
            <Button onClick={() => setShowBranding(false)} className="w-full h-14 rounded-2xl font-black uppercase mt-4 shadow-xl animate-bg-color-sync border-none text-white">
              INITIALIZE ENVIRONMENT
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}