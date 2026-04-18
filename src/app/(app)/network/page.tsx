
'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Zap, Shield, Loader2, UserPlus, UserMinus, UserCheck, MessageCircle } from 'lucide-react';
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

  const handleMessage = (nodeId: string) => {
    router.push('/chat');
  };

  return (
    <div className="container mx-auto space-y-8 pb-32 animate-in fade-in duration-700">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest">
            <Users className="h-4 w-4" /> Global Lineage Matrix
        </div>
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter dynamic-text-mesh">Network Lineage</h1>
        <p className="text-muted-foreground text-lg font-medium italic max-w-2xl">
            Manage your synchronized nodes and visualize your impact within the STARK-B community.
        </p>
        {/* Stats row */}
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
          <TabsTrigger value="following" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all uppercase text-[10px] tracking-widest">
            <UserPlus className="h-3.5 w-3.5 mr-2" /> Following ({following?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="followers" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground transition-all uppercase text-[10px] tracking-widest">
            <Users className="h-3.5 w-3.5 mr-2" /> Followers ({followers?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="disciples" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-cyan-500 data-[state=active]:text-white transition-all uppercase text-[10px] tracking-widest">
            <Zap className="h-3.5 w-3.5 mr-2" /> Disciples ({disciples?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="following" className="animate-in fade-in zoom-in-95 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {followingLoading ? (
              <div className="col-span-full py-20 flex justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
            ) : following && following.length > 0 ? following.map((node: any) => (
              <Card key={node.id} className="border-2 border-white/5 bg-card/40 backdrop-blur-xl rounded-3xl overflow-hidden hover:border-primary/20 transition-all group">
                <CardHeader className="flex flex-row items-center gap-4 p-6">
                  <Avatar className="h-14 w-14 ring-2 ring-primary/20 border-2 border-background">
                    <AvatarImage src={node.profilePicture || `https://picsum.photos/seed/${node.id}/100/100`} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-black uppercase tracking-tight truncate">{node.displayName || node.creator || 'User'}</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Following</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10" onClick={() => handleMessage(node.id)}>
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => handleUnfollow(node.id, node.displayName || 'User')}>
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            )) : (
              <div className="col-span-full py-32 text-center rounded-[3rem] border-2 border-dashed border-white/5 opacity-30">
                <p className="italic font-medium">Not following anyone yet. Discover people in the feed!</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="followers" className="animate-in fade-in zoom-in-95 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {followersLoading ? (
              <div className="col-span-full py-20 flex justify-center"><Loader2 className="h-12 w-12 animate-spin text-accent" /></div>
            ) : followers && followers.length > 0 ? followers.map((node: any) => (
              <Card key={node.id} className="border-2 border-accent/10 bg-accent/5 backdrop-blur-xl rounded-3xl overflow-hidden hover:border-accent/30 transition-all">
                <CardHeader className="flex flex-row items-center gap-4 p-6">
                  <Avatar className="h-14 w-14 ring-2 ring-accent/20 border-2 border-background">
                    <AvatarImage src={`https://picsum.photos/seed/${node.id}/100/100`} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-black uppercase tracking-tight truncate">{node.displayName || 'User'}</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-accent">Follows you</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10" onClick={() => handleMessage(node.id)}>
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

        <TabsContent value="disciples" className="animate-in fade-in zoom-in-95 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {disciplesLoading ? (
              <div className="col-span-full py-20 flex justify-center"><Loader2 className="h-12 w-12 animate-spin text-cyan-400" /></div>
            ) : disciples && disciples.length > 0 ? disciples.map((node: any) => (
              <Card key={node.id} className="border-2 border-cyan-500/10 bg-cyan-500/5 backdrop-blur-xl rounded-3xl overflow-hidden hover:border-cyan-500/30 transition-all">
                <CardHeader className="flex flex-row items-center gap-4 p-6">
                  <div className="relative">
                    <Avatar className="h-14 w-14 ring-2 ring-cyan-400/20 border-2 border-background">
                      <AvatarImage src={`https://picsum.photos/seed/${node.id}/100/100`} />
                      <AvatarFallback>D</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-1 border-2 border-background">
                      <Zap className="h-3 w-3 text-white fill-current" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-black uppercase tracking-tight truncate">{node.displayName || 'Disciple'}</CardTitle>
                    <CardDescription className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-400">
                      <UserCheck className="h-2.5 w-2.5" /> Initiate
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-cyan-500/10" onClick={() => handleMessage(node.id)}>
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </CardHeader>
              </Card>
            )) : (
              <div className="col-span-full py-32 text-center rounded-[3rem] border-2 border-dashed border-white/5 opacity-30">
                <p className="italic font-medium">Your legacy lineage is awaiting its first initiates.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

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
