'use client';
import { useState, useEffect } from 'react';

const CACHE_KEY = 'nga-offline-reels';
const CACHE_DATE_KEY = 'nga-offline-reels-date';
const MAX_CACHED = 25;

export function useOfflineReels(onlineReels: any[]) {
  const [offlineReels, setOfflineReels] = useState<any[]>([]);
  const [cacheDate, setCacheDate] = useState<string>('');

  useEffect(() => {
    // Load existing cache
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const date = localStorage.getItem(CACHE_DATE_KEY);
      if (cached) setOfflineReels(JSON.parse(cached));
      if (date) setCacheDate(date);
    } catch {}
  }, []);

  useEffect(() => {
    if (!onlineReels.length) return;
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem(CACHE_DATE_KEY);
    
    // Renew cache daily when online
    if (lastDate !== today) {
      // Take first 25 reels (metadata only — no actual video blobs, just URLs)
      const toCache = onlineReels.slice(0, MAX_CACHED).map(r => ({
        id: r.id,
        url: r.url || r.imageUrl,
        description: r.description || r.caption,
        userName: r.userName,
        userAvatar: r.userAvatar,
        category: r.category,
      }));
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(toCache));
        localStorage.setItem(CACHE_DATE_KEY, today);
        setOfflineReels(toCache);
        setCacheDate(today);
      } catch {}
    }
  }, [onlineReels]);

  const isFromToday = cacheDate === new Date().toDateString();
  
  return { offlineReels, cacheDate, isFromToday };
}
