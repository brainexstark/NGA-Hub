'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AgeSelection } from '../../components/age-selection';
import { Logo } from '../../components/logo';
import { useUser, useFirestore } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '../../hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function SelectAgePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSelectAgeGroup = async (ageGroup: 'under-10' | '10-16' | '16-plus') => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not logged in', description: 'Please sign in first.' });
      router.push('/sign-in');
      return;
    }

    if (!firestore) {
      toast({ variant: 'destructive', title: 'Still connecting...', description: 'Please wait a moment and try again.' });
      return;
    }

    setIsUpdating(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, { 
        uid: user.uid,
        displayName: user.displayName || user.email || 'User',
        email: user.email,
        ageGroup 
      }, { merge: true });
      toast({ title: 'Age group saved!' });
      router.push(`/HomeTon/${ageGroup}`);
    } catch (err: any) {
      console.error('Age group save error:', err);
      toast({ 
        variant: 'destructive', 
        title: 'Save failed', 
        description: err?.message || 'Could not save age group. Please try again.' 
      });
      setIsUpdating(false);
    }
  };

  // Show spinner while auth or firestore is loading
  if (isUserLoading || (!firestore && user)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0a051a]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not logged in
  if (!isUserLoading && !user) {
    router.replace('/sign-in');
    return null;
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-[#0a051a] p-8">
      <div className="flex flex-col items-center space-y-12 text-center max-w-4xl">
        <Logo />
        <div className="space-y-4">
          <h1 className="font-headline text-4xl font-black uppercase tracking-tight sm:text-5xl md:text-6xl animate-text-color-sync">
            One Last Step
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl font-medium italic animate-text-color-sync">
            Please select your age group to personalize your high-performance experience.
          </p>
        </div>
        <AgeSelection onSelectAgeGroup={handleSelectAgeGroup} disabled={isUpdating} />
        {isUpdating && <Loader2 className="mt-8 h-8 w-8 animate-spin text-primary" />}
      </div>
    </main>
  );
}
