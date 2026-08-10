'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "../../components/logo";
import { Loader2, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../hooks/use-toast";
import { AnimatedBg } from "../../components/animated-bg";

export default function SignInPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => { setMounted(true); }, []);

  // Handle Google OAuth redirect result on page load
  useEffect(() => {
    if (!mounted) return;
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        // Check if user has a profile with age_group
        const { data: profile } = await supabase
          .from('app_users').select('age_group').eq('id', session.user.id).single();
        if (profile?.age_group) {
          router.replace(`/HomeTon/${profile.age_group}`);
        } else {
          // New Google user — needs to complete sign-up (age selection)
          router.replace('/sign-up');
        }
        listener.subscription.unsubscribe();
      }
    });
    return () => { listener.subscription.unsubscribe(); };
  }, [mounted, router]);

  const resolveEmail = async (value: string): Promise<string> => {
    const v = value.trim();
    if (v.includes('@')) return v;
    try {
      const { data } = await supabase.from('app_users').select('email').eq('display_name', v).limit(1).single();
      if (data?.email) return data.email;
    } catch {}
    return v;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      toast({ variant: 'destructive', title: 'Fill in all fields' }); return;
    }
    setIsLoading(true);
    try {
      const email = await resolveEmail(identifier);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        const { data: profile } = await supabase
          .from('app_users').select('age_group').eq('id', data.user.id).single();
        if (profile?.age_group) {
          router.replace(`/HomeTon/${profile.age_group}`);
        } else {
          router.replace('/sign-up');
        }
      }
    } catch (error: any) {
      const msg = error?.message || '';
      let friendly = 'Sign in failed. Check your details and try again.';
      if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) friendly = 'Email or password is incorrect.';
      if (msg.includes('Email not confirmed')) friendly = 'Please confirm your email first.';
      if (msg.includes('Too many requests')) friendly = 'Too many attempts. Wait a moment and try again.';
      toast({ variant: 'destructive', title: 'Sign in failed', description: friendly });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsGoogleLoading(true);
    // signInWithOAuth redirects the browser to Google — nothing else runs after this
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Google sign in failed', description: error.message });
      setIsGoogleLoading(false);
    }
    // If no error, browser is already redirecting to Google — don't do anything else
  };

  const handleForgotPassword = async () => {
    const email = identifier.includes('@') ? identifier.trim() : '';
    if (!email) { toast({ variant: 'destructive', title: 'Enter your email address first' }); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/sign-in`,
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Could not send reset email', description: error.message });
      return;
    }
    setResetSent(true);
    toast({ title: 'Reset email sent', description: 'Check your inbox.' });
  };

  if (!mounted) return <div className="min-h-screen bg-black" />;

  return (
    <AnimatedBg className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Logo />
        <Link href="/sign-up" className="text-sm font-medium text-white/40 hover:text-white transition-colors">
          Create account →
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">

          <div className="text-center space-y-2">
            <div className="mx-auto h-14 w-14 rounded-2xl overflow-hidden border border-white/10 mb-3">
              <img src="/icons/icon-192.png" alt="NGA Hub" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-bold text-white">Welcome back</h1>
            <p className="text-sm text-white/40">Sign in to your NGA Hub account</p>
          </div>

          {/* Google */}
          <button onClick={handleGoogle} disabled={isGoogleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 h-12 bg-white text-black rounded-2xl font-semibold text-sm hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50">
            {isGoogleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/20">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Email or Username</label>
              <div className="relative">
                {identifier.includes('@')
                  ? <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  : <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                }
                <input type="text" required value={identifier} onChange={e => setIdentifier(e.target.value)}
                  placeholder="you@example.com or your_name" autoComplete="username"
                  className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:border-white/30 outline-none transition-all placeholder:text-white/20" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Password" autoComplete="current-password"
                  className="w-full h-11 pl-10 pr-11 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:border-white/30 outline-none transition-all placeholder:text-white/20" />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                  {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={handleForgotPassword}
                  className="text-xs text-white/40 hover:text-white transition-colors">
                  {resetSent ? '✓ Reset email sent' : 'Forgot password?'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading || isGoogleLoading}
              className="w-full h-11 bg-white text-black rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-white/30">
            Don't have an account?{' '}
            <Link href="/sign-up" className="text-white font-semibold hover:opacity-70 transition-opacity">Sign up</Link>
          </p>
        </div>
      </div>
    </AnimatedBg>
  );
}
