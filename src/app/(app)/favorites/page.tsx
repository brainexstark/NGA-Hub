'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '../../../firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { ContentCard } from '../../../components/content-card';
import { Bookmark, Film, BookOpen, MessageSquare, Loader2, Star } from 'lucide-react';
import { PlaceHolderImages } from '../../../lib/placeholder-images';
import type { VideoEntry } from '../../../lib/types';

export default function FavoritesPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const savedPostsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'saved_posts');
  }, [user, firestore]);

  const savedVideosQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'videos'),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: savedPosts, isLoading: postsLoading } = useCollection(savedPostsQuery);
  const { data: savedVideos, isLoading: videosLoading } = useCollection<VideoEntry>(savedVideosQuery);

  const savedAssets = React.useMemo(() => {
    if (!savedPosts) return [];
    return savedPosts.map(p => {
      // Find matching mock image or use fallback
      const asset = PlaceHolderImages.find(img => img.id === p.id) || PlaceHolderImages[0];
      return { ...p, asset };
    });
  }, [savedPosts]);

  const savedLegacyVideos = React.useMemo(() => {
    if (!savedVideos) return [];
    return savedVideos.filter(v => v.source === 'save');
  }, [savedVideos]);

  return (
    <div className="container mx-auto space-y-8 pb-20 animate-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-bold uppercase tracking-widest">
            <Star className="h-4 w-4 fill-current" /> Personalized Legacy Vault
        </div>
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter dynamic-text-mesh">
          Your Favorites
        </h1>
        <p className="text-muted-foreground text-lg font-medium italic">
          Access your synchronized bookmarks, intelligence threads, and high-performance media.
        </p>
      </header>

      <Tabs defaultValue="posts" className="space-y-8">
        <TabsList className="bg-black/20 p-1.5 rounded-2xl border border-white/5 h-auto flex flex-wrap gap-2">
          <TabsTrigger value="posts" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all uppercase text-[10px] tracking-widest">
            <Bookmark className="h-3 w-3 mr-2" /> Saved Posts
          </TabsTrigger>
          <TabsTrigger value="videos" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all uppercase text-[10px] tracking-widest">
            <Film className="h-3 w-3 mr-2" /> Video Bank
          </TabsTrigger>
          <TabsTrigger value="lessons" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all uppercase text-[10px] tracking-widest">
            <BookOpen className="h-3 w-3 mr-2" /> Favorite Lessons
          </TabsTrigger>
          <TabsTrigger value="chats" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all uppercase text-[10px] tracking-widest">
            <MessageSquare className="h-3 w-3 mr-2" /> Intelligence Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="animate-in fade-in zoom-in-95 duration-500">
          {postsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
          ) : savedAssets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {savedAssets.map((p) => (
                <ContentCard 
                  key={p.id}
                  id={p.id}
                  title="Legacy Save"
                  creator="STARK-B User"
                  image={p.asset}
                />
              ))}
            </div>
          ) : (
            <div className="py-32 text-center rounded-[3rem] border-2 border-dashed border-white/5 bg-white/5 opacity-30">
              <p className="italic font-medium">Your Legacy Vault is currently clear. Synchronize a content node to begin.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="videos" className="animate-in fade-in zoom-in-95 duration-500">
           {videosLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
          ) : savedLegacyVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedLegacyVideos.map((v) => (
                <div key={v.id} className="p-6 rounded-[2rem] bg-card/40 backdrop-blur-xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                      <Film className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{v.title}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{v.duration} • Superdatabase Archive</p>
                    </div>
                  </div>
                  <button className="text-primary hover:scale-110 transition-transform">
                    <Film className="h-6 w-6" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-32 text-center rounded-[3rem] border-2 border-dashed border-white/5 bg-white/5 opacity-30">
              <p className="italic font-medium">No video assets localized in this segment.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="lessons" className="animate-in fade-in zoom-in-95 duration-500">
          <div className="py-32 text-center rounded-[3rem] border-2 border-dashed border-white/5 bg-white/5 opacity-30">
            <p className="italic font-medium">Favorite educational nodes will be synchronized here once localized.</p>
          </div>
        </TabsContent>

        <TabsContent value="chats" className="animate-in fade-in zoom-in-95 duration-500">
          <div className="py-32 text-center rounded-[3rem] border-2 border-dashed border-white/5 bg-white/5 opacity-30">
            <p className="italic font-medium">Secured intelligence logs require additional clearance for persistent storage.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}