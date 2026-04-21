'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface RealtimeComment {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  text: string;
  created_at: string;
}

export interface RealtimeLike {
  id: string;
  post_id: string;
  user_id: string;
}

export interface RealtimeNotification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'live';
  actor_id: string;
  actor_name: string;
  actor_avatar: string;
  post_id?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface PresenceUser {
  user_id: string;
  user_name: string;
  user_avatar: string;
  online_at: string;
}

// ─── REALTIME COMMENTS ────────────────────────────────────────────────────────
export function useRealtimeComments(postId: string) {
  const [comments, setComments] = useState<RealtimeComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;
    supabase.from('comments').select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setComments(data); setLoading(false); });

    const channel = supabase.channel(`comments-${postId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        (payload) => setComments(prev => [...prev, payload.new as RealtimeComment]))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        (payload) => setComments(prev => prev.filter(c => c.id !== (payload.old as any).id)))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [postId]);

  const addComment = useCallback(async (userId: string, userName: string, userAvatar: string, text: string) => {
    const { data, error } = await supabase.from('comments').insert({
      post_id: postId, user_id: userId, user_name: userName,
      user_avatar: userAvatar, text,
    }).select().single();
    return { data, error };
  }, [postId]);

  return { comments, loading, addComment };
}

// ─── REALTIME LIKES ───────────────────────────────────────────────────────────
export function useRealtimeLikes(postId: string, userId: string) {
  const [likesCount, setLikesCount] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!postId) return;
    // Fetch initial count + check if user liked
    supabase.from('posts').select('likes_count').eq('id', postId).single()
      .then(({ data }) => { if (data) setLikesCount(data.likes_count); });
    if (userId) {
      supabase.from('likes').select('id').eq('post_id', postId).eq('user_id', userId).single()
        .then(({ data }) => setLiked(!!data));
    }

    const channel = supabase.channel(`likes-${postId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts', filter: `id=eq.${postId}` },
        (payload) => { if ((payload.new as any)?.likes_count !== undefined) setLikesCount((payload.new as any).likes_count); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [postId, userId]);

  const toggleLike = useCallback(async () => {
    if (!userId) return;
    if (liked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId);
      setLiked(false);
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: userId });
      setLiked(true);
    }
  }, [postId, userId, liked]);

  return { likesCount, liked, toggleLike };
}

// ─── REALTIME NOTIFICATIONS ───────────────────────────────────────────────────
export function useRealtimeNotifications(userId: string) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    supabase.from('notifications').select('*')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => {
        if (data) {
          setNotifications(data);
          setUnreadCount(data.filter((n: RealtimeNotification) => !n.is_read).length);
        }
      });

    const channel = supabase.channel(`notifications-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications(prev => [payload.new as RealtimeNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const markAllRead = useCallback(async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [userId]);

  return { notifications, unreadCount, markAllRead };
}

// ─── ONLINE PRESENCE ─────────────────────────────────────────────────────────
export function usePresence(userId: string, userName: string, userAvatar: string) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel('online-users', {
      config: { presence: { key: userId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat().map((u: any) => u as PresenceUser);
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        setOnlineUsers(prev => [...prev, ...newPresences as PresenceUser[]]);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const leftIds = (leftPresences as PresenceUser[]).map(u => u.user_id);
        setOnlineUsers(prev => prev.filter(u => !leftIds.includes(u.user_id)));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId, user_name: userName, user_avatar: userAvatar, online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [userId, userName, userAvatar]);

  return { onlineUsers, onlineCount: onlineUsers.length };
}

// ─── TYPING INDICATORS ────────────────────────────────────────────────────────
export function useTypingIndicator(chatId: string, userId: string, userName: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!chatId || !userId) return;

    const channel = supabase.channel(`typing-${chatId}`);
    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id === userId) return;
        setTypingUsers(prev => prev.includes(payload.user_name) ? prev : [...prev, payload.user_name]);
        setTimeout(() => setTypingUsers(prev => prev.filter(u => u !== payload.user_name)), 3000);
      })
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [chatId, userId]);

  const sendTyping = useCallback(() => {
    if (!channelRef.current) return;
    channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { user_id: userId, user_name: userName } });
  }, [userId, userName]);

  return { typingUsers, sendTyping };
}

// ─── LIVE REACTIONS ───────────────────────────────────────────────────────────
export interface LiveReaction {
  id: string;
  emoji: string;
  user_name: string;
  x: number;
}

export function useLiveReactions(postId: string) {
  const [reactions, setReactions] = useState<LiveReaction[]>([]);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!postId) return;
    const channel = supabase.channel(`reactions-${postId}`);
    channel
      .on('broadcast', { event: 'reaction' }, ({ payload }) => {
        const reaction = { ...payload, id: Date.now().toString(), x: Math.random() * 80 + 10 };
        setReactions(prev => [...prev, reaction]);
        setTimeout(() => setReactions(prev => prev.filter(r => r.id !== reaction.id)), 3000);
      })
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [postId]);

  const sendReaction = useCallback((emoji: string, userName: string) => {
    if (!channelRef.current) return;
    channelRef.current.send({ type: 'broadcast', event: 'reaction', payload: { emoji, user_name: userName } });
  }, []);

  return { reactions, sendReaction };
}

// ─── LIVE STREAM VIEWERS ─────────────────────────────────────────────────────
export function useLiveStreamViewers(streamId: string) {
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    if (!streamId) return;
    supabase.from('live_streams').select('viewer_count').eq('id', streamId).single()
      .then(({ data }) => { if (data) setViewerCount(data.viewer_count); });

    const channel = supabase.channel(`stream-${streamId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_streams', filter: `id=eq.${streamId}` },
        (payload) => { if ((payload.new as any)?.viewer_count !== undefined) setViewerCount((payload.new as any).viewer_count); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [streamId]);

  return { viewerCount };
}

// ─── FOLLOWER COUNT ───────────────────────────────────────────────────────────
export function useRealtimeFollowers(userId: string) {
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId)
      .then(({ count }) => setFollowersCount(count || 0));
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId)
      .then(({ count }) => setFollowingCount(count || 0));

    const channel = supabase.channel(`follows-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows', filter: `following_id=eq.${userId}` },
        () => {
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId)
            .then(({ count }) => setFollowersCount(count || 0));
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return { followersCount, followingCount };
}

// ─── APP USERS (realtime registry) ───────────────────────────────────────────
export interface AppUser {
  id: string;
  display_name: string;
  email: string;
  avatar: string;
  age_group: string;
  is_online: boolean;
  last_seen: string;
  created_at: string;
}

export function useAppUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('app_users').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setUsers(data); setLoading(false); });

    const channel = supabase.channel('app-users-all')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'app_users' },
        (payload) => setUsers(prev => [payload.new as AppUser, ...prev]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_users' },
        (payload) => setUsers(prev => prev.map(u => u.id === (payload.new as AppUser).id ? payload.new as AppUser : u)))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { users, loading };
}

export async function upsertAppUser(user: Partial<AppUser> & { id: string }) {
  return supabase.from('app_users').upsert(user, { onConflict: 'id' });
}

// ─── DIRECT MESSAGES ─────────────────────────────────────────────────────────
export interface DirectMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  text: string;
  is_read: boolean;
  delivered: boolean;
  created_at: string;
}

export function useDirectMessages(myId: string, otherId: string) {
  const chatId = [myId, otherId].sort().join('_');
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!myId || !otherId) return;
    supabase.from('direct_messages').select('*')
      .eq('chat_id', chatId).order('created_at', { ascending: true }).limit(100)
      .then(({ data }) => { if (data) setMessages(data); setLoading(false); });

    const channel = supabase.channel(`dm-${chatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `chat_id=eq.${chatId}` },
        (payload) => setMessages(prev => [...prev, payload.new as DirectMessage]))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [myId, otherId, chatId]);

  const sendMessage = useCallback(async (senderId: string, senderName: string, senderAvatar: string, text: string) => {
    return supabase.from('direct_messages').insert({
      chat_id: chatId, sender_id: senderId, sender_name: senderName,
      sender_avatar: senderAvatar, text,
    });
  }, [chatId]);

  const markRead = useCallback(async () => {
    await supabase.from('direct_messages').update({ is_read: true })
      .eq('chat_id', chatId).neq('sender_id', myId).eq('is_read', false);
    setMessages(prev => prev.map(m => m.sender_id !== myId ? { ...m, is_read: true } : m));
  }, [chatId, myId]);

  return { messages, loading, sendMessage, markRead, chatId };
}

// ─── GROUP CHATS ──────────────────────────────────────────────────────────────
export interface GroupChat {
  id: string;
  name: string;
  description: string;
  avatar: string;
  created_by: string;
  age_group: string;
  created_at: string;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  text: string;
  created_at: string;
}

export function useGroupChats(userId: string) {
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    // Get groups user is a member of
    supabase.from('group_members').select('group_id').eq('user_id', userId)
      .then(async ({ data: memberData }) => {
        if (!memberData?.length) { setLoading(false); return; }
        const ids = memberData.map(m => m.group_id);
        const { data } = await supabase.from('group_chats').select('*').in('id', ids).order('created_at', { ascending: false });
        if (data) setGroups(data);
        setLoading(false);
      });

    const channel = supabase.channel(`groups-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_chats' },
        (payload) => setGroups(prev => [payload.new as GroupChat, ...prev]))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const createGroup = useCallback(async (name: string, description: string, createdBy: string, creatorName: string, creatorAvatar: string, memberIds: string[], memberNames: Record<string, string>, memberAvatars: Record<string, string>) => {
    const { data: group, error } = await supabase.from('group_chats').insert({
      name, description, created_by: createdBy,
    }).select().single();
    if (error || !group) return { error };

    // Add all members including creator
    const allMembers = [createdBy, ...memberIds.filter(id => id !== createdBy)];
    await supabase.from('group_members').insert(
      allMembers.map(uid => ({
        group_id: group.id, user_id: uid,
        user_name: uid === createdBy ? creatorName : (memberNames[uid] || 'User'),
        user_avatar: uid === createdBy ? creatorAvatar : (memberAvatars[uid] || ''),
        role: uid === createdBy ? 'admin' : 'member',
      }))
    );
    return { data: group, error: null };
  }, []);

  return { groups, loading, createGroup };
}

export function useGroupMessages(groupId: string) {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    supabase.from('group_messages').select('*')
      .eq('group_id', groupId).order('created_at', { ascending: true }).limit(100)
      .then(({ data }) => { if (data) setMessages(data); setLoading(false); });

    const channel = supabase.channel(`group-msgs-${groupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` },
        (payload) => setMessages(prev => [...prev, payload.new as GroupMessage]))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [groupId]);

  const sendMessage = useCallback(async (senderId: string, senderName: string, senderAvatar: string, text: string) => {
    return supabase.from('group_messages').insert({
      group_id: groupId, sender_id: senderId, sender_name: senderName,
      sender_avatar: senderAvatar, text,
    });
  }, [groupId]);

  return { messages, loading, sendMessage };
}
