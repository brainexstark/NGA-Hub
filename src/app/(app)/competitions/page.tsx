'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Star, Zap, Loader2, ArrowRight } from 'lucide-react';
import { aiDatabase } from '@/lib/ai-database';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function CompetitionsPage() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;

  const competitions = aiDatabase.educationalNodes.competitions;

  return (
    <div className="container mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-bold uppercase tracking-widest">
            <Trophy className="h-4 w-4 fill-current" /> High Performance Challenges
        </div>
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter dynamic-text-mesh">Global Competitions</h1>
        <p className="text-muted-foreground text-lg font-medium italic max-w-2xl">
            Test your node performance against the best in the STARK-B legacy network. Innovation leads to prestige.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {competitions.map((comp) => (
          <Card key={comp.id} className="border-2 border-primary/10 bg-card/40 backdrop-blur-2xl shadow-2xl rounded-[2.5rem] overflow-hidden group hover:-translate-y-2 transition-all duration-500">
            <div className="relative h-48 w-full bg-muted overflow-hidden">
                <Image 
                    src={`https://picsum.photos/seed/${comp.id}/800/600`} 
                    alt={comp.title} 
                    fill 
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                    data-ai-hint={comp.imageHint}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-4 right-4 bg-accent/90 text-accent-foreground px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                    <Star className="h-3 w-3 inline mr-1 fill-current" /> {comp.reward}
                </div>
            </div>
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-black uppercase tracking-tight leading-tight">{comp.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-2 font-bold text-primary">
                <Users className="h-4 w-4" /> {comp.participants.toLocaleString()} Competitors Active
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-4">
              <p className="text-sm font-medium text-muted-foreground italic line-clamp-2">
                Join the synchronized mission node and showcase your expertise in {comp.imageHint}.
              </p>
            </CardContent>
            <CardFooter className="px-8 pb-8">
              <Button className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 group">
                Enter Mission Node <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}