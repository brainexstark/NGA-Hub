'use client';

/**
 * Firebase provider removed — re-exports Supabase DB provider.
 * Kept as a shim for backward-compatible imports.
 */

export { DbProvider as FirebaseProvider, useMemoDb as useMemoFirebase } from '../lib/db-provider';
export { useAuth, useUser } from '../auth';

export function useFirebase() {
  return { firebaseApp: null, firestore: null };
}

export function useFirestore() {
  return true as const;
}

export function useFirebaseApp() {
  return null;
}

export function isMemoized(_obj: any): boolean {
  return true;
}

export const FirebaseContext = null;
