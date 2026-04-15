'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, Query, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';
import { isMemoized } from '../provider';

/**
 * STARK-B High-Performance Collection Hook
 * Synchronizes real-time data streams from the Firestore matrix.
 */
export function useCollection<T = DocumentData>(query: Query | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!query) {
      setIsLoading(false);
      return;
    }

    if (!isMemoized(query)) {
      console.warn("STARK-B Node Warning: Query is not memoized. This may cause synchronization loops.");
    }

    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        })) as T[];
        setData(items);
        setIsLoading(false);
      },
      async (err) => {
        const permissionError = new FirestorePermissionError({
          path: (query as any)._query?.path?.segments?.join('/') || 'unknown',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, isLoading, error };
}
