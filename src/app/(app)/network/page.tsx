'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Zap, Loader2, UserPlus, UserMinus, UserCheck, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function NetworkPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const followingQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'following');
  }, [user, firestore]);

  const disciplesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'disciples_of');
  }, [user, firestore]);

  const followersQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'followers');
  }, [user, firestore]);

  const { data: following, isLoading: followingLoading } = useCollection(followingQuery);
  const { data: disciples, isLoading: disciplesLoading } = useCollection(disciplesQuery);
  const { data: followers, isLoading: followersLoading } = useCollection(followersQuery);

  const handleUnfollow = async (nodeId: string, nodeName: string) => {
    if (!user || !firestore) return;
    await deleteDoc(doc(firestore, 'users', user.uid, 'following', nodeId));
    toast({ title: `Unlinked from ${nodeName}` });
  };

  return (
    <div className="container mx-auto space-y-8 pb-32 animate-in fade-in duration-700">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest">
          <Users className="h-4 w-4" /> Network Lineage
        </div>
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter dynamic-text-mesh">Network</h1>
        <div className="flex gap-6 pt-2">
          {[
            { label: 'Following', value: following?.length || 0, color: 'text-primary' },
            { label: 'Followers', value: followers?.length || 0, color: 'text-accent' },
            { label: 'Disciples', value: disciples?.length || 0, color: 'text-cyan-400' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40">{s.label}</p>
            </div>
          ))}
        </div>
      </header>

      <Tabs defaultValue="following" className="space-y-8">
        <TabsList className="bg-black/20 p-1.5 rounded-2xl border border-white/5 h-auto flex gap-2 w-fit">
          <TabsTrigger value="following" className="rounded-xl font-bold px-5 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all uppercase text-[10px] tracking-widest">
            <UserPlus className="h-3.5 w-3.5 mr-2" /> Following ({following?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="followers" className="rounded-xl font-bold px-5 py-2.5 data-[state=active]:bg-accent data-[state=active]:text-white transition-all uppercase text-[10px] tracking-widest">
            <Users className="h-3.5 w-3.5 mr-2" /> Followers ({followers?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="disciples" className="rounded-xl font-bold px-5 py-2.5 data-[state=active]:bg-cyan-500 data-[state=active]:text-white transition-all uppercase text-[10px] tracking-widest">
            <Zap className="h-3.5 w-3.5 mr-2" /> Disciples ({disciples?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="following">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {followingLoading ? <div className="col-span-full py-20 flex justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
            : following && following.length > 0 ? following.map((node: any) => (
              <Card key={node.id} className="border-2 border-white/5 bg-card/40 rounded-3xl overflow-hidden hover:border-primary/20 transition-all">
                <CardHeader className="flex flex-row items-center gap-4 p-6">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                    <AvatarImage src={node.profilePicture || `https://picsum.photos/seed/${node.id}/100/100`} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-black uppercase truncate">{node.displayName || 'User'}</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase text-primary/60">Following</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => router.push('/chat')}>
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:text-destructive" onClick={() => handleUnfollow(node.id, node.displayName || 'User')}>
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            )) : (
              <div className="col-span-full py-32 text-center rounded-[3rem] border-2 border-dashed border-white/5 opacity-30">
                <p className="italic font-medium">Not following anyone yet.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="followers">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {followersLoading ? <div className="col-span-full py-20 flex justify-center"><Loader2 className="h-12 w-12 animate-spin text-accent" /></div>
            : followers && followers.length > 0 ? followers.map((node: any) => (
              <Card key={node.id} className="border-2 border-accent/10 bg-accent/5 rounded-3xl overflow-hidden hover:border-accent/30 transition-all">
                <CardHeader className="flex flex-row items-center gap-4 p-6">
                  <Avatar className="h-12 w-12 ring-2 ring-accent/20">
                    <AvatarImage src={`https://picsum.photos/seed/${node.id}/100/100`} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-black uppercase truncate">{node.displayName || 'User'}</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase text-accent">Follows you</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => router.push('/chat')}>
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </CardHeader>
              </Card>
            )) : (
              <div className="col-span-full py-32 text-center rounded-[3rem] border-2 border-dashed border-white/5 opacity-30">
                <p className="italic font-medium">No followers yet. Post content to get discovered!</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="disciples">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {disciplesLoading ? <div className="col-span-full py-20 flex justify-center"><Loader2 className="h-12 w-12 animate-spin text-cyan-400" /></div>
            : disciples && disciples.length > 0 ? disciples.map((node: any) => (
              <Card key={node.id} className="border-2 border-cyan-500/10 bg-cyan-500/5 rounded-3xl overflow-hidden hover:border-cyan-500/30 transition-all">
                <CardHeader className="flex flex-row items-center gap-4 p-6">
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-2 ring-cyan-400/20">
                      <AvatarImage src={`https://picsum.photos/seed/${node.id}/100/100`} />
                      <AvatarFallback>D</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-1 border-2 border-background">
                      <Zap className="h-3 w-3 text-white fill-current" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-black uppercase truncate">{node.displayName || 'Disciple'}</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-[10px] font-black uppercase text-cyan-400">
                      <UserCheck className="h-2.5 w-2.5" /> Initiate
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => router.push('/chat')}>
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </CardHeader>
              </Card>
            )) : (
              <div className="col-span-full py-32 text-center rounded-[3rem] border-2 border-dashed border-white/5 opacity-30">
                <p className="italic font-medium">Your lineage is awaiting its first initiates.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
