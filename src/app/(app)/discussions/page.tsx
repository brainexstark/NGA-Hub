'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquareText, Users2, Search, Plus, Loader2, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { aiDatabase } from '@/lib/ai-database';
import { cn } from '@/lib/utils';

export default function DiscussionsPage() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;

  const discussions = aiDatabase.educationalNodes.discussions;

  return (
    <div className="container mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest">
            <Users2 className="h-4 w-4" /> Community Intelligence Threads
        </div>
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter dynamic-text-mesh">Discussion Hub</h1>
        <p className="text-muted-foreground text-lg font-medium italic max-w-2xl">
            Collaborate on academic nodes and share insights with global alumni and student researchers.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
            <div className="flex items-center gap-4 bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-2 focus-within:border-primary/50 transition-all shadow-xl">
                <Search className="ml-4 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Search intelligence threads..." className="bg-transparent border-none focus-visible:ring-0 font-medium" />
                <Button className="rounded-xl h-10 px-6 font-bold uppercase text-[10px] tracking-widest">New Thread</Button>
            </div>

            <div className="space-y-4">
                {discussions.map((disc) => (
                    <Card key={disc.id} className="border-2 border-white/5 bg-card/40 backdrop-blur-xl shadow-lg rounded-3xl overflow-hidden hover:border-primary/20 transition-all cursor-pointer group">
                        <CardHeader className="p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                                        <AvatarImage src={`https://picsum.photos/seed/${disc.author}/100/100`} />
                                        <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-xl font-bold uppercase tracking-tight group-hover:text-primary transition-colors">{disc.title}</CardTitle>
                                        <CardDescription className="flex items-center gap-2 mt-1 font-bold text-[10px] uppercase tracking-widest">
                                            Thread Initiated by <span className="text-primary">{disc.author}</span> • {disc.lastActive}
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-1 bg-black/20 px-4 py-2 rounded-2xl border border-white/5">
                                    <MessageCircle className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-black text-white">{disc.replies}</span>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>

        <aside className="w-full lg:w-80 space-y-6">
            <Card className="border-2 border-primary/10 bg-primary/5 rounded-[2rem] overflow-hidden shadow-xl">
                <CardHeader className="bg-primary/10 p-6">
                    <CardTitle className="text-xs font-black uppercase tracking-widest">Trending Objectives</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    {['#quantum_physics', '#robotics_finals', '#ai_ethics', '#mbita_legacy'].map(tag => (
                        <div key={tag} className="flex items-center justify-between group cursor-pointer">
                            <span className="text-sm font-bold text-muted-foreground group-hover:text-primary transition-all">{tag}</span>
                            <span className="text-[10px] font-black opacity-40">1.2k nodes</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </aside>
      </div>
    </div>
  );
}