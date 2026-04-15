'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, Query, DocumentData } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';
import { isMemoized } from '../provider';

/**
 * STARK-B Specialized Dropdown Hook
 * Optimized for high-performance selection matrices and lists.
 */
export function useCollectionDropdownFull<T = DocumentData>(options: { path: Query | null }) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const queryNode = options.path;
    if (!queryNode) {
      setLoading(false);
      return;
    }

    if (!isMemoized(queryNode)) {
        console.warn("STARK-B Node: Dropdown Query is not memoized.");
    }

    const unsubscribe = onSnapshot(
      queryNode,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setItems(data);
        setLoading(false);
      },
      (err) => {
        const permissionError = new FirestorePermissionError({
          path: (queryNode as any)._query?.path?.segments?.join('/') || 'unknown',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [options.path]);

  return { items, loading, error, empty: items.length === 0 };
}
