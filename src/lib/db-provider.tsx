'use client';

/**
 * NGA Hub — Database Context Provider
 * Firebase-free replacement for FirebaseProvider / FirebaseClientProvider.
 * Simply provides the supabase client via context (already a singleton, but
 * this maintains the same provider pattern the rest of the app expects).
 */

import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { DbErrorListener } from '../components/DbErrorListener';

interface DbContextState {
  ready: boolean;
}

const DbContext = createContext<DbContextState>({ ready: true });

export function DbProvider({ children }: { children: ReactNode }) {
  const [contextValue] = useState<DbContextState>({ ready: true });

  return (
    <DbContext.Provider value={contextValue}>
      <DbErrorListener />
      {children}
    </DbContext.Provider>
  );
}

export function useDb(): DbContextState {
  return useContext(DbContext);
}

/** 
 * useMemoDb — replaces useMemoFirebase.
 * Provides memoization for derived references (DocRef, CollectionQuery).
 */
import { DependencyList } from 'react';

export function useMemoDb<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
