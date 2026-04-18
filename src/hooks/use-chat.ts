'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, limit, doc, updateDoc, increment } from 'firebase/firestore';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  createdAt: any;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  read: boolean;
}

export function useFirestoreChat(firestore: any, chatId: string | null, userId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !chatId || !userId) { setLoading(false); return; }

    const q = query(
      collection(firestore, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
      setLoading(false);
    }, () => setLoading(false));

    return () => unsub();
  }, [firestore, chatId, userId]);

  const sendMessage = useCallback(async (
    senderId: string, senderName: string, senderAvatar: string,
    text: string, type: 'text' | 'image' | 'file' = 'text',
    fileUrl?: string, fileName?: string
  ) => {
    if (!firestore || !chatId || !text.trim()) return;
    await addDoc(collection(firestore, 'chats', chatId, 'messages'), {
      senderId, senderName, senderAvatar,
      text: text.trim(), type, fileUrl, fileName,
      read: false, createdAt: serverTimestamp(),
    });
    // Update last message on chat doc
    await updateDoc(doc(firestore, 'chats', chatId), {
      lastMessage: text.trim(),
      lastMessageAt: serverTimestamp(),
      [`unread_${senderId}`]: 0,
    }).catch(() => {});
  }, [firestore, chatId]);

  return { messages, loading, sendMessage };
}

export function useRealtimeFollowers(firestore: any, userId: string | null) {
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [disciplesCount, setDisciplesCount] = useState(0);

  useEffect(() => {
    if (!firestore || !userId) return;

    const followersUnsub = onSnapshot(
      collection(firestore, 'users', userId, 'followers'),
      (snap) => setFollowersCount(snap.size)
    );
    const followingUnsub = onSnapshot(
      collection(firestore, 'users', userId, 'following'),
      (snap) => setFollowingCount(snap.size)
    );
    const disciplesUnsub = onSnapshot(
      collection(firestore, 'users', userId, 'disciples_of'),
      (snap) => setDisciplesCount(snap.size)
    );

    return () => { followersUnsub(); followingUnsub(); disciplesUnsub(); };
  }, [firestore, userId]);

  const follow = useCallback(async (targetUserId: string, targetName: string, targetAvatar: string) => {
    if (!firestore || !userId) return;
    const { addDoc: add, doc: d, setDoc } = await import('firebase/firestore');
    // Add to my following
    await setDoc(doc(firestore, 'users', userId, 'following', targetUserId), {
      userId: targetUserId, displayName: targetName, profilePicture: targetAvatar,
      followedAt: serverTimestamp(),
    });
    // Add to their followers
    await setDoc(doc(firestore, 'users', targetUserId, 'followers', userId), {
      userId, followedAt: serverTimestamp(),
    });
    // Update counts
    await updateDoc(doc(firestore, 'users', userId), { followingCount: increment(1) }).catch(() => {});
    await updateDoc(doc(firestore, 'users', targetUserId), { followersCount: increment(1) }).catch(() => {});
  }, [firestore, userId]);

  return { followersCount, followingCount, disciplesCount, follow };
}
