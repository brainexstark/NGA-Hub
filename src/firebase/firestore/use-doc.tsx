'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, DocumentReference, DocumentData, DocumentSnapshot } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';
import { isMemoized } from '../provider';

/**
 * STARK-B High-Performance Document Hook
 * Synchronizes real-time node data for individual document references.
 */
export function useDoc<T = DocumentData>(docRef: DocumentReference | null) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!docRef) {
      setIsLoading(false);
      return;
    }

    if (!isMemoized(docRef)) {
      console.warn("STARK-B Node Warning: DocumentReference is not memoized.");
    }

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...(snapshot.data() as any) } as T);
        } else {
          setData(null);
        }
        setIsLoading(false);
      },
      async (err) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docRef]);

  return { data, isLoading, error };
}
