'use client';

import * as React from 'react';
import { ContentCard } from '../../../../components/content-card';
import { PlaceHolderImages } from '../../../../lib/placeholder-images';
import { Skeleton } from '../../../../components/ui/skeleton';
import { Loader2, RefreshCw, Sparkles, Database, Newspaper, Music, Trophy, Tv, Globe } from 'lucide-react';
import { recommendContent, type ContentRecommendationOutput } from '../../../../ai/flows/content-recommendation';
import { Button } from '../../../../components/ui/button';
import { aiDatabase } from '../../../../lib/ai-database';
import { cn } from '../../../../lib/utils';

type AgeGroup = 'under-10' | '10-16' | '16-plus';

const AGE_MAP: Record<AgeGroup, number> = {
  'under-10': 8,
  '10-16': 13,
  '16-plus': 20,
};

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Globe },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'entertainment', label: 'Entertainment', icon: Tv },
];

export default function FeedClient({ ageGroup }: { ageGroup: string }) {
  const [aiFeeds, setAiFeeds] = React.useState<ContentRecommendationOutput['recommendations']>([]);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [activeCategory, setActiveCategory] = React.useState('all');

  const localPosts = React.useMemo(() => {
    return aiDatabase.superdatabasePosts[ageGroup as AgeGroup] || [];
  }, [ageGroup]);

  const filteredPosts = React.useMemo(() => {
    if (activeCategory === 'all') return localPosts;
    return localPosts.filter(p => p.category === activeCategory);
  }, [localPosts, activeCategory]);

  const refreshAiFeeds = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      const ageNum = AGE_MAP[ageGroup as AgeGroup] || 10;
      const result = await recommendContent({ age: ageNum });
      setAiFeeds(result.recommendations);
    } catch (error) {
      console.error("AI Feed Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [ageGroup]);

  React.useEffect(() => {
    refreshAiFeeds();
  }, [refreshAiFeeds]);

  const availableAssets = React.useMemo(() => {
    const primary = PlaceHolderImages.filter(img =>
      img.id.startsWith('content-') || img.id.startsWith('reel-') || img.id.startsWith('mbita-')
    );
    return primary.length > 0 ? primary : PlaceHolderImages;
  }, []);

  return (
    <div className="container mx-auto max-w-3xl space-y-8 pb-20 pt-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-headline text-5xl font-bold tracking-tight text-primary">Live Super Feed</h1>
          <p className="text-muted-foreground text-lg font-medium italic text-white/60">News · Music · Sports · Entertainment</p>
        </div>
        <Button onClick={refreshAiFeeds} disabled={isRefreshing} className="rounded-full h-12 px-6 font-bold shadow-lg">
          {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </header>

      {/* Category Filter */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all border shrink-0",
              activeCategory === cat.id
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/30"
                : "bg-white/5 text-white/50 border-white/10 hover:border-primary/30 hover:text-white"
            )}
          >
            <cat.icon className="h-3.5 w-3.5" />
            {cat.label}
          </button>
        ))}
      </div>

      <div className="space-y-12">
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-primary/10 pb-4">
            <div className="bg-primary/10 p-2 rounded-lg"><Database className="h-6 w-6 text-primary" /></div>
            <h2 className="font-headline text-2xl font-bold">
              {activeCategory === 'all' ? 'All Content' : CATEGORIES.find(c => c.id === activeCategory)?.label + ' Feed'}
            </h2>
          </div>
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-8">
              {filteredPosts.map((post) => (
                <ContentCard
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  creator={post.userName}
                  image={{ imageUrl: post.mediaUrl, description: post.caption, id: post.id, imageHint: 'video content', url: post.url, category: post.category } as any}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center border-2 border-dashed rounded-3xl opacity-40 space-y-3">
              <Globe className="h-10 w-10 mx-auto opacity-40" />
              <p className="italic font-medium">No {activeCategory} content yet.</p>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-primary/10 pb-4">
            <div className="bg-accent/10 p-2 rounded-lg"><Sparkles className="h-6 w-6 text-accent" /></div>
            <h2 className="font-headline text-2xl font-bold">AI Web Discoveries</h2>
          </div>
          {isRefreshing && aiFeeds.length === 0 ? (
            <div className="space-y-6">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}</div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {aiFeeds.map((item, index) => {
                const asset = availableAssets[index % availableAssets.length];
                return (
                  <ContentCard
                    key={`ai-${index}`}
                    title={item.title}
                    creator={item.source}
                    image={{ imageUrl: asset?.imageUrl || 'https://picsum.photos/seed/fallback/800/600', description: item.description, id: `ai-${index}`, imageHint: 'web content', url: item.url } as any}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
