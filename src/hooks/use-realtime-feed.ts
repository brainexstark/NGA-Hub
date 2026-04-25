'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, type SupabasePost } from '../lib/supabase';
import type { Post } from '../lib/types';

export function useRealtimeFeed(ageGroup: string, category: string = 'all') {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const isFirstLoad = useRef(true);

  const mapSupabasePost = (p: SupabasePost): Post => ({
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
  });

  useEffect(() => {
    isFirstLoad.current = true;
    setLoading(true);
    setPosts([]);
    setNewCount(0);
    setPendingPosts([]);

    // Initial fetch
    const fetchPosts = async () => {
      try {
        let q = supabase
          .from('posts')
          .select('*')
          .eq('age_group', ageGroup)
          .eq('is_flagged', false)
          .order('created_at', { ascending: false })
          .limit(50);

        if (category !== 'all') q = q.eq('category', category);

        const { data, error } = await q;
        if (error) console.warn('Supabase fetch error:', error.message);
        if (data && data.length > 0) {
          setPosts(data.map(mapSupabasePost));
        }
        // If Supabase returns nothing with age_group filter,
        // fetch ALL posts (covers early posts before age_group was required)
        if (!data || data.length === 0) {
          const { data: allData } = await supabase
            .from('posts')
            .select('*')
            .eq('is_flagged', false)
            .order('created_at', { ascending: false })
            .limit(50);
          if (allData && allData.length > 0) {
            setPosts(allData.map(mapSupabasePost));
          }
        }
      } catch (e) {
        console.warn('Supabase fetch failed:', e);
      } finally {
        setLoading(false);
        isFirstLoad.current = false;
      }
    };

    fetchPosts();

    // Realtime subscription for new inserts
    const channelName = `posts-${ageGroup}-${category}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: `age_group=eq.${ageGroup}`,
        },
        (payload) => {
          const newPost = mapSupabasePost(payload.new as SupabasePost);
          if (category !== 'all' && newPost.category !== category) return;
          if (isFirstLoad.current) return;
          // New posts go to the TOP immediately
          setPosts(prev => [newPost, ...prev]);
          setNewCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
          filter: `age_group=eq.${ageGroup}`,
        },
        (payload) => {
          const updated = mapSupabasePost(payload.new as SupabasePost);
          setPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime subscribed:', channelName);
        }
        if (status === 'CHANNEL_ERROR') {
          console.warn('Realtime channel error:', channelName);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
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
      media_url: post.mediaUrl,
      video_url: post.url || post.mediaUrl,
      category: post.category || 'general',
      age_group: post.ageGroup || '10-16',
      likes_count: 0,
      comments_count: 0,
      is_flagged: false,
    }).select().single();
    if (data) {
      results.push(data.id);
      // Broadcast notification to all users about new post
      const { broadcastNotification } = await import('../lib/ads');
      broadcastNotification({
        type: 'system',
        actorId: post.userId,
        actorName: post.userName,
        actorAvatar: post.userAvatar || '',
        message: `${post.userName} posted something new — check it out!`,
        postId: data.id,
      });
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
