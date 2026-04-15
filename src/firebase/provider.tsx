'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '../components/FirebaseErrorListener';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp?: FirebaseApp | null;
  firestore?: Firestore | null;
  auth?: Auth | null;
}

interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState extends UserAuthState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

const initialAuthState: UserAuthState = {
  user: null,
  isUserLoading: true,
  userError: null,
};

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export function FirebaseProvider({
  children,
  firebaseApp = null,
  firestore = null,
  auth = null,
}: FirebaseProviderProps) {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>(initialAuthState);

  useEffect(() => {
    if (!auth) {
      if (auth === null) setUserAuthState(prev => ({ ...prev, isUserLoading: false }));
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null }),
      (error) => setUserAuthState({ user: null, isUserLoading: false, userError: error })
    );
    return () => unsubscribe();
  }, [auth]);

  const contextValue = useMemo((): FirebaseContextState => ({
    firebaseApp,
    firestore,
    auth,
    ...userAuthState,
  }), [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = (): FirebaseContextState => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    return {
        firebaseApp: null,
        firestore: null,
        auth: null,
        user: null,
        isUserLoading: true,
        userError: null
    };
  }
  return context;
};

export const useAuth = (): Auth | null => useFirebase().auth;
export const useFirestore = (): Firestore | null => useFirebase().firestore;
export const useFirebaseApp = (): FirebaseApp | null => useFirebase().firebaseApp;

const memoizedRegistry = new WeakMap<object, boolean>();

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  const memoized = useMemo(factory, deps);
  if (memoized && typeof memoized === 'object') {
    memoizedRegistry.set(memoized, true);
  }
  return memoized;
}

export function isMemoized(obj: any): boolean {
  return obj && typeof obj === 'object' && (typeof window === 'undefined' || memoizedRegistry.has(obj));
}

export const useUser = () => { 
  const context = useFirebase();
  return { 
    user: context.user, 
    isUserLoading: context.isUserLoading, 
    userError: context.userError,
    auth: context.auth 
  };
};
