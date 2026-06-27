'use client';

/**
 * Firestore non-blocking updates removed — re-exports Supabase DB helpers.
 */
export {
  setDocNonBlocking as setDocumentNonBlocking,
  addDocNonBlocking as addDocumentNonBlocking,
  updateDocNonBlocking as updateDocumentNonBlocking,
  deleteDocNonBlocking as deleteDocumentNonBlocking,
} from '../lib/db';
