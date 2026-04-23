'use client';
import type { UserProfile } from './types';

// Returns empty array — content comes from Supabase realtime only
export function getRecommendedContent(profile: UserProfile | null | undefined, type: string): any[] {
  return [];
}

export function getPersonalizedFeed(profile: UserProfile | null | undefined): any[] {
  return [];
}
