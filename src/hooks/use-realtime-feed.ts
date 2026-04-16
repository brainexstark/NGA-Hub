'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, type SupabasePost } from '../lib/supabase';
import { useFirestore } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import type { Post } from '../lib/types';

export function useRealtimeFeed(ageGroup: string, category: string = 'all') {
  const firestore = useFirestore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const isFirstLoad = { current: true };

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

  // Supabase realtime
  useEffect(() => {
    if (!supabase) return;

    // Initial fetch
    const fetchPosts = async () => {
      let q = supabase
        .from('posts')
        .select('*')
        .eq('age_group', ageGroup)
        .eq('is_flagged', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (category !== 'all') q = q.eq('category', category);

      const { data } = await q;
      if (data) {
        setPosts(data.map(mapSupabasePost));
        setLoading(false);
        isFirstLoad.current = false;
      }
    };

    fetchPosts();

    // Realtime subscription
    const channel = supabase
      .channel(`posts:${ageGroup}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
        filter: `age_group=eq.${ageGroup}`,
      }, (payload) => {
        const newPost = mapSupabasePost(payload.new as SupabasePost);
        if (category !== 'all' && newPost.category !== category) return;
        setPendingPosts(prev => [newPost, ...prev]);
        setNewCount(prev => prev + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ageGroup, category]);

  // Firestore fallback when Supabase not configured
  useEffect(() => {
    if (supabase || !firestore) return;

    const postsRef = collection(firestore, 'posts');
    const constraints: any[] = [
      where('ageGroup', '==', ageGroup),
      orderBy('createdAt', 'desc'),
      limit(50),
    ];
    if (category !== 'all') constraints.splice(1, 0, where('category', '==', category));

    const q = query(postsRef, ...constraints);
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
      if (isFirstLoad.current) {
        setPosts(data);
        setLoading(false);
        isFirstLoad.current = false;
      } else {
        const newOnes = data.filter(p => !posts.find(r => r.id === p.id));
        if (newOnes.length > 0) {
          setPendingPosts(data);
          setNewCount(newOnes.length);
        }
      }
    }, () => setLoading(false));

    return () => unsub();
  }, [firestore, ageGroup, category]);

  const loadNewPosts = useCallback(() => {
    setPosts(pendingPosts);
    setPendingPosts([]);
    setNewCount(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pendingPosts]);

  return { posts, loading, newCount, loadNewPosts };
}

// Publish a post to Supabase + Firestore
export async function publishPost(post: Omit<Post, 'id' | 'createdAt'>, firestore: any) {
  const results: string[] = [];

  // Supabase
  if (supabase) {
    const { data, error } = await supabase.from('posts').insert({
      user_id: post.userId,
      user_name: post.userName,
      user_avatar: post.userAvatar || '',
      title: post.title || post.caption,
      caption: post.caption,
      media_url: post.mediaUrl,
      video_url: post.url,
      category: post.category || 'general',
      age_group: post.ageGroup,
      likes_count: 0,
      comments_count: 0,
      is_flagged: false,
    }).select().single();
    if (data) results.push(data.id);
    if (error) console.warn('Supabase insert error:', error.message);
  }

  // Firestore (always as backup)
  if (firestore) {
    const { collection: col, addDoc, serverTimestamp } = await import('firebase/firestore');
    const ref = await addDoc(col(firestore, 'posts'), {
      ...post,
      isFlagged: false,
      createdAt: serverTimestamp(),
    });
    results.push(ref.id);
  }

  return results[0] || null;
}
