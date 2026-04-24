'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "../../components/logo";
import { Loader2, Eye, EyeOff, ArrowRight, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signInWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "../../firebase";
import { useToast } from "../../hooks/use-toast";

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    if (auth) {
      setIsGoogleLoading(true);
      getRedirectResult(auth)
        .then((result) => {
          if (result?.user) {
            toast({ title: "Welcome back!" });
            router.push('/');
          }
        })
        .catch(() => {})
        .finally(() => setIsGoogleLoading(false));
    }
  }, [auth]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Sign in failed", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!auth) return;
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/popup-closed-by-user') {
        try { await signInWithRedirect(auth, provider); } catch {}
      } else {
        toast({ variant: "destructive", title: "Google sign in failed", description: err.message });
        setIsGoogleLoading(false);
      }
    }
  };

  if (!mounted) return <div className="min-h-screen bg-[#0a051a]" />;

  return (
    <main className="min-h-screen bg-[#0a051a] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Logo />
        <Link href="/sign-up" className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
          Create account →
        </Link>
      </div>

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px]" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">Welcome back</h1>
            <p className="text-sm text-white/40 font-medium">Sign in to your NGA Hub account</p>
          </div>

          {/* Google button */}
          <button onClick={handleGoogle} disabled={isGoogleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 h-12 bg-white text-black rounded-2xl font-bold text-sm hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50">
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

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Email form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-12 pl-11 pr-4 bg-white/5 border border-white/10 rounded-2xl text-white font-medium text-sm focus:border-primary/50 focus:bg-white/8 outline-none transition-all placeholder:text-white/20" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 pl-11 pr-12 bg-white/5 border border-white/10 rounded-2xl text-white font-medium text-sm focus:border-primary/50 outline-none transition-all placeholder:text-white/20" />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors">
                  {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading || isGoogleLoading}
              className="w-full h-12 bg-primary rounded-2xl font-black text-white text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-primary/20">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="text-center text-xs text-white/30">
            Don't have an account?{' '}
            <Link href="/sign-up" className="text-primary font-black hover:text-primary/80 transition-colors">Sign up</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
