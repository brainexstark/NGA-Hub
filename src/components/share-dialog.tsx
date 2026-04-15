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
    { 
        name: 'WhatsApp', 
        icon: MessageCircle, 
        color: 'bg-green-500', 
        href: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}` 
    },
    { 
        name: 'X (Twitter)', 
        icon: Twitter, 
        color: 'bg-black', 
        href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}` 
    },
    { 
        name: 'Facebook', 
        icon: Facebook, 
        color: 'bg-blue-600', 
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` 
    },
  ];

  // Expanded platforms for 10+ sectors
  if (!isUnder10) {
    platforms.push(
        { 
            name: 'LinkedIn', 
            icon: Linkedin, 
            color: 'bg-blue-700', 
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` 
        },
        { 
            name: 'Telegram', 
            icon: Telegram, 
            color: 'bg-sky-500', 
            href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}` 
        },
        { 
            name: 'Reddit', 
            icon: Globe, 
            color: 'bg-orange-600', 
            href: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}` 
        }
    );
  }

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
                    <Info className="h-3 w-3" /> Safety Protocol: Limited Sharing Active
                </p>
            </div>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 py-6">
          {platforms.map((p) => (
            <a 
                key={p.name} 
                href={p.href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 group"
            >
                <div className={`${p.color} h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform border border-white/10`}>
                    <p.icon className="h-5 w-5 sm:h-6 sm:w-6" />
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
