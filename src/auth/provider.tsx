'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL: string | null;
  emailVerified: boolean;
}

interface AuthContextState {
  user: AuthUser | null;
  isUserLoading: boolean;
  session: Session | null;
  auth: typeof supabase.auth;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

function mapSupabaseUser(user: User | null): AuthUser | null {
  if (!user) return null;
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'NGA User';
  const photoURL =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.photo_url ||
    null;

  return {
    uid: user.id,
    email: user.email,
    displayName,
    photoURL,
    emailVerified: !!user.email_confirmed_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    user: AuthUser | null;
    session: Session | null;
    isUserLoading: boolean;
  }>({ user: null, session: null, isUserLoading: true });

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setState({
        user: mapSupabaseUser(data.session?.user ?? null),
        session: data.session,
        isUserLoading: false,
      });
    };

    initialize();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setState({
        user: mapSupabaseUser(session?.user ?? null),
        session,
        isUserLoading: false,
      });
    });

    return () => {
      active = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  const value = useMemo(
    () => ({ ...state, auth: supabase.auth }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context.auth;
}

export function useUser() {
  const context = useContext(AuthContext);
  if (!context) {
    return { user: null, isUserLoading: true, session: null };
  }
  return { user: context.user, isUserLoading: context.isUserLoading, session: context.session };
}
