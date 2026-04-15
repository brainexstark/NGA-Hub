'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { ShieldAlert, Loader2, Home, Power } from "lucide-react";
import { Button } from "./ui/button";
import { useUser, useFirestore } from '../firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '../hooks/use-toast';
import { errorEmitter } from '../firebase/error-emitter';
import { FirestorePermissionError } from '../firebase/errors';
import Link from 'next/link';

interface LockdownOverlayProps {
    message?: string;
}

const ADMIN_UID = "s1EFDYsBy3SryAxicoIivG46M353";

const defaultMessage = "Due to a security event, access to your service is temporarily suspended by the STARK-B Intelligence Protocol.";

export function LockdownOverlay({ message }: LockdownOverlayProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLifting, setIsLifting] = React.useState(false);
  
  const isAdmin = user?.uid === ADMIN_UID;

  const handleLiftLockdown = () => {
    if (!firestore || !isAdmin || !user) {
        toast({ variant: 'destructive', title: "Authorization Required", description: "Only STARK-B Admin can restore full system workability." });
        return;
    }

    setIsLifting(true);
    
    const statusRef = doc(firestore, 'app_status', 'main');
    const statusUpdate = { isLockedDown: false, message: "System fully operational." };
    
    const userRef = doc(firestore, 'users', user.uid);
    const userUpdate = { isBreached: false };

    setDoc(statusRef, statusUpdate, { merge: true })
        .catch(async () => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: statusRef.path,
                operation: 'update',
                requestResourceData: statusUpdate,
            }));
        });

    updateDoc(userRef, userUpdate)
        .then(() => {
            toast({ title: "System Restored", description: "Node workability recovered. Re-initializing environment..." });
            setTimeout(() => {
                window.location.reload();
            }, 800);
        })
        .catch(async () => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: userRef.path,
                operation: 'update',
                requestResourceData: userUpdate,
            }));
            setIsLifting(false);
        });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex h-screen w-screen items-center justify-center bg-background p-4" suppressHydrationWarning>
      <div className="absolute inset-0 bg-gradient-to-tr from-destructive/20 to-transparent pointer-events-none" />
      <Card className="w-full max-w-lg text-center border-destructive bg-card/90 backdrop-blur-xl shadow-2xl relative overflow-hidden rounded-3xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-destructive animate-pulse" />
        <CardHeader>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive border-2 border-destructive/20 animate-pulse">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <CardTitle className="font-headline text-4xl font-bold text-destructive tracking-tight uppercase">SYSTEM SUSPENDED</CardTitle>
          <CardDescription className="text-muted-foreground font-medium uppercase tracking-widest text-xs pt-2">
            Status: Targeted Security Event
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 rounded-2xl bg-destructive/5 border border-destructive/20">
            <p className="font-medium leading-relaxed italic text-foreground/80">
              "{message || defaultMessage}"
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-tighter font-bold">
            Secure Node flagged by STARK-B Intelligence Protocol
          </p>
        </CardContent>
        {isAdmin && (
            <CardFooter className="flex flex-col gap-4 border-t pt-8 bg-muted/10">
                <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-full shadow-xl shadow-primary/20 text-lg transition-all active:scale-95 group"
                    onClick={handleLiftLockdown}
                    disabled={isLifting}
                >
                    {isLifting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Power className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    )}
                    Admin Mission Control: Restore Normalcy
                </Button>
                <Link href="/security" className="w-full">
                    <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/5 h-10 rounded-full text-xs font-black uppercase">
                        <Home className="mr-2 h-3 w-3" />
                        Enter Admin Mission Control
                    </Button>
                </Link>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
