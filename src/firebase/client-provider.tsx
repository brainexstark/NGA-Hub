'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './init';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * STARK-B SECURE CLIENT PROVIDER
 * Handles initialization only on the client to prevent SSR mismatches.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [services, setServices] = useState<{
    firebaseApp: any;
    auth: any;
    firestore: any;
  } | null>(null);

  useEffect(() => {
    const initialized = initializeFirebase();
    if (initialized) {
      setServices(initialized);
    }
  }, []);

  // During SSR or first render before useEffect, services is null.
  // The FirebaseProvider handles null services by staying in a loading state.
  return (
    <FirebaseProvider
      firebaseApp={services?.firebaseApp}
      auth={services?.auth}
      firestore={services?.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
