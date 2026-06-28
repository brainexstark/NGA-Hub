'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Film,
  Flame,
  LayoutGrid,
  PlusSquare,
  Satellite,
  Rss,
  BookOpen,
  Clapperboard,
  Settings,
  Radio,
  MessagesSquare,
  Shield,
  Trophy,
  Camera,
  Zap,
  LineChart,
  Search,
  Heart,
  Megaphone,
  ClipboardList,
  MessageSquareText,
  Users,
  GraduationCap,
  Download,
  Bot,
  Rocket,
  Atom,
  Sparkles,
  Box,
  ShieldAlert,
  Share2,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  MessageSquare,
  Phone,
  FileText,
  ArrowLeft
} from 'lucide-react';
import { Logo } from './logo';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar
} from './ui/sidebar';
import React from 'react';
import { X } from 'lucide-react';
import { useUser } from '../firebase';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../lib/types';
import { UsageTimer } from './usage-timer';
import { cn } from '../lib/utils';

const ADMIN_UID = "s1EFDYsBy3SryAxicoIivG46M353";

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const PinterestIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.965 1.406-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.53 2.169 1.706 2.169 2.047 0 3.623-2.158 3.623-5.27 0-2.756-1.979-4.684-4.81-4.684-3.276 0-5.199 2.457-5.199 4.996 0 1.011.389 2.097.876 2.568.096.094.11.176.081.285-.088.36-.285 1.16-.324 1.316-.052.208-.173.252-.399.156-1.49-.695-2.42-2.876-2.42-4.627 0-3.763 2.734-7.218 7.887-7.218 4.14 0 7.362 2.95 7.362 6.899 0 4.112-2.593 7.422-6.192 7.422-1.209 0-2.345-.628-2.735-1.369l-.746 2.842c-.27 1.029-1.001 2.319-1.492 3.11 1.132.349 2.322.539 3.558.539 6.622 0 11.988-5.367 11.988-11.987C23.988 5.367 18.621 0 12.017 0z"/>
  </svg>
);

const RedditIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.461 1.333-1.11 1.57.044.213.066.433.066.656 0 2.887-3.304 5.23-7.373 5.23-4.07 0-7.373-2.343-7.373-5.23 0-.21.022-.414.062-.615a1.755 1.755 0 0 1-1.118-1.611c0-.968.786-1.754 1.754-1.754.483 0 .906.195 1.214.504 1.194-.855 2.842-1.412 4.662-1.485l.813-3.818a.311.311 0 0 1 .255-.243l2.843.599a1.247 1.247 0 0 1 .951-.519zM10.252 13.392c-.603 0-1.093.49-1.093 1.093 0 .603.49 1.093 1.093 1.093.603 0 1.093-.49 1.093-1.093 0-.603-.49-1.093-1.093-1.093zm3.496 0c-.603 0-1.093.49-1.093 1.093 0 .603.49 1.093 1.093 1.093.603 0 1.093-.49 1.093-1.093 0-.603-.49-1.093-1.093-1.093zm-3.756 3.105c-.161 0-.326.066-.435.192-.547.632-1.329.632-1.877 0-.11-.126-.274-.192-.435-.192a.563.563 0 0 0-.44.924c.842.975 2.35.975 3.19 0a.563.563 0 0 0-.44-.924z"/>
  </svg>
);

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72 1.03 3.703 1.574 5.711 1.574h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export function AppSidebar({ remainingSeconds, ageGroup = 'under-10' }: { remainingSeconds?: number, ageGroup?: string, protocolStatus?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { user } = useUser();
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  
  const isUnder13 = ageGroup === 'under-10';
  const isAdmin = user?.uid === ADMIN_UID;

  React.useEffect(() => {
    if (user) {
      supabase.from('app_users').select('*').eq('id', user.uid).single()
        .then(({ data }) => { if (data) setUserProfile(data as UserProfile); });
    }
  }, [user]);

  const mainMenuItems = [
    { href: `/HomeTon/${ageGroup}`, label: 'HomeTon', icon: isUnder13 ? Rocket : LayoutGrid },
    { href: '/stark-b-intelligence', label: 'Intelligence Hub', icon: isUnder13 ? Sparkles : Zap },
    { href: `/feed/${ageGroup}`, label: 'Super Feed', icon: isUnder13 ? Box : Rss },
    { href: '/search', label: 'Intelligence Node', icon: isUnder13 ? Atom : Search },
    { href: '/documents', label: 'Document Sync', icon: FileText },
    { href: '/favorites', label: 'Legacy Vault', icon: isUnder13 ? Heart : Heart },
    { href: '/network', label: 'Network Lineage', icon: isUnder13 ? Users : Users },
    { href: `/stories/${ageGroup}`, label: 'Legacy Stories', icon: isUnder13 ? BookOpen : BookOpen },
    { href: `/reels/${ageGroup}`, label: 'Reels Gallery', icon: isUnder13 ? Clapperboard : Clapperboard },
    { href: '/discover', label: 'Discovery Node', icon: isUnder13 ? Satellite : Satellite },
    { href: '/chat', label: 'Secure Chat', icon: isUnder13 ? MessagesSquare : MessagesSquare },
    { href: '/live-stream', label: 'Live Broadcast', icon: isUnder13 ? Radio : Radio },
  ];

  if (!isUnder13) {
    mainMenuItems.push({ href: '/other-sm-platforms', label: 'Other Platforms', icon: Share2 });
  }

  const educationalMenuItems = [
    { href: '/learning-hub', label: 'Learning Hub', icon: GraduationCap },
    { href: '/announcements', label: 'Announcements', icon: Megaphone },
    { href: '/assignments', label: 'Assignments', icon: ClipboardList },
    { href: '/competitions', label: 'Competitions', icon: Trophy },
    { href: '/discussions', label: 'Discussion Hub', icon: MessageSquareText },
  ];
  
  const shouldShowLeaderboard = ageGroup === 'under-10' || ageGroup === '10-16';
  if (shouldShowLeaderboard) {
    mainMenuItems.splice(2, 0, { href: '/leaderboard', label: 'Leaderboard', icon: Trophy });
  }

  const createMenuItems = [
    { href: '/create-post', label: 'New Post', icon: PlusSquare },
    { href: '/create-channel', label: 'Launch Channel', icon: PlusSquare },
  ];
  
  if (ageGroup !== 'under-10') {
    createMenuItems.push({ href: '/record-video', label: 'Record Legacy', icon: Camera });
  }

  const toolsMenuItems = [
    { href: '/ai-tools', label: 'AI Suite', icon: Bot },
    { href: '/live-lesson', label: 'Live Lesson', icon: Flame },
    { href: '/video-bank', label: 'Video Bank', icon: Film },
    { href: '/offline-reels', label: 'Offline Reels', icon: Download },
    { href: '/office', label: 'Office Apps', icon: FileText },
    { href: '/install', label: 'Install Hub', icon: Download },
  ];

  const accountMenuItems = [
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/activity', label: 'Analytics', icon: LineChart },
    { href: '/security', label: 'Security Node', icon: Shield },
  ];

  if (isAdmin) {
      accountMenuItems.push({ href: '/moderation', label: 'Moderation Hub', icon: ShieldAlert });
  }

  const renderMenuItems = (items: {href: string, label: string, icon: React.ElementType}[], section: string) => {
    return items.map((item) => {
      const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
      return (
        <SidebarMenuItem key={item.label}>
          <Link href={item.href} onClick={() => setOpenMobile(false)}>
            <SidebarMenuButton
              isActive={isActive}
              tooltip={item.label}
              className={cn(
                "py-2.5 px-3 rounded-lg transition-colors duration-150 group",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
              )} />
              <span className={cn(
                "text-sm ml-3 transition-colors",
                isActive ? "font-semibold text-foreground" : "font-normal text-muted-foreground group-hover:text-foreground"
              )}>
                {item.label}
              </span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      );
    });
  }

  return (
    <Sidebar collapsible="offcanvas" side="left" className="nga-nav border-r border-border">
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Back arrow — navigates to previous page */}
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all active:scale-90 border border-white/5"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <Logo className="scale-110" />
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={() => setOpenMobile(false)}
            className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all active:scale-90"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 pb-20">
        <SidebarMenu className="space-y-0.5">
          {/* Section: Main */}
          <div className="px-3 pt-4 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
            Home
          </div>
          {renderMenuItems(mainMenuItems, 'main')}

          {/* Section: Learn */}
          <div className="px-3 pt-5 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
            Learn
          </div>
          {renderMenuItems(educationalMenuItems, 'educational')}

          {/* Section: Create */}
          <div className="px-3 pt-5 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
            Create
          </div>
          {renderMenuItems(createMenuItems, 'create')}

          {/* Section: Tools */}
          <div className="px-3 pt-5 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
            Tools
          </div>
          {renderMenuItems(toolsMenuItems, 'tools')}

          {/* Section: Account */}
          <div className="px-3 pt-5 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
            Account
          </div>
          {renderMenuItems(accountMenuItems, 'system')}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border mt-auto">
        <div className="flex flex-col gap-4">
            {/* Social links */}
            {!isUnder13 && (
                <div className="grid grid-cols-4 gap-3 pb-3 border-b border-border">
                    <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors flex justify-center" title="X"><XIcon className="h-4 w-4" /></a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors flex justify-center" title="Instagram"><Instagram className="h-4 w-4" /></a>
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors flex justify-center" title="Facebook"><Facebook className="h-4 w-4" /></a>
                    <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors flex justify-center" title="YouTube"><Youtube className="h-4 w-4" /></a>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors flex justify-center" title="LinkedIn"><Linkedin className="h-4 w-4" /></a>
                    <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors flex justify-center" title="Pinterest"><PinterestIcon className="h-4 w-4" /></a>
                    <a href="https://reddit.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors flex justify-center" title="Reddit"><RedditIcon className="h-4 w-4" /></a>
                    <a href="https://whatsapp.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors flex justify-center" title="WhatsApp"><WhatsAppIcon className="h-4 w-4" /></a>
                </div>
            )}

            {userProfile?.timerNotifications === true && (
                <UsageTimer remainingSeconds={remainingSeconds} />
            )}

            {/* User info */}
            {user && (
                <div className="flex items-center gap-2.5 px-1">
                    <div className="h-8 w-8 rounded-full bg-muted overflow-hidden shrink-0 border border-border">
                        {(userProfile?.profilePicture || user.photoURL) ? (
                            <img src={userProfile?.profilePicture || user.photoURL || ''} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-muted-foreground">
                                {(user.displayName || user.email || 'U')[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate">{user.displayName || 'NGA User'}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                </div>
            )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
