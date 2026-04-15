'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link as LinkIcon, Twitter, Instagram, Facebook, Youtube, Share2, Zap, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';

const socialPlatforms = [
  {
    name: 'X (formerly Twitter)',
    description: 'Real-time global commentary and high-performance news feeds.',
    url: 'https://x.com',
    icon: Twitter,
    color: 'text-white',
    bg: 'bg-black'
  },
  {
    name: 'Instagram',
    description: 'Visual storytelling and community synchronization nodes.',
    url: 'https://instagram.com',
    icon: Instagram,
    color: 'text-pink-500',
    bg: 'bg-pink-500/10'
  },
  {
    name: 'Facebook',
    description: 'Localized community networks and legacy relationship management.',
    url: 'https://facebook.com',
    icon: Facebook,
    color: 'text-blue-600',
    bg: 'bg-blue-600/10'
  },
  {
    name: 'YouTube',
    description: 'The primary video bank for global educational and entertainment assets.',
    url: 'https://youtube.com',
    icon: Youtube,
    color: 'text-red-600',
    bg: 'bg-red-600/10'
  },
];

export default function SocialPlatformsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const profileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: profile } = useDoc<UserProfile>(profileRef);

  React.useEffect(() => {
    if (profile && profile.ageGroup === 'under-10') {
        router.replace(`/HomeTon/${profile.ageGroup}`);
    }
  }, [profile, router]);

  return (
    <div className="container mx-auto space-y-10 animate-in fade-in duration-700 pt-6">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
            <Share2 className="h-3.5 w-3.5" /> External Network Matrix
        </div>
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter dynamic-text-mesh">Global Platforms</h1>
        <p className="text-muted-foreground text-xl font-medium italic max-w-3xl">
          Synchronize your activity with the wider web. Access major social media nodes directly from the STARK-B environment.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 pb-32">
        {socialPlatforms.map((platform) => (
          <Card key={platform.name} className="flex flex-col glass-panel group transition-all duration-500 hover:-translate-y-2 hover:shadow-primary/20 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-10">
              <div className="flex items-center gap-6">
                <div className={`p-5 rounded-2xl group-hover:scale-110 transition-transform border border-white/5 ${platform.bg}`}>
                  <platform.icon className={`h-10 w-10 ${platform.color}`} />
                </div>
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-black uppercase tracking-tight">{platform.name}</CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Node Active</p>
                    </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow px-10 pb-10">
              <CardDescription className="text-lg font-medium italic leading-relaxed text-foreground/70">
                "{platform.description}"
              </CardDescription>
            </CardContent>
            <div className="p-10 pt-0">
              <Button asChild className="w-full h-16 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 group-hover:bg-primary transition-all">
                <a href={platform.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                  Initialize External Link <LinkIcon className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-6">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-primary/20 p-4 rounded-3xl shadow-2xl flex items-center gap-4">
              <ShieldCheck className="h-6 w-6 text-primary animate-pulse" />
              <p className="text-[9px] font-black uppercase tracking-widest text-white/60 leading-tight">
                  STARK-B Security Protocol: Navigation to external nodes is localized for mature sectors.
              </p>
          </div>
      </div>
    </div>
  );
}
