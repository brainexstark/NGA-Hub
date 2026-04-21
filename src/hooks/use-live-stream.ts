'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface LiveStream {
  id: string;
  host_id: string;
  host_name: string;
  host_avatar: string;
  title: string;
  age_group: string;
  viewer_count: number;
  is_active: boolean;
  started_at: string;
}

export interface LiveChatMessage {
  id: string;
  stream_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  message: string;
  created_at: string;
}

export function useLiveStream(streamId: string | null) {
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!streamId) return;

    // Fetch stream info
    supabase.from('live_streams').select('*').eq('id', streamId).single()
      .then(({ data }) => { if (data) setStream(data); setLoading(false); });

    // Fetch recent chat
    supabase.from('live_chat').select('*').eq('stream_id', streamId)
      .order('created_at', { ascending: true }).limit(100)
      .then(({ data }) => { if (data) setChatMessages(data); });

    // Realtime chat subscription
    const chatChannel = supabase.channel(`live_chat:${streamId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'live_chat',
        filter: `stream_id=eq.${streamId}`,
      }, (payload) => {
        setChatMessages(prev => [...prev, payload.new as LiveChatMessage]);
      }).subscribe();

    // Realtime stream updates (viewer count, is_active)
    const streamChannel = supabase.channel(`live_stream:${streamId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'live_streams',
        filter: `id=eq.${streamId}`,
      }, (payload) => {
        setStream(payload.new as LiveStream);
      }).subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(streamChannel);
    };
  }, [streamId]);

  const sendMessage = useCallback(async (userId: string, userName: string, userAvatar: string, message: string) => {
    if (!streamId || !message.trim()) return;
    await supabase.from('live_chat').insert({
      stream_id: streamId, user_id: userId,
      user_name: userName, user_avatar: userAvatar, message: message.trim(),
    });
  }, [streamId]);

  return { stream, chatMessages, loading, sendMessage };
}

export async function startLiveStream(hostId: string, hostName: string, hostAvatar: string, title: string, ageGroup: string): Promise<string | null> {
  const { data, error } = await supabase.from('live_streams').insert({
    host_id: hostId, host_name: hostName, host_avatar: hostAvatar,
    title, age_group: ageGroup, viewer_count: 0, is_active: true,
  }).select().single();
  if (error) { console.error('Failed to start stream:', error.message); return null; }
  return data?.id || null;
}

export async function endLiveStream(streamId: string): Promise<void> {
  await supabase.from('live_streams').update({ is_active: false, ended_at: new Date().toISOString() }).eq('id', streamId);
}

export async function incrementViewerCount(streamId: string): Promise<void> {
  await supabase.rpc('increment_viewers', { stream_id: streamId }).catch(() => {
    // Fallback: manual increment
    supabase.from('live_streams').select('viewer_count').eq('id', streamId).single()
      .then(({ data }) => {
        if (data) supabase.from('live_streams').update({ viewer_count: (data.viewer_count || 0) + 1 }).eq('id', streamId);
      });
  });
}

export function useActiveStreams(ageGroup: string) {
  const [streams, setStreams] = useState<LiveStream[]>([]);

  useEffect(() => {
    supabase.from('live_streams').select('*').eq('is_active', true).eq('age_group', ageGroup)
      .order('viewer_count', { ascending: false })
      .then(({ data }) => { if (data) setStreams(data); });

    const channel = supabase.channel(`active_streams:${ageGroup}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_streams' }, () => {
        supabase!.from('live_streams').select('*').eq('is_active', true).eq('age_group', ageGroup)
          .order('viewer_count', { ascending: false })
          .then(({ data }) => { if (data) setStreams(data); });
      }).subscribe();

    return () => { supabase!.removeChannel(channel); };
  }, [ageGroup]);

  return streams;
}
