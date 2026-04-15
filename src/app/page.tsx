'use client';

import * as React from 'react';
import { Logo } from '../components/logo';
import { Button } from '../components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Skeleton } from '../components/ui/skeleton';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '../firebase';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '../lib/types';

const LANDING_STORIES = [
  { id: 'story-1', url: 'https://www.youtube.com/shorts/2GeQRqF11HM', imageUrl: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8', hint: 'science junior' },
  { id: 'story-2', url: 'https://www.youtube.com/watch?v=QnC6R6Yx0yE', imageUrl: 'https://images.unsplash.com/photo-1454789548928-9efd52dc4031', hint: 'space explorer' },
  { id: 'story-3', url: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ', imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b', hint: 'music teacher' },
];

export default function Home() {
  const [mounted, setMounted] = React.useState(false);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted && !isUserLoading && user && !profileLoading) {
      if (userProfile?.ageGroup) {
        router.replace(`/HomeTon/${userProfile.ageGroup}`);
      } else if (userProfile === null) {
          router.replace('/select-age');
      }
    }
  }, [user, isUserLoading, userProfile, profileLoading, router, mounted]);

  if (!mounted) {
    return null; 
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background text-foreground" suppressHydrationWarning>
      <header className="sticky top-0 z-50 flex w-full items-center justify-between p-4 sm:p-6 lg:px-12 border-b bg-background/80 backdrop-blur-md">
        <Logo />
        <div className="flex items-center gap-4">
          {!isUserLoading && !user ? (
            <>
              <Link href="/sign-up">
                <Button className="font-bold px-6">Sign Up</Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" className="font-bold px-6">Log In</Button>
              </Link>
            </>
          ) : (
            <div className="h-10 w-24 flex items-center justify-center">
                <Skeleton className="h-full w-full rounded-md" />
            </div>
          )}
        </div>
      </header>
      
      <div className="w-full max-w-6xl flex flex-col space-y-16 px-6 py-12 sm:px-8">
        <section className="space-y-4 text-center max-w-4xl mx-auto py-12">
          <h1 className="font-headline text-5xl font-bold tracking-tight sm:text-7xl bg-gradient-to-b from-primary to-primary/60 bg-clip-text text-transparent uppercase">
            Welcome to NGA Hub
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl font-medium italic">
            The next-generation platform for high-performance learning, entertainment, and creativity.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="font-headline text-2xl font-bold px-2 uppercase tracking-widest text-primary">Latest Community Stories</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {LANDING_STORIES.map((story) => (
                <a key={story.id} href={story.url} target="_blank" rel="noopener noreferrer" className="block relative aspect-square rounded-3xl overflow-hidden border-2 border-primary/10 group shadow-2xl transition-transform hover:scale-105">
                    <Image
                        src={story.imageUrl}
                        alt="Story"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        data-ai-hint={story.hint}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </a>
              ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="font-headline text-2xl font-bold px-2 uppercase tracking-widest text-accent">Featured Superdatabase Content</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-4">
                      <Skeleton className="h-40 w-full rounded-3xl" />
                      <div className="space-y-2">
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-2/3" />
                      </div>
                  </div>
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}
