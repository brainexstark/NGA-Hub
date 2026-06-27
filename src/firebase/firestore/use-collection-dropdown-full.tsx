'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

/**
 * useCollectionDropdownFull — Supabase dropdown list hook.
 * Replaces the Firestore-based dropdown hook.
 */
export function useCollectionDropdownFull<T = Record<string, any>>(options: {
  path: { table: string; filters?: Record<string, any>; orderBy?: string } | null;
}) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const q = options.path;
    if (!q) { setLoading(false); return; }

    let query = supabase.from(q.table).select('*');
    if (q.filters) {
      for (const [key, val] of Object.entries(q.filters)) {
        query = query.eq(key, val) as any;
      }
    }
    if (q.orderBy) query = query.order(q.orderBy) as any;

    query.then(({ data, error: err }) => {
      if (err) setError(err);
      setItems((data as T[]) || []);
      setLoading(false);
    });

    const channel = supabase.channel(`dropdown-${q.table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: q.table }, () => {
        query.then(({ data }) => { if (data) setItems(data as T[]); });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [JSON.stringify(options.path)]);

  return { items, loading, error, empty: items.length === 0 };
}
