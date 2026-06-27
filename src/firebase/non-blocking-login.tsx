'use client';

/**
 * Non-blocking login helpers — already uses Supabase only.
 */
import { supabase } from '../lib/supabase';

export function initiateAnonymousSignIn(): void {
  console.warn('Anonymous sign-in is not supported in this app flow.');
}

export async function initiateEmailSignUp(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) console.error('Auth: Registration failed', error);
}

export async function initiateEmailSignIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) console.error('Auth: Login failed', error);
}
