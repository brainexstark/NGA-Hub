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
      is_flagged: 'eq.false',
      order: 'created_at.desc',
      limit: '30',
    });
    if (category !== 'all') params.append('category', `eq.${category}`);

    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Accept-Profile': 'public',
    };

    const [ageRes, allRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/posts?age_group=eq.${ageGroup}&${params}`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/posts?${params}`, { headers }),
    ]);

    const [agePosts, allPosts]: [SupabasePost[], SupabasePost[]] = await Promise.all([
      ageRes.ok ? ageRes.json() : [],
      allRes.ok ? allRes.json() : [],
    ]);

    return agePosts.length > 0 ? agePosts : allPosts;
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

export function useRealtimeFeed(ageGroup: string, category: string = 'all') {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    isFirstLoad.current = true;
    setLoading(true);
    setPosts([]);
    setNewCount(0);
    setPendingPosts([]);

    // Fast REST fetch — typically responds in 200-500ms
    fastFetchPosts(ageGroup, category).then(data => {
      if (data.length > 0) setPosts(data.map(mapPost));
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
export async function publishPost(post: Omit<Post, 'id' | 'createdAt'>, firestore: any) {
  const results: string[] = [];

  try {
    const { data, error } = await supabase.from('posts').insert({
      user_id: post.userId || 'anonymous',
      user_name: post.userName || 'User',
      user_avatar: post.userAvatar || '',
      title: post.title || post.caption,
      caption: post.caption,
      media_url: post.mediaUrl || post.url || '',
      video_url: post.url || post.mediaUrl || '',
      category: post.category || 'general',
      age_group: post.ageGroup || '10-16',
      likes_count: 0,
      comments_count: 0,
      is_flagged: false,
    }).select().single();

    if (data) {
      results.push(data.id);
      try {
        const { broadcastNotification } = await import('../lib/ads');
        broadcastNotification({
          type: 'system',
          actorId: post.userId,
          actorName: post.userName,
          actorAvatar: post.userAvatar || '',
          message: `${post.userName} posted something new — check it out!`,
          postId: data.id,
        });
      } catch {}
    }
    if (error) console.warn('Supabase insert error:', error.message);
  } catch (e) {
    console.warn('Supabase publish failed:', e);
  }

  // Firestore backup
  if (firestore) {
    try {
      const { collection: col, addDoc, serverTimestamp } = await import('firebase/firestore');
      const ref = await addDoc(col(firestore, 'posts'), {
        ...post,
        isFlagged: false,
        createdAt: serverTimestamp(),
      });
      results.push(ref.id);
    } catch (e) {
      console.warn('Firestore publish failed:', e);
    }
  }

  return results[0] || null;
}
