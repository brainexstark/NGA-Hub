'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, Users, Heart, MessageSquare, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdultGuidancePage() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;

  return (
    <div className="container mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-bold uppercase tracking-widest">
            <ShieldCheck className="h-4 w-4" /> Mature Node Sync
        </div>
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter dynamic-text-mesh">Adult Guidance & Parenting</h1>
        <p className="text-muted-foreground text-lg font-medium italic max-w-2xl">
            High-performance resources for mature learners and parental synchronization protocols.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-2 border-primary/10 bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
            <CardHeader className="p-8">
                <CardTitle className="text-2xl font-black uppercase flex items-center gap-3">
                    <Users className="h-6 w-6 text-primary" /> Parenting Protocols
                </CardTitle>
                <CardDescription>Advanced synchronization for legacy guardians.</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-4">
                <p className="text-foreground/80 font-medium italic">
                    "Effective parenting in the digital era requires continuous node monitoring and high-performance communication."
                </p>
                <Button className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px]">Initialize Parental Sync</Button>
            </CardContent>
        </Card>

        <Card className="border-2 border-accent/10 bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
            <CardHeader className="p-8">
                <CardTitle className="text-2xl font-black uppercase flex items-center gap-3">
                    <Heart className="h-6 w-6 text-accent" /> Emotional Intelligence
                </CardTitle>
                <CardDescription>Nurturing the biological processing core.</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-4">
                <p className="text-foreground/80 font-medium italic">
                    "Mature mission success is dependent on balanced emotional synchronization and stable social nodes."
                </p>
                <Button variant="secondary" className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px]">Access EQ Modules</Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
