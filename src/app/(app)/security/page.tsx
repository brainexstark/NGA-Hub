'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { 
  Loader2, 
  ShieldCheck, 
  ShieldAlert, 
  UserX, 
  UserCheck, 
  Mail, 
  Skull, 
  Lock, 
  AlertTriangle,
  Zap,
  Power,
  Eye,
  CheckCircle2,
  Key
} from "lucide-react";
import { getSecurityAlerts } from '../../../ai/flows/get-security-alerts';
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { Label } from "../../../components/ui/label";
import { useFirestore, useDoc, useMemoFirebase, useUser } from "../../../firebase";
import { doc } from 'firebase/firestore';
import { useToast } from "../../../hooks/use-toast";
import type { AppStatus, UserProfile } from '../../../lib/types';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '../../../firebase/non-blocking-updates';

const ADMIN_UID = "s1EFDYsBy3SryAxicoIivG46M353";

export default function SecurityPage() {
  const [alerts, setAlerts] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lockdownMessage, setLockdownMessage] = useState('');

  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const isAdmin = user?.uid === ADMIN_UID;

  const appStatusRef = useMemoFirebase(() => (!firestore) ? null : doc(firestore, 'app_status', 'main'), [firestore]);
  const { data: appStatus } = useDoc<AppStatus>(appStatusRef);

  const userProfileRef = useMemoFirebase(() => (!user || !firestore) ? null : doc(firestore, 'users', user.uid), [user, firestore]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    async function fetchAlerts() {
        setIsLoading(true);
        try {
            const result = await getSecurityAlerts();
            setAlerts(result.alerts);
        } catch (e) {
            setAlerts("Security Intelligence Node unavailable.");
        } finally {
            setIsLoading(false);
        }
    }
    fetchAlerts();
  }, []);

  useEffect(() => {
      if (appStatus?.message) setLockdownMessage(appStatus.message);
  }, [appStatus]);

  const handleUpdateLockdown = (isLockedDown: boolean) => {
    if (!firestore || !isAdmin) return;
    setIsUpdating(true);
    const statusRef = doc(firestore, 'app_status', 'main');
    setDocumentNonBlocking(statusRef, { isLockedDown, message: lockdownMessage }, { merge: true });
    toast({ title: 'Broadcast Synchronized' });
    setIsUpdating(false);
  };

  const handleToggleSelfBreach = () => {
    if (!user || !firestore) return;
    const userRef = doc(firestore, 'users', user.uid);
    const newBreachState = !profile?.isBreached;
    updateDocumentNonBlocking(userRef, { isBreached: newBreachState });
    toast({ title: `Targeted Lockdown ${newBreachState ? 'Activated' : 'Lifted'}` });
  };

  return (
    <div className="container mx-auto space-y-12 pb-32 animate-in fade-in duration-700 max-w-5xl">
      <header className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest border border-primary/20">
            <ShieldCheck className="h-4 w-4" /> Security Synchronization Active
        </div>
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter dynamic-text-mesh">Security Node Center</h1>
        <p className="text-muted-foreground font-medium italic">Synchronize your node with high-performance security protocols and real-time threat intelligence.</p>
      </header>

      <Card className="border-2 border-primary/20 bg-primary/5 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-primary/10 border-b border-primary/10 p-8">
          <div className="flex items-start gap-4">
            <div className="bg-primary/20 p-4 rounded-3xl flex-shrink-0 animate-pulse"><ShieldCheck className="h-8 w-8 text-primary" /></div>
            <div>
              <CardTitle className="text-2xl font-black uppercase tracking-tight">Security Intelligence Briefing</CardTitle>
              <CardDescription className="text-primary/60 font-bold uppercase tracking-widest text-[10px]">Real-time AI synchronization active</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {isLoading ? <div className="flex flex-col justify-center items-center h-48 opacity-40"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div> : <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap rounded-3xl border border-white/5 bg-black/20 p-8 font-medium italic text-foreground/80">{alerts}</div>}
        </CardContent>
      </Card>

      <section className="space-y-6">
        <div className="flex items-center justify-center gap-4 bg-slate-900/50 py-3 rounded-2xl border border-white/5">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-primary/40" /><h2 className="text-xl font-black uppercase tracking-[0.3em] text-white">Current Threats</h2><div className="h-px w-20 bg-gradient-to-l from-transparent to-primary/40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-slate-900/80 border-2 border-primary/20 rounded-[2.5rem] p-10 flex gap-8 items-center hover:border-primary/40 transition-all group">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform"><Mail className="h-10 w-10 text-primary" /></div>
                <div><h3 className="text-xl font-black uppercase text-white">Phishing Scams</h3><p className="text-sm font-medium text-muted-foreground italic">Watch for fake message nodes asking for your personal synchronization info.</p></div>
            </Card>
            <Card className="bg-slate-900/80 border-2 border-white/5 rounded-[2.5rem] p-10 flex gap-8 items-center hover:border-destructive/40 transition-all group">
                <div className="h-20 w-20 rounded-[2rem] bg-black flex items-center justify-center border-2 border-destructive/20 group-hover:scale-110 transition-transform"><Skull className="h-10 w-10 text-destructive animate-pulse" /></div>
                <div><h3 className="text-xl font-black uppercase text-white">Malware Disguised</h3><p className="text-sm font-medium text-muted-foreground italic">Suspicious downloads detected in external node clusters. Verify source integrity.</p></div>
            </Card>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-center gap-4 bg-slate-900/50 py-3 rounded-2xl border border-white/5">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-accent/40" /><h2 className="text-xl font-black uppercase tracking-[0.3em] text-white">Safety Grid</h2><div className="h-px w-20 bg-gradient-to-l from-transparent to-accent/40" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
                { icon: Key, label: "Strong Password", desc: "Complex Node Auth" },
                { icon: ShieldAlert, label: "Enable 2FA", desc: "Dual-Node Verification" },
                { icon: Zap, label: "Think Before Click", desc: "Protocol Awareness" },
                { icon: Lock, label: "Be Private", desc: "Node Cloaking" }
            ].map((item, i) => (
                <Card key={i} className="bg-black/40 border border-white/10 p-6 flex flex-col items-center text-center rounded-3xl hover:bg-accent/5 hover:border-accent/30 transition-all cursor-default">
                    <item.icon className="h-8 w-8 text-accent mb-4" />
                    <p className="text-xs font-black uppercase tracking-tight text-white">{item.label}</p>
                    <p className="text-[8px] font-bold uppercase opacity-40 mt-1">{item.desc}</p>
                </Card>
            ))}
        </div>
      </section>

      {isAdmin && (
        <section className="space-y-8 pt-12 border-t border-white/5">
            <div className="flex items-center gap-4 bg-destructive/10 p-4 rounded-3xl border border-destructive/20 w-fit mx-auto shadow-xl">
                <div className="p-3 bg-destructive rounded-2xl"><Power className="h-6 w-6 text-white" /></div>
                <h3 className="text-lg font-black uppercase text-white">Administrator Command Node</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-destructive/20 bg-destructive/5 rounded-[2.5rem] p-8 space-y-6">
                    <Label className="text-[10px] font-black uppercase opacity-40">Global Status Broadcast</Label>
                    <Textarea placeholder="Message for potentially suspended nodes..." value={lockdownMessage} onChange={(e) => setLockdownMessage(e.target.value)} className="bg-black/40 border-white/10" />
                    <div className="flex gap-4">
                        <Button variant="destructive" className="flex-1 font-black uppercase text-[10px]" onClick={() => handleUpdateLockdown(true)} disabled={isUpdating}>Update Broadcast</Button>
                    </div>
                </Card>
                <Card className="border-primary/20 bg-primary/5 rounded-[2.5rem] p-10 flex flex-col justify-center items-center text-center">
                    <p className="text-sm font-medium italic opacity-60 mb-6">Execute targeted node suspension to verify individual lockdown protocols. This affects only your personal profile.</p>
                    <Button variant={profile?.isBreached ? "secondary" : "outline"} className="w-full h-14 rounded-2xl font-black uppercase text-xs" onClick={handleToggleSelfBreach}>
                        {profile?.isBreached ? <><UserCheck className="mr-2 h-5 w-5" /> Re-Synchronize</> : <><UserX className="mr-2 h-5 w-5 text-destructive" /> Flag Node as Breached</>}
                    </Button>
                </Card>
            </div>
        </section>
      )}
    </div>
  );
}
