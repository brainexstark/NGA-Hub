'use client';

/**
 * NGA HUB FIREBASE NODE EXPORTS
 * DEPLOYMENT: STATIC SYNC STABILIZATION (v2.0)
 */

export { initializeFirebase } from './init';
export { 
  FirebaseProvider, 
  useFirebase, 
  useAuth, 
  useFirestore, 
  useFirebaseApp, 
  useMemoFirebase,
  useUser,
  FirebaseContext
} from './provider';
export { FirebaseClientProvider } from './client-provider';

// One-time fetch utilities should be imported directly from firebase/firestore where needed.
// Real-time hooks have been neutralized.
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';

export { 
  setDocumentNonBlocking, 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking, 
  deleteDocumentNonBlocking 
} from './non-blocking-updates';
export { FirestorePermissionError } from './errors';
export { errorEmitter } from './error-emitter';
