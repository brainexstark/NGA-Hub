'use client';

import * as React from 'react';
import { useOfflineReels } from '../../../hooks/use-offline-reels';
import { useRealtimeFeed } from '../../../hooks/use-realtime-feed';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '../../../firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '../../../lib/types';
import { WifiOff, RefreshCw, PlayCircle, Lock } from 'lucide-react';
import { cn } from '../../../lib/utils';

export default function OfflineReelsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const profileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: profile } = useDoc<UserProfile>(profileRef);
  const ageGroup = profile?.ageGroup || '14-17';

  const { posts: onlinePosts } = useRealtimeFeed(ageGroup);
  const { offlineReels, cacheDate, isFromToday } = useOfflineReels(onlinePosts);

  return (
    <div className="min-h-screen p-4 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
          <WifiOff className="h-3 w-3" /> Offline Reels
        </div>
        <h1 className="font-headline text-4xl font-black uppercase tracking-tighter">Saved for Offline</h1>
        <p className="text-white/50 text-sm font-medium">
          {isFromToday
            ? `✅ Cache updated today — ${offlineReels.length} reels saved`
            : cacheDate
            ? `📅 Last updated: ${cacheDate}`
            : '📭 No offline cache yet — go online to save reels'}
        </p>
      </div>

      {/* Paywall Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 p-5 flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
          <Lock className="h-5 w-5 text-indigo-400" />
        </div>
        <div className="space-y-1">
          <p className="font-black text-sm text-white uppercase tracking-tight">Unlock Offline Viewing</p>
          <p className="text-white/50 text-xs leading-relaxed">
            Full offline reel downloads for just <span className="text-indigo-400 font-black">$0.02/day</span> — coming soon with M-Pesa &amp; Stripe integration.
          </p>
        </div>
      </div>

      {/* Reels Grid */}
      {offlineReels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
          <div className="p-5 rounded-[2rem] bg-white/5 border border-white/10">
            <WifiOff className="h-12 w-12 text-white/20" />
          </div>
          <p className="font-black text-white/40 uppercase tracking-widest text-sm">No Cached Reels</p>
          <p className="text-white/30 text-xs max-w-xs">
            Browse the feed while online and your top 25 reels will be saved automatically each day.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {offlineReels.map((reel, i) => (
            <div
              key={reel.id || i}
              className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 group cursor-pointer hover:border-primary/30 transition-all"
            >
              {reel.url ? (
                <img
                  src={reel.url}
                  alt={reel.description || 'Reel'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PlayCircle className="h-8 w-8 text-white/20" />
                </div>
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-200">
                {reel.userName && (
                  <p className="text-[10px] font-black text-white/80 uppercase tracking-tight truncate">@{reel.userName}</p>
                )}
                {reel.description && (
                  <p className="text-[9px] text-white/50 line-clamp-2 mt-0.5">{reel.description}</p>
                )}
              </div>
              {/* Offline badge */}
              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/60 border border-white/10">
                <WifiOff className="h-2.5 w-2.5 text-white/50" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Update note */}
      <p className="text-center text-[10px] text-white/20 font-medium uppercase tracking-widest pb-8">
        Updated daily when online · Metadata only · No video downloads
      </p>
    </div>
  );
}
