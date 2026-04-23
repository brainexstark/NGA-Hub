'use client';
import * as React from 'react';
import { Trophy, Loader2 } from 'lucide-react';

export default function CompetitionsPage() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
  return (
    <div className="container mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="space-y-2">
        <h1 className="font-headline text-4xl font-black uppercase tracking-tighter dynamic-text-mesh">Competitions</h1>
        <p className="text-muted-foreground italic">Community challenges and contests</p>
      </header>
      <div className="py-20 text-center opacity-30 space-y-3">
        <Trophy className="h-12 w-12 mx-auto" />
        <p className="font-black uppercase text-sm">No competitions yet</p>
        <p className="text-xs">Check back soon for upcoming challenges</p>
      </div>
    </div>
  );
}
