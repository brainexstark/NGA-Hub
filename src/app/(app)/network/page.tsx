
'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Zap, Shield, Loader2, UserPlus, ArrowRight, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function NetworkPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const followingQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'following');
  }, [user, firestore]);

  const disciplesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'disciples_of');
  }, [user, firestore]);

  const { data: following, isLoading: followingLoading } = useCollection(followingQuery);
  const { data: disciples, isLoading: disciplesLoading } = useCollection(disciplesQuery);

  return (
    <div className="container mx-auto space-y-8 pb-32 animate-in fade-in duration-700">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest">
            <Users className="h-4 w-4" /> Global Lineage Matrix
        </div>
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter dynamic-text-mesh">Network Lineage</h1>
        <p className="text-muted-foreground text-lg font-medium italic max-w-2xl">
            Manage your synchronized nodes and visualize your impact within the STARK-B community legacy.
        </p>
      </header>

      <Tabs defaultValue="following" className="space-y-8">
        <TabsList className="bg-black/20 p-1.5 rounded-2xl border border-white/5 h-auto flex gap-2 w-fit">
          <TabsTrigger value="following" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all uppercase text-[10px] tracking-widest">
            <UserPlus className="h-3.5 w-3.5 mr-2" /> Linked Nodes ({following?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="disciples" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground transition-all uppercase text-[10px] tracking-widest">
            <Zap className="h-3.5 w-3.5 mr-2" /> Disciples ({disciples?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="following" className="animate-in fade-in zoom-in-95 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {followingLoading ? (
                <div className="col-span-full py-20 flex justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
            ) : following && following.length > 0 ? following.map((node) => (
                <Card key={node.id} className="border-2 border-white/5 bg-card/40 backdrop-blur-xl rounded-3xl overflow-hidden hover:border-primary/20 transition-all group">
                    <CardHeader className="flex flex-row items-center gap-4 p-6">
                        <Avatar className="h-14 w-14 ring-2 ring-primary/20 border-2 border-background">
                            <AvatarImage src={`https://picsum.photos/seed/${node.id}/100/100`} />
                            <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-black uppercase tracking-tight truncate">{node.creator}</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Node Active</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-all">
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </CardHeader>
                </Card>
            )) : (
                <div className="col-span-full py-32 text-center rounded-[3rem] border-2 border-dashed border-white/5 bg-white/5 opacity-30">
                    <p className="italic font-medium">No nodes currently linked in your personal matrix.</p>
                </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="disciples" className="animate-in fade-in zoom-in-95 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {disciplesLoading ? (
                <div className="col-span-full py-20 flex justify-center"><Loader2 className="h-12 w-12 animate-spin text-accent" /></div>
            ) : disciples && disciples.length > 0 ? disciples.map((node) => (
                <Card key={node.id} className="border-2 border-accent/10 bg-accent/5 backdrop-blur-xl rounded-3xl overflow-hidden hover:border-accent/30 transition-all group">
                    <CardHeader className="flex flex-row items-center gap-4 p-6">
                        <div className="relative">
                            <Avatar className="h-14 w-14 ring-2 ring-accent/20 border-2 border-background">
                                <AvatarImage src={`https://picsum.photos/seed/${node.id}/100/100`} />
                                <AvatarFallback>D</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 bg-accent rounded-full p-1 border-2 border-background shadow-lg">
                                <Zap className="h-3 w-3 text-accent-foreground fill-current" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-black uppercase tracking-tight truncate">{node.creator}</CardTitle>
                            <CardDescription className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-accent">
                                <UserCheck className="h-2.5 w-2.5" /> {node.level || 'Initiate'}
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full group-hover:bg-accent/10 group-hover:text-accent transition-all">
                            <Shield className="h-5 w-5" />
                        </Button>
                    </CardHeader>
                </Card>
            )) : (
                <div className="col-span-full py-32 text-center rounded-[3rem] border-2 border-dashed border-white/5 bg-white/5 opacity-30">
                    <p className="italic font-medium">Your legacy lineage is currently awaiting its first initiates.</p>
                </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
