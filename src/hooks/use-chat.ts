'use client';

/**
 * use-chat.ts — Supabase replacement for Firebase Firestore chat hooks.
 * Uses the Supabase realtime hooks from use-realtime.ts.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  createdAt: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  read: boolean;
}

/**
 * useSupabaseChat — replaces useFirestoreChat.
 * Provides real-time messages for a group chat room.
 */
export function useFirestoreChat(_firestore: any, chatId: string | null, userId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId || !userId) { setLoading(false); return; }

    supabase.from('group_messages').select('*')
      .eq('group_id', chatId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (data) setMessages(data.map(mapMessage));
        setLoading(false);
      });

    const channel = supabase.channel(`chat-${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'group_messages',
        filter: `group_id=eq.${chatId}`,
      }, (payload) => {
        setMessages(prev => [...prev, mapMessage(payload.new as any)]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chatId, userId]);

  const sendMessage = useCallback(async (
    senderId: string, senderName: string, senderAvatar: string,
    text: string, type: 'text' | 'image' | 'file' = 'text',
    fileUrl?: string, fileName?: string
  ) => {
    if (!chatId || !text.trim()) return;
    await supabase.from('group_messages').insert({
      group_id: chatId,
      sender_id: senderId,
      sender_name: senderName,
      sender_avatar: senderAvatar,
      text: text.trim(),
    });
  }, [chatId]);

  return { messages, loading, sendMessage };
}

function mapMessage(row: any): ChatMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderAvatar: row.sender_avatar,
    text: row.text,
    createdAt: row.created_at,
    type: 'text',
    read: false,
  };
}

/**
 * useRealtimeFollowers — Supabase replacement for Firebase followers hook.
 */
export function useRealtimeFollowers(firestore: any, userId: string | null) {
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [disciplesCount, setDisciplesCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const fetchCounts = () => {
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId)
        .then(({ count }) => setFollowersCount(count || 0));
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId)
        .then(({ count }) => setFollowingCount(count || 0));
    };
    fetchCounts();

    const channel = supabase.channel(`follows-counts-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows', filter: `following_id=eq.${userId}` }, fetchCounts)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const follow = useCallback(async (targetUserId: string, targetName: string, targetAvatar: string) => {
    if (!userId) return;
    await supabase.from('follows').upsert(
      { follower_id: userId, following_id: targetUserId },
      { onConflict: 'follower_id,following_id' }
    );
  }, [userId]);

  return { followersCount, followingCount, disciplesCount, follow };
}
