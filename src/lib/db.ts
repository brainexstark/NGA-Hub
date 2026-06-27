'use client';

/**
 * NGA Hub — Supabase Data Layer
 * Replaces all Firebase/Firestore operations.
 * Provides real-time subscriptions, CRUD, and non-blocking write helpers.
 */

import { supabase } from './supabase';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type DbRecord = Record<string, any> & { id: string };

// ─── Error Handling ────────────────────────────────────────────────────────────

export interface AppEvents {
  'permission-error': DbPermissionError;
}

type Callback<T> = (data: T) => void;

function createEventEmitter<T extends Record<string, any>>() {
  const events: { [K in keyof T]?: Array<Callback<T[K]>> } = {};
  return {
    on<K extends keyof T>(eventName: K, callback: Callback<T[K]>) {
      if (!events[eventName]) events[eventName] = [];
      events[eventName]?.push(callback);
    },
    off<K extends keyof T>(eventName: K, callback: Callback<T[K]>) {
      if (!events[eventName]) return;
      events[eventName] = events[eventName]?.filter(cb => cb !== callback);
    },
    emit<K extends keyof T>(eventName: K, data: T[K]) {
      events[eventName]?.forEach(cb => cb(data));
    },
  };
}

export const errorEmitter = createEventEmitter<AppEvents>();

export class DbPermissionError extends Error {
  public readonly table: string;
  public readonly operation: string;

  constructor({ table, operation }: { table: string; operation: string }) {
    super(`Permission denied: ${operation} on ${table}`);
    this.name = 'DbPermissionError';
    this.table = table;
    this.operation = operation;
  }
}

// ─── Table Name Mapping ────────────────────────────────────────────────────────
// Maps Firestore-style collection paths to Supabase table names

const COLLECTION_MAP: Record<string, string> = {
  users: 'app_users',
  posts: 'posts',
  reels: 'posts',   // reels stored in posts table with type='reel'
  stories: 'stories',
  chats: 'group_chats',
  messages: 'group_messages',
  flagged_content: 'flagged_content',
  app_status: 'app_status',
  notifications: 'notifications',
  lessons: 'lessons',
  follows: 'follows',
  likes: 'likes',
  comments: 'comments',
  direct_messages: 'direct_messages',
};

function resolveTable(collectionPath: string): string {
  // Handle nested paths like 'chats/abc/messages' → 'group_messages'
  const parts = collectionPath.split('/');
  const top = parts[0];
  if (parts.length >= 3) {
    const sub = parts[2];
    if (sub === 'messages') return 'group_messages';
    if (sub === 'comments') return 'comments';
    if (sub === 'followers') return 'follows';
    if (sub === 'following') return 'follows';
  }
  return COLLECTION_MAP[top] || top;
}

// ─── Document Reference (replaces Firestore doc()) ────────────────────────────

export interface DocRef {
  table: string;
  id: string;
  path: string;
}

export function docRef(collectionPath: string, id: string): DocRef {
  return { table: resolveTable(collectionPath), id, path: `${collectionPath}/${id}` };
}

export function colRef(collectionPath: string): { table: string; path: string } {
  return { table: resolveTable(collectionPath), path: collectionPath };
}

// ─── Real-time Document Hook ───────────────────────────────────────────────────

import { useState, useEffect } from 'react';

export function useDoc<T = DbRecord>(ref: DocRef | null) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!ref) { setIsLoading(false); return; }

    // Initial fetch
    supabase.from(ref.table).select('*').eq('id', ref.id).single()
      .then(({ data: row, error: err }) => {
        if (err && err.code !== 'PGRST116') {
          setError(err);
          errorEmitter.emit('permission-error', new DbPermissionError({ table: ref.table, operation: 'get' }));
        }
        setData(row as T | null);
        setIsLoading(false);
      });

    // Real-time subscription
    const channel = supabase
      .channel(`doc-${ref.table}-${ref.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: ref.table,
        filter: `id=eq.${ref.id}`,
      }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setData(null);
        } else {
          setData(payload.new as T);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ref?.table, ref?.id]);

  return { data, isLoading, error };
}

// ─── Real-time Collection Hook ─────────────────────────────────────────────────

export interface CollectionQuery {
  table: string;
  filters?: Record<string, any>;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  limit?: number;
}

export function useCollection<T = DbRecord>(query: CollectionQuery | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!query) { setIsLoading(false); return; }

    const fetchData = async () => {
      let q = supabase.from(query.table).select('*');
      if (query.filters) {
        for (const [key, val] of Object.entries(query.filters)) {
          q = q.eq(key, val) as any;
        }
      }
      if (query.orderBy) {
        q = q.order(query.orderBy, { ascending: query.orderDirection !== 'desc' }) as any;
      }
      if (query.limit) {
        q = q.limit(query.limit) as any;
      }
      const { data: rows, error: err } = await q;
      if (err) {
        setError(err);
        errorEmitter.emit('permission-error', new DbPermissionError({ table: query.table, operation: 'list' }));
      }
      setData((rows as T[]) || []);
      setIsLoading(false);
    };

    fetchData();

    // Real-time subscription
    const channel = supabase
      .channel(`col-${query.table}-${JSON.stringify(query.filters || {})}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: query.table }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [JSON.stringify(query)]);

  return { data, isLoading, error };
}

// ─── Non-blocking Write Helpers ────────────────────────────────────────────────

export function setDocNonBlocking(ref: DocRef, data: any) {
  supabase.from(ref.table).upsert({ id: ref.id, ...data }, { onConflict: 'id' })
    .then(({ error }) => {
      if (error) errorEmitter.emit('permission-error', new DbPermissionError({ table: ref.table, operation: 'write' }));
    });
}

export function addDocNonBlocking(table: string, data: any): Promise<string | null> {
  return Promise.resolve(supabase.from(table).insert(data).select('id').single())
    .then((result: any) => {
      if (result.error) {
        errorEmitter.emit('permission-error', new DbPermissionError({ table, operation: 'create' }));
        return null;
      }
      return result.data?.id || null;
    });
}

export function updateDocNonBlocking(ref: DocRef, data: any) {
  supabase.from(ref.table).update(data).eq('id', ref.id)
    .then(({ error }) => {
      if (error) errorEmitter.emit('permission-error', new DbPermissionError({ table: ref.table, operation: 'update' }));
    });
}

export function deleteDocNonBlocking(ref: DocRef) {
  supabase.from(ref.table).delete().eq('id', ref.id)
    .then(({ error }) => {
      if (error) errorEmitter.emit('permission-error', new DbPermissionError({ table: ref.table, operation: 'delete' }));
    });
}

// ─── Async CRUD ────────────────────────────────────────────────────────────────

export async function getDoc<T = DbRecord>(ref: DocRef): Promise<T | null> {
  const { data, error } = await supabase.from(ref.table).select('*').eq('id', ref.id).single();
  if (error && error.code !== 'PGRST116') return null;
  return data as T | null;
}

export async function setDoc(ref: DocRef, data: any): Promise<void> {
  const { error } = await supabase.from(ref.table).upsert({ id: ref.id, ...data }, { onConflict: 'id' });
  if (error) throw new DbPermissionError({ table: ref.table, operation: 'write' });
}

export async function updateDoc(ref: DocRef, data: any): Promise<void> {
  const { error } = await supabase.from(ref.table).update(data).eq('id', ref.id);
  if (error) throw new DbPermissionError({ table: ref.table, operation: 'update' });
}

export async function addDoc(table: string, data: any): Promise<string> {
  const result: any = await Promise.resolve(supabase.from(table).insert(data).select('id').single());
  if (result.error) throw new DbPermissionError({ table, operation: 'create' });
  return result.data.id as string;
}

export async function deleteDoc(ref: DocRef): Promise<void> {
  const { error } = await supabase.from(ref.table).delete().eq('id', ref.id);
  if (error) throw new DbPermissionError({ table: ref.table, operation: 'delete' });
}

// ─── Server timestamp helper (replaces serverTimestamp()) ─────────────────────
export function serverTimestamp(): string {
  return new Date().toISOString();
}

// ─── Increment helper (replaces Firestore increment()) ────────────────────────
export async function incrementField(ref: DocRef, field: string, amount: number = 1): Promise<void> {
  const { data: current } = await supabase.from(ref.table).select(field).eq('id', ref.id).single();
  if (!current) return;
  const newVal = (current[field] || 0) + amount;
  await supabase.from(ref.table).update({ [field]: newVal }).eq('id', ref.id);
}
