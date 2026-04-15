'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Hourglass, Lightbulb, BookOpen, ShieldCheck, PlayCircle } from "lucide-react";
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '../firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '../lib/types';

interface TimesUpProps {
  mode?: 'entertainment' | 'educational';
}

export function TimesUp({ mode = 'entertainment' }: TimesUpProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: profile } = useDoc<UserProfile>(userProfileRef);
  const isEdu = mode === 'educational';

  return (
    <div className="flex h-full w-full items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-700">
      <Card className="w-full max-w-lg text-center border-2 border-primary/20 bg-card/40 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.3)] rounded-[3rem] overflow-hidden">
        <div className={`h-2 w-full bg-gradient-to-r ${isEdu ? 'from-orange-500 via-yellow-400 to-orange-500' : 'from-primary via-accent to-primary'} animate-pulse`} />
        <CardHeader className="pt-12">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary border-2 border-primary/20 shadow-inner group">
            <Hourglass className="h-12 w-12 group-hover:rotate-180 transition-transform duration-1000" />
          </div>
          <CardTitle className="font-headline text-4xl font-black uppercase tracking-tighter dynamic-text-mesh">
            {isEdu ? 'Study Break Time!' : 'Entertainment Limit Reached'}
          </CardTitle>
          <CardDescription className="text-sm font-black uppercase tracking-[0.2em] opacity-40 pt-2">
            {isEdu ? '30-Minute Educational Session Complete' : '1-Hour Entertainment Session Complete'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-10 space-y-10">
          <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6">
            <p className="text-lg text-foreground/80 italic font-medium leading-relaxed">
              {isEdu
                ? '"Great work! You\'ve completed your 30-minute study session. Take a short break, then come back stronger."'
                : '"The STARK-B legacy is built on continuous high-performance learning. Synchronize with your educational nodes to maintain node workability."'}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {isEdu ? (
              <>
                <Link href={`/HomeTon/${profile?.ageGroup || '10-16'}`} className="w-full">
                  <Button size="lg" className="w-full h-16 rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl shadow-primary/30 text-sm group"
                    onClick={() => window.dispatchEvent(new CustomEvent('stark-b-entertainment-engaged'))}>
                    <PlayCircle className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" />
                    Switch to Entertainment
                  </Button>
                </Link>
                <Link href="/learning-hub" className="w-full">
                  <Button size="lg" variant="outline" className="w-full h-14 rounded-[1.5rem] font-black uppercase tracking-widest text-sm group border-white/10"
                    onClick={() => window.dispatchEvent(new CustomEvent('stark-b-edu-reset'))}>
                    <BookOpen className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                    Continue Learning
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/learning-hub" className="w-full">
                  <Button size="lg" className="w-full h-16 rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl shadow-primary/30 text-sm group">
                    <BookOpen className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" />
                    Enter Educational Portal
                  </Button>
                </Link>
                {profile?.ageGroup === '16-plus' && (
                  <Link href="/adult-guidance" className="w-full">
                    <Button size="lg" variant="secondary" className="w-full h-16 rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl shadow-accent/20 text-sm group border-2 border-accent/20">
                      <ShieldCheck className="mr-3 h-6 w-6 text-accent group-hover:scale-110 transition-transform" />
                      Adult Guidance & Parenting
                    </Button>
                  </Link>
                )}
                <Link href="/discover" className="w-full">
                  <Button variant="ghost" size="lg" className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px] opacity-60 hover:opacity-100 hover:bg-white/5">
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Access Discovery Matrix
                  </Button>
                </Link>
              </>
            )}
          </div>
        </CardContent>
        <div className="bg-black/20 py-4">
          <p className="text-[9px] font-black uppercase tracking-widest opacity-30">STARK-B Automated Session Governance</p>
        </div>
      </Card>
    </div>
  );
}
