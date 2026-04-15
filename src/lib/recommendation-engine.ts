'use client';

import { aiDatabase } from './ai-database';
import type { UserProfile } from './types';

/**
 * STARK-B Neural-Sim V2 Recommendation Engine
 * Performs multi-weighted analysis of interests, searches, and watch history.
 * Refined weighting:
 * - Interest Affinity: +3.0 per engagement
 * - Search History: +10.0 per keyword match (High Impact)
 * - Watch History: -2.0 (Variability preference)
 */

export function getRecommendedContent(profile: UserProfile | null, type: 'video' | 'reel' | 'story'): any[] {
  const ageGroup = profile?.ageGroup || '10-16';
  const interests = profile?.interests || {};
  const searchHistory = (profile?.searchHistory || []).map(s => s.toLowerCase());
  const watchHistory = profile?.watchHistory || [];
  
  let pool: any[] = [];
  if (type === 'video') pool = aiDatabase.superdatabasePosts[ageGroup] || [];
  if (type === 'reel') pool = aiDatabase.reels[ageGroup] || [];
  if (type === 'story') pool = aiDatabase.stories[ageGroup] || [];

  if (pool.length === 0) return [];

  const scoredPool = pool.map(item => {
    let score = 0;
    const category = item.category || 'general';
    const title = (item.title || "").toLowerCase();
    const desc = (item.caption || item.description || "").toLowerCase();
    const fullText = `${title} ${desc} ${category}`;

    // 1. Category Affinity (engagement boost)
    score += (interests[category] || 0) * 3.0;

    // 2. Search History Match (intent boost)
    searchHistory.forEach(query => {
      if (fullText.includes(query)) {
        score += 10.0;
      }
    });

    // 3. Watch History (variability factor)
    if (watchHistory.includes(item.id)) {
      score -= 2.0;
    }

    // 4. Random Discovery Bias (entropy)
    score += Math.random() * 5.0;
    
    return {
      ...item,
      algorithmicScore: score
    };
  });

  return scoredPool.sort((a, b) => b.algorithmicScore - a.algorithmicScore);
}

export function getSearchResults(query: string, profile: UserProfile | null): any[] {
  const ageGroup = profile?.ageGroup || '10-16';
  const q = query.toLowerCase();
  
  const allContent = [
    ...(aiDatabase.superdatabasePosts[ageGroup] || []),
    ...(aiDatabase.reels[ageGroup] || []),
    ...(aiDatabase.stories[ageGroup] || [])
  ];

  return allContent.filter(item => 
    item.title?.toLowerCase().includes(q) || 
    item.caption?.toLowerCase().includes(q) ||
    item.description?.toLowerCase().includes(q) ||
    item.category?.toLowerCase().includes(q)
  );
}
