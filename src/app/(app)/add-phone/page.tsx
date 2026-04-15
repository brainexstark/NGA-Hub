'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore, useFirebaseApp } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function AddPhonePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: 'destructive', title: 'You are not logged in.' });
      return;
    }
    if (!phoneNumber) {
      toast({ variant: 'destructive', title: 'Phone number cannot be empty.' });
      return;
    }

    setIsUpdating(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, { phoneNumber });
      toast({ title: 'Phone number saved!' });
      
      // Redirect to the root; the main layout will handle the final destination.
      router.push('/'); 
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to save phone number.' });
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isUserLoading) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }
  
  // This page is for logged-in users, but we show a simple layout
  // similar to other auth flow pages for a focused experience.
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">One More Step</CardTitle>
          <CardDescription>A phone number is required for adult accounts. Please enter yours to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSavePhone}>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="Enter your phone number" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save and Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
