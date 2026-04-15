'use client';

import * as React from 'react';
import { ContentCard } from '../../../../components/content-card';
import { PlaceHolderImages } from '../../../../lib/placeholder-images';
import { Skeleton } from '../../../../components/ui/skeleton';
import { Loader2, RefreshCw, Sparkles, Database } from 'lucide-react';
import { recommendContent, type ContentRecommendationOutput } from '../../../../ai/flows/content-recommendation';
import { Button } from '../../../../components/ui/button';
import { aiDatabase } from '../../../../lib/ai-database';

type AgeGroup = 'under-10' | '10-16' | '16-plus';

const AGE_MAP: Record<AgeGroup, number> = {
  'under-10': 8,
  '10-16': 13,
  '16-plus': 20,
};

export default function FeedClient({ ageGroup }: { ageGroup: string }) {
  const [aiFeeds, setAiFeeds] = React.useState<ContentRecommendationOutput['recommendations']>([]);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const localPosts = React.useMemo(() => {
    return aiDatabase.superdatabasePosts[ageGroup as AgeGroup] || [];
  }, [ageGroup]);

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
      (img.id.startsWith('content-') || img.id.startsWith('reel-') || img.id.startsWith('mbita-'))
    );
    return primary.length > 0 ? primary : PlaceHolderImages;
  }, []);

  return (
    <div className="container mx-auto max-w-3xl space-y-10 pb-20 pt-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
            <h1 className="font-headline text-5xl font-bold tracking-tight text-primary">Live Super Feed</h1>
            <p className="text-muted-foreground text-lg font-medium italic text-white/60">Imported from AI Aggregator</p>
        </div>
        <Button onClick={refreshAiFeeds} disabled={isRefreshing} className="rounded-full h-12 px-6 font-bold shadow-lg">
            {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh Discoveries
        </Button>
      </header>
      
      <div className="space-y-12">
        <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-primary/10 pb-4">
                <div className="bg-primary/10 p-2 rounded-lg"><Database className="h-6 w-6 text-primary" /></div>
                <h2 className="font-headline text-2xl font-bold">Superdatabase Video Feed</h2>
            </div>
            {localPosts.length > 0 ? (
                <div className="grid grid-cols-1 gap-8">
                    {localPosts.map((post) => (
                        <ContentCard key={post.id} id={post.id} title={post.title} creator={post.userName} image={{ imageUrl: post.mediaUrl, description: post.caption, id: post.id, imageHint: 'video content', url: post.url } as any} />
                    ))}
                </div>
            ) : (
                <div className="py-12 text-center border-2 border-dashed rounded-3xl opacity-50"><p className="italic">Awaiting localized records...</p></div>
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
                        const asset = (availableAssets && availableAssets.length > 0) ? availableAssets[index % availableAssets.length] : (PlaceHolderImages[0]);
                        return <ContentCard key={`ai-${index}`} title={item.title} creator={item.source} image={{ imageUrl: asset?.imageUrl || 'https://picsum.photos/seed/fallback/800/600', description: item.description, id: `ai-${index}`, imageHint: 'web content', url: item.url } as any} />;
                    })}
                </div>
            )}
        </section>
      </div>
    </div>
  );
}
