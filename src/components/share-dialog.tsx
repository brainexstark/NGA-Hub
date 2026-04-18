'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Share2, Copy, MessageCircle, Twitter, Facebook, Check, Linkedin, Send as Telegram, Info, Globe } from "lucide-react";
import { useToast } from '../hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '../firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '../lib/types';

interface ShareDialogProps {
  title: string;
  url?: string;
  children: React.ReactNode;
}

/**
 * STARK-B Multi-Platform Sharing Node
 * Provides high-performance transmission links for external synchronization.
 * Gated for 10+ sectors.
 */
export function ShareDialog({ title, url, children }: ShareDialogProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [copied, setCopied] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  const profileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: profile } = useDoc<UserProfile>(profileRef);
  const isUnder10 = profile?.ageGroup === 'under-10';

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const shareUrl = url || (mounted ? window.location.href : '');
  const shareText = `Check out this node on NGA Hub: ${title}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: "Node Localized", description: "Link copied to buffer." });
    setTimeout(() => setCopied(false), 2000);
  };

  const platforms = [
    { name: 'WhatsApp', color: 'bg-green-500', href: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, icon: () => <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72 1.03 3.703 1.574 5.711 1.574h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
    { name: 'TikTok', color: 'bg-black border border-white/20', href: `https://www.tiktok.com/`, icon: () => <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg> },
    { name: 'Instagram', color: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400', href: `https://www.instagram.com/`, icon: () => <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
    { name: 'Facebook', color: 'bg-blue-600', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, icon: () => <Facebook className="h-5 w-5" /> },
    { name: 'X (Twitter)', color: 'bg-black border border-white/20', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, icon: () => <Twitter className="h-5 w-5" /> },
    { name: 'YouTube', color: 'bg-red-600', href: `https://www.youtube.com/`, icon: () => <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
    { name: 'Threads', color: 'bg-black border border-white/20', href: `https://www.threads.net/`, icon: () => <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 013.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65zm.36-13.09c-.109 0-.216.002-.321.006-1.126.063-2.015.37-2.57.876-.487.42-.733.973-.7 1.554.04.707.472 1.258 1.216 1.748.585.38 1.335.577 2.161.577.106 0 .213-.003.32-.01 1.096-.059 1.923-.49 2.458-1.28.545-.806.787-1.914.72-3.292a11.058 11.058 0 00-3.284-.179z"/></svg> },
    { name: 'Telegram', color: 'bg-sky-500', href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, icon: () => <Send className="h-5 w-5" /> },
    { name: 'LinkedIn', color: 'bg-blue-700', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, icon: () => <Linkedin className="h-5 w-5" /> },
  ];

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'NGA Hub',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or failure
      }
    }
  };

  if (!mounted) return <>{children}</>;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-primary/20 rounded-[3rem] max-w-md border-2 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
            <Share2 className="h-6 w-6 text-primary" /> Share Node
          </DialogTitle>
        </DialogHeader>
        
        {isUnder10 && (
            <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                    <Info className="h-3 w-3" /> Safety Protocol: Share via link only
                </p>
            </div>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 py-6">
          {platforms.map((p) => (
            <a key={p.name} href={p.href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
              <div className={`${p.color} h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <p.icon />
              </div>
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white/60 truncate w-full text-center">{p.name}</span>
            </a>
          ))}
        </div>

        <div className="space-y-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-1">Legacy Node Link</p>
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-2xl p-2 pl-4">
                <span className="text-[10px] font-medium text-white/40 truncate flex-1">{shareUrl}</span>
                <Button onClick={handleCopy} size="icon" className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
            {navigator.share && (
                <Button 
                    onClick={handleNativeShare}
                    variant="outline" 
                    className="w-full h-12 rounded-2xl border-white/10 text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/5"
                >
                    System Share Protocol
                </Button>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
