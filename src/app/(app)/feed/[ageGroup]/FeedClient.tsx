'use client';

import * as React from 'react';
import { ContentCard } from '../../../../components/content-card';
import { Skeleton } from '../../../../components/ui/skeleton';
import { Newspaper, Music, Trophy, Tv, Globe, Flame } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { useRealtimeFeed } from '../../../../hooks/use-realtime-feed';
import { aiDatabase } from '../../../../lib/ai-database';
import type { Post } from '../../../../lib/types';

type AgeGroup = 'under-10' | '10-16' | '16-plus';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Globe },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'entertainment', label: 'Entertainment', icon: Tv },
];

export default function FeedClient({ ageGroup }: { ageGroup: string }) {
  const [activeCategory, setActiveCategory] = React.useState('all');
  const { posts: realtimePosts, loading, newCount, loadNewPosts } = useRealtimeFeed(ageGroup, activeCategory);

  // Static fallback
  const staticPosts = React.useMemo((): Post[] =>
    (aiDatabase.superdatabasePosts[ageGroup as AgeGroup] || []).map(p => ({
      id: p.id, userId: 'system', userName: p.userName,
      userAvatar: `https://picsum.photos/seed/${p.id}/100/100`,
      type: 'video' as const, category: p.category,
      mediaUrl: p.mediaUrl, url: p.url, caption: p.caption,
      title: p.title, ageGroup, likesCount: 0, commentsCount: 0,
      createdAt: new Date(), isFlagged: false,
    })), [ageGroup]);

  const displayPosts = realtimePosts.length > 0 ? realtimePosts : staticPosts;

  return (
    <div className="max-w-2xl mx-auto pb-20 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between px-2 pb-3 sticky top-0 bg-background/90 backdrop-blur-xl z-10 pt-2 border-b border-white/5 mb-4">
        <div>
          <h1 className="font-headline text-2xl font-black tracking-tight text-primary">Live Feed</h1>
          <p className="text-[9px] font-black uppercase tracking-widest text-white/30">
            {realtimePosts.length > 0 ? `${realtimePosts.length} posts` : 'Curated'} ·{' '}
            <span className="text-green-400">● Live</span>
          </p>
        </div>
      </div>

      {/* New posts banner */}
      {newCount > 0 && (
        <button onClick={loadNewPosts}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/30 animate-in slide-in-from-top-2 duration-300 mb-4 mx-auto">
          <Flame className="h-4 w-4" />
          {newCount} new post{newCount > 1 ? 's' : ''} — tap to load
        </button>
      )}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 px-1">
        {CATEGORIES.map((cat) => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-[9px] uppercase tracking-widest whitespace-nowrap transition-all border shrink-0",
              activeCategory === cat.id
                ? "bg-primary text-white border-primary shadow-lg"
                : "bg-white/5 text-white/40 border-white/10 hover:text-white"
            )}>
            <cat.icon className="h-3 w-3" />{cat.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-8 px-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-4 w-32 rounded-full" />
              </div>
              <Skeleton className="h-80 w-full rounded-[2.5rem]" />
            </div>
          ))}
        </div>
      ) : displayPosts.length > 0 ? (
        <div className="space-y-10 px-2">
          {displayPosts.map((post) => (
            <ContentCard key={post.id} id={post.id}
              title={post.title || post.caption} creator={post.userName}
              image={{ imageUrl: post.mediaUrl || `https://picsum.photos/seed/${post.id}/800/800`,
                description: post.caption, id: post.id, imageHint: 'feed post',
                url: post.url || post.mediaUrl, category: post.category } as any}
              likesCount={post.likesCount} commentsCount={post.commentsCount} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border-2 border-dashed rounded-[3rem] opacity-30 space-y-3 mx-2">
          <Globe className="h-10 w-10 mx-auto" />
          <p className="italic font-medium text-sm">No posts yet. Be the first!</p>
        </div>
      )}
    </div>
  );
}
