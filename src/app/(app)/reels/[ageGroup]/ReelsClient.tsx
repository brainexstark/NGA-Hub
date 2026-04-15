'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/ui/avatar";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { PlaceHolderImages } from "../../../../lib/placeholder-images";
import { Heart, MessageCircle, Download, PlayCircle, Share2, Zap, Globe, Newspaper, Music, Trophy, Tv } from "lucide-react";
import Image from "next/image";
import { useToast } from "../../../../hooks/use-toast";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "../../../../components/ui/dialog";
import { aiDatabase } from '../../../../lib/ai-database';
import { ShareDialog } from '../../../../components/share-dialog';
import { cn, getEmbedUrl } from '../../../../lib/utils';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "../../../../firebase";
import { collection, serverTimestamp, doc, addDoc } from "firebase/firestore";
import type { UserProfile } from '../../../../lib/types';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Globe },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'entertainment', label: 'Fun', icon: Tv },
];

const InternalPlayer = ({ url }: { url: string }) => {
    const embedUrl = getEmbedUrl(url);
    return <iframe src={embedUrl} className="w-full h-full border-none" allowFullScreen />;
};

export default function ReelsClient({ ageGroup }: { ageGroup: string }) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const profileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: profile } = useDoc<UserProfile>(profileRef);

  const [likedReels, setLikedReels] = React.useState<Record<string, boolean>>({});
  const [followedUsers, setFollowedUsers] = React.useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = React.useState('all');

  const allReels = React.useMemo(() => aiDatabase.reels[ageGroup as keyof typeof aiDatabase.reels] || aiDatabase.reels['10-16'], [ageGroup]);

  const reels = React.useMemo(() => {
    if (activeCategory === 'all') return allReels;
    return allReels.filter((r: any) => r.category === activeCategory);
  }, [allReels, activeCategory]);

  const handleTriggerCycle = () => {
    window.dispatchEvent(new CustomEvent('stark-b-entertainment-engaged'));
  };

  const toggleLike = (id: string) => {
    const isLiked = !likedReels[id];
    setLikedReels(prev => ({ ...prev, [id]: isLiked }));
    toast({ title: isLiked ? "Node Synchronized" : "Node De-synchronized" });
  };

  const handleFollow = (userName: string) => {
    setFollowedUsers(prev => ({ ...prev, [userName]: true }));
    if (user && firestore && profile) {
        const userRef = doc(firestore, 'users', user.uid);
        updateDocumentNonBlocking(userRef, { followersCount: (profile.followersCount || 0) + 1 });
    }
    toast({ title: "Lineage Linked", description: `Following @${userName}` });
  };

  const handleSaveToBank = (reel: any) => {
    if (!user || !firestore) return;
    const colRef = collection(firestore, 'users', user.uid, 'videos');
    addDoc(colRef, {
      userId: user.uid,
      title: reel.description || "STARK-B Legacy Asset",
      videoUrl: reel.url || reel.imageUrl,
      duration: "0:30",
      source: 'save',
      createdAt: serverTimestamp(),
    }).then(() => toast({ title: "Node Localized" }));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Category filter bar */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-white/5 shrink-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-[9px] uppercase tracking-widest whitespace-nowrap transition-all border shrink-0",
              activeCategory === cat.id
                ? "bg-primary text-white border-primary shadow-lg"
                : "bg-white/5 text-white/40 border-white/10 hover:text-white"
            )}
          >
            <cat.icon className="h-3 w-3" />
            {cat.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto snap-y snap-mandatory no-scrollbar animate-in fade-in duration-700">
      {reels.length === 0 && (
        <div className="h-full flex items-center justify-center opacity-30 flex-col gap-4">
          <Globe className="h-12 w-12" />
          <p className="font-black uppercase tracking-widest text-sm">No {activeCategory} reels</p>
        </div>
      )}
      {reels.map((reel: any) => (
        <div key={reel.id} className="h-full w-full flex items-center justify-center snap-center p-4">
          <Card className="w-full max-w-sm h-full flex flex-col overflow-hidden relative shadow-2xl border-none bg-black rounded-[2.5rem]">
              <Dialog>
                <DialogTrigger asChild>
                    <div className="cursor-pointer block w-full h-full group relative" onClick={handleTriggerCycle}>
                        <Image src={reel.imageUrl} alt={reel.description} fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="p-5 rounded-full bg-white/10 backdrop-blur-md border border-white/20"><PlayCircle className="h-12 w-12 text-white" /></div>
                        </div>
                    </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl p-0 overflow-hidden border-primary/20 bg-black aspect-video rounded-[2rem]">
                    <DialogTitle className="sr-only">Reel Player</DialogTitle>
                    <InternalPlayer url={reel.url || reel.imageUrl} />
                </DialogContent>
              </Dialog>
              
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10 space-y-4 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-white/20 shadow-xl">
                              <AvatarImage src={PlaceHolderImages.find(i => i.id === 'user-avatar-1')?.imageUrl} />
                              <AvatarFallback>M</AvatarFallback>
                          </Avatar>
                          <div>
                              <p className="font-black text-sm uppercase tracking-tighter">@STARKBOfficial</p>
                              <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest text-white/60">Node Verified</p>
                          </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={cn(
                            "rounded-full h-8 px-4 text-[9px] font-black uppercase tracking-widest border-white/20 transition-all",
                            followedUsers['STARKBOfficial'] ? "bg-primary text-white border-primary" : "bg-white/10 text-white hover:bg-white/20"
                        )}
                        onClick={() => handleFollow('STARKBOfficial')}
                      >
                          {followedUsers['STARKBOfficial'] ? "LINKED" : "FOLLOW"}
                      </Button>
                  </div>
                  <p className="text-xs leading-relaxed line-clamp-2 font-medium italic opacity-80">"{reel.description}"</p>
              </div>

              <div className="absolute right-4 bottom-20 flex flex-col gap-6 z-20">
                  <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => toggleLike(reel.id)}>
                      <Heart className={cn(
                          "h-8 w-8 transition-all duration-300 active:scale-150", 
                          likedReels[reel.id] ? "fill-red-500 text-red-500" : "text-white hover:text-red-500"
                      )} />
                      <span className="text-[10px] font-black text-white uppercase shadow-md">{likedReels[reel.id] ? "1.3K" : "1.2K"}</span>
                  </div>

                  <Link href={`/comments/${reel.id}/`} className="flex flex-col items-center gap-1 group">
                      <MessageCircle className="h-8 w-8 text-white group-hover:text-primary transition-colors drop-shadow-md" />
                      <span className="text-[10px] font-black text-white uppercase">Chat</span>
                  </Link>

                  <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => toast({ title: "Mentorship Request Localized" })}>
                      <Zap className="h-8 w-8 text-white group-hover:text-accent transition-colors drop-shadow-md" />
                      <span className="text-[10px] font-black text-white uppercase">Mentor</span>
                  </div>

                  <ShareDialog title={reel.description} url={reel.url || reel.imageUrl}>
                    <div className="flex flex-col items-center gap-1 cursor-pointer group">
                        <Share2 className="h-8 w-8 text-white group-hover:text-primary transition-colors drop-shadow-md" />
                        <span className="text-[10px] font-black text-white uppercase">Share</span>
                    </div>
                  </ShareDialog>

                  <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => handleSaveToBank(reel)}>
                    <Download className="h-8 w-8 text-white group-hover:text-green-400 transition-colors drop-shadow-md" />
                    <span className="text-[10px] font-black text-white uppercase">Save</span>
                  </div>
              </div>
          </Card>
        </div>
      ))}
      </div>
    </div>
  );
}
