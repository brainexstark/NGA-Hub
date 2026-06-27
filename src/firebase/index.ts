'use client';

/**
 * NGA Hub Firebase Compatibility Layer
 * ─────────────────────────────────────
 * Firebase has been fully removed. This barrel re-exports the Supabase/db
 * equivalents under the same names so all existing imports keep working
 * without modification.
 *
 * DO NOT add any firebase/* imports here.
 */

// Auth (already Supabase — no changes needed)
export { useAuth, useUser } from '../auth';

// Database context / provider
export { DbProvider as FirebaseProvider, DbProvider as FirebaseClientProvider, useMemoDb as useMemoFirebase } from '../lib/db-provider';

// Database hooks (real-time)
export { useDoc, useCollection } from '../lib/db';

// Write helpers
export {
  setDocNonBlocking as setDocumentNonBlocking,
  addDocNonBlocking as addDocumentNonBlocking,
  updateDocNonBlocking as updateDocumentNonBlocking,
  deleteDocNonBlocking as deleteDocumentNonBlocking,
} from '../lib/db';

// Error system
export { DbPermissionError as FirestorePermissionError, errorEmitter } from '../lib/db';

// useFirestore — returns a truthy sentinel object so existing null-checks pass.
// The actual db operations go directly through the db module.
export function useFirestore() {
  return true as const;
}

export function useFirebaseApp() {
  return null;
}

// Legacy: named FirebaseContext for any stray context imports
export { DbProvider as FirebaseContext } from '../lib/db-provider';
