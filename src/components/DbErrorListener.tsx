'use client';

import { useState, useEffect } from 'react';
import { errorEmitter, DbPermissionError } from '../lib/db';

/**
 * Listens for globally emitted 'permission-error' events and surfaces them.
 * Replaces FirebaseErrorListener — no Firebase dependency.
 */
export function DbErrorListener() {
  const [error, setError] = useState<DbPermissionError | null>(null);

  useEffect(() => {
    const handleError = (err: DbPermissionError) => setError(err);
    errorEmitter.on('permission-error', handleError);
    return () => errorEmitter.off('permission-error', handleError);
  }, []);

  if (error) throw error;

  return null;
}
