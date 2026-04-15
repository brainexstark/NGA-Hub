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
import { errorEmitter } from '../../firebase/error-emitter';
import { FirestorePermissionError } from '../../firebase/errors';

export default function SelectAgePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSelectAgeGroup = async (ageGroup: 'under-10' | '10-16' | '16-plus') => {
    if (!user || !firestore) {
      if (!user) {
        toast({ variant: 'destructive', title: 'Not logged in' });
        router.push('/sign-in');
      }
      return;
    }

    setIsUpdating(true);
    const userRef = doc(firestore, 'users', user.uid);
    const userData = { ageGroup };
    
    setDoc(userRef, userData, { merge: true })
      .then(() => {
        toast({ title: 'Age group saved!' });
        router.push(`/HomeTon/${ageGroup}`);
      })
      .catch(async () => {
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
            requestResourceData: userData,
        });
        errorEmitter.emit('permission-error', permissionError);
        setIsUpdating(false);
      });
  };
  
  if (isUserLoading) {
      return (
          <div className="flex h-screen w-screen items-center justify-center bg-[#0a051a]">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
      )
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