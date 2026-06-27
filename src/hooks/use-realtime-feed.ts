'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, type SupabasePost } from '../lib/supabase';
import type { Post } from '../lib/types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rhdfnxrbbzaqcedwgsfm.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoZGZueHJiYnphcWNlZHdnc2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3OTc3MzQsImV4cCI6MjA5MjM3MzczNH0.m4I6dkc9Jw6McuBFjQYbnLce9_7Lo0fJOphC3VEBhZw';

// Ultra-fast direct REST fetch — bypasses SDK overhead entirely
// Only selects columns the feed actually uses — keeps payload tiny
const FEED_COLUMNS = 'id,user_id,user_name,user_avatar,title,caption,media_url,video_url,category,age_group,likes_count,comments_count,created_at,is_flagged';

async function fastFetchPosts(ageGroup: string, category: string): Promise<SupabasePost[]> {
  try {
    const params = new URLSearchParams({
      select: FEED_COLUMNS,
      is_flagged: 'neq.true',
      order: 'created_at.desc',
      limit: '30',
    });
    if (category !== 'all') params.append('category', `eq.${category}`);

    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    };

    // Strictly fetch only posts for this age group — no cross-group fallback
    const res = await fetch(`${SUPABASE_URL}/rest/v1/posts?age_group=eq.${ageGroup}&${params}`, { headers });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function mapPost(p: SupabasePost): Post {
  return {
    id: p.id,
    userId: p.user_id,
    userName: p.user_name,
    userAvatar: p.user_avatar,
    type: 'video',
    category: p.category,
    mediaUrl: p.media_url,
    url: p.video_url || p.media_url,
    caption: p.caption,
    title: p.title,
    ageGroup: p.age_group,
    likesCount: p.likes_count,
    commentsCount: p.comments_count,
    createdAt: new Date(p.created_at),
    isFlagged: p.is_flagged,
  };
}

// Simple in-memory cache so posts appear instantly on revisit
const postsCache = new Map<string, Post[]>();

export function useRealtimeFeed(ageGroup: string, category: string = 'all') {
  const cacheKey = `${ageGroup}-${category}`;
  const [posts, setPosts] = useState<Post[]>(() => postsCache.get(cacheKey) || []);
  const [loading, setLoading] = useState(!postsCache.has(cacheKey));
  const [newCount, setNewCount] = useState(0);
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    isFirstLoad.current = true;
    // Only show loading spinner if we have no cached data
    if (!postsCache.has(cacheKey)) setLoading(true);
    setNewCount(0);
    setPendingPosts([]);

    // Fast REST fetch — typically responds in 200-500ms
    fastFetchPosts(ageGroup, category).then(data => {
      const mapped = data.map(mapPost);
      if (mapped.length > 0) {
        setPosts(mapped);
        postsCache.set(cacheKey, mapped); // cache for instant re-render
      }
      setLoading(false);
      isFirstLoad.current = false;
    });

    // Realtime subscription for live new posts
    const channelName = `posts-feed-${ageGroup}-${category}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts', filter: `age_group=eq.${ageGroup}` },
        (payload) => {
          const newPost = mapPost(payload.new as SupabasePost);
          if (category !== 'all' && newPost.category !== category) return;
          if (isFirstLoad.current) return;
          setPosts(prev => [newPost, ...prev]);
          setNewCount(prev => prev + 1);
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts', filter: `age_group=eq.${ageGroup}` },
        (payload) => {
          const updated = mapPost(payload.new as SupabasePost);
          setPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ageGroup, category]);

  const loadNewPosts = useCallback(() => {
    setPosts(prev => [...pendingPosts, ...prev]);
    setPendingPosts([]);
    setNewCount(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pendingPosts]);

  return { posts, loading, newCount, loadNewPosts };
}

// Publish a post to Supabase
// Stories go to the `stories` table; everything else goes to `posts`
export async function publishPost(post: Omit<Post, 'id' | 'createdAt'>, _firestore?: any) {
  const results: string[] = [];

  const isStory = post.type === 'story';

  if (isStory) {
    // Stories live in a separate table with a 24-hour TTL
    try {
      const { data, error } = await supabase.from('stories').insert({
        user_id: post.userId || 'anonymous',
        user_name: post.userName || 'User',
        user_avatar: post.userAvatar || '',
        media_url: post.mediaUrl || post.url || '',
        caption: post.caption || '',
        age_group: post.ageGroup || '14-17',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        views_count: 0,
      }).select().single();

      if (data) results.push(data.id);
      if (error) console.warn('Story insert error:', error.message);
    } catch (e) {
      console.warn('Story publish failed:', e);
    }
    return results[0] || null;
  }

  try {
    // Category routing: lesson-category posts also write to lessons table
    const isLesson = post.category === 'lesson' || post.category === 'education' || (post.type as string) === 'lesson';

    const { data, error } = await supabase.from('posts').insert({
      user_id: post.userId || 'anonymous',
      user_name: post.userName || 'User',
      user_avatar: post.userAvatar || '',
      title: post.title || post.caption,
      caption: post.caption,
      media_url: post.mediaUrl || post.url || '',
      video_url: post.url || post.mediaUrl || '',
      category: post.category || 'general',
      age_group: post.ageGroup || '14-17',
      likes_count: 0,
      comments_count: 0,
      is_flagged: false,
    }).select().single();

    if (data) {
      results.push(data.id);

      // If it's a lesson, also write to the lessons table so Learning Hub picks it up
      if (isLesson) {
        try {
          await supabase.from('lessons').insert({
            user_id: post.userId || 'anonymous',
            topic: post.title || post.caption,
            age_group: post.ageGroup || '14-17',
            lesson_plan: JSON.stringify({
              title: post.title || post.caption,
              url: post.url || post.mediaUrl,
              mediaUrl: post.mediaUrl,
              caption: post.caption,
              post_id: data.id,
            }),
          });
        } catch {}
      }

      try {
        const { broadcastNotification } = await import('../lib/ads');
        broadcastNotification({
          type: 'system',
          actorId: post.userId,
          actorName: post.userName,
          actorAvatar: post.userAvatar || '',
          message: `${post.userName} posted something new — check it out!`,
          postId: data.id,
          ageGroup: post.ageGroup,
        });
      } catch {}
    }
    if (error) console.warn('Supabase insert error:', error.message);
  } catch (e) {
    console.warn('Supabase publish failed:', e);
  }

  return results[0] || null;
}
