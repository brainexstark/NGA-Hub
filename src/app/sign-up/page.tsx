'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "../../components/logo";
import { Loader2, Eye, EyeOff, ArrowRight, ArrowLeft, Mail, Lock, User, Camera, Upload, Link2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, updateProfile, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth, useFirestore } from "../../firebase";
import { useToast } from "../../hooks/use-toast";
import { upsertAppUser } from "../../hooks/use-realtime";
import { cn } from "../../lib/utils";
import { AnimatedBg } from "../../components/animated-bg";

type Step = 'account' | 'profile' | 'age';
type AgeGroup = 'under-10' | '10-16' | '16-plus';

const AGE_GROUPS = [
  { id: 'under-10' as AgeGroup, label: 'Under 10', emoji: '🧒', desc: 'Kids content & learning' },
  { id: '10-16' as AgeGroup, label: '10 – 16', emoji: '🎓', desc: 'Teen content & education' },
  { id: '16-plus' as AgeGroup, label: '16+', emoji: '🚀', desc: 'Full access & community' },
];

export default function SignUpPage() {
  const [step, setStep] = useState<Step>('account');
  // Step 1
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Step 2 — profile picture
  const [profilePic, setProfilePic] = useState('');
  const [picMode, setPicMode] = useState<'upload' | 'url'>('upload');
  const [picUrl, setPicUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  // Step 3
  const [ageGroup, setAgeGroup] = useState<AgeGroup | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    if (auth && firestore) {
      getRedirectResult(auth).then(async (result) => {
        if (result?.user) {
          const u = result.user;
          await setDoc(doc(firestore, "users", u.uid), { uid: u.uid, displayName: u.displayName, email: u.email, lastLogin: serverTimestamp() }, { merge: true });
          router.push('/select-age');
        }
      }).catch(() => {});
    }
  }, [auth, firestore]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setProfilePic(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleGoogle = async () => {
    if (!auth || !firestore) return;
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
      await setDoc(doc(firestore, "users", u.uid), { uid: u.uid, displayName: u.displayName, email: u.email, lastLogin: serverTimestamp() }, { merge: true });
      router.push('/select-age');
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/popup-closed-by-user') {
        try { await signInWithRedirect(auth, provider); } catch {}
      } else {
        toast({ variant: "destructive", title: "Google sign up failed", description: err.message });
        setIsGoogleLoading(false);
      }
    }
  };

  const handleFinish = async () => {
    if (!auth || !firestore || !ageGroup) return;
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const u = cred.user;
      const finalPic = profilePic || picUrl || '';
      await updateProfile(u, { displayName: username, photoURL: finalPic });
      await setDoc(doc(firestore, "users", u.uid), {
        uid: u.uid, displayName: username, email: u.email,
        ageGroup, profilePicture: finalPic, lastLogin: serverTimestamp(),
      }, { merge: true });
      // Register in Supabase app_users
      await upsertAppUser({ id: u.uid, display_name: username, email: u.email || '', avatar: finalPic, age_group: ageGroup, is_online: true });
      toast({ title: 'Account created!', description: 'Welcome to NGA Hub.' });
      router.push(`/HomeTon/${ageGroup}`);
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Sign up failed", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return <div className="min-h-screen bg-[#0a051a]" />;

  const stepNum = step === 'account' ? 1 : step === 'profile' ? 2 : 3;

  return (
    <main className="min-h-screen bg-[#0a051a] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Logo />
        <Link href="/sign-in" className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
          Sign in →
        </Link>
      </div>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent/15 rounded-full blur-[120px]" />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Step indicator */}
          <div className="flex items-center gap-2 justify-center">
            {[1,2,3].map(n => (
              <div key={n} className={cn("h-1.5 rounded-full transition-all duration-300",
                n === stepNum ? "w-8 bg-primary" : n < stepNum ? "w-4 bg-primary/40" : "w-4 bg-white/10")} />
            ))}
          </div>

          {/* ── STEP 1: Account ── */}
          {step === 'account' && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h1 className="text-3xl font-black uppercase tracking-tight text-white">Create account</h1>
                <p className="text-sm text-white/40">Join the NGA Hub community</p>
              </div>

              {/* Google */}
              <button onClick={handleGoogle} disabled={isGoogleLoading}
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

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <input value={username} onChange={e => setUsername(e.target.value)} placeholder="your_name"
                      className="w-full h-12 pl-11 pr-4 bg-white/5 border border-white/10 rounded-2xl text-white font-medium text-sm focus:border-primary/50 outline-none transition-all placeholder:text-white/20" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                      className="w-full h-12 pl-11 pr-4 bg-white/5 border border-white/10 rounded-2xl text-white font-medium text-sm focus:border-primary/50 outline-none transition-all placeholder:text-white/20" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                      className="w-full h-12 pl-11 pr-12 bg-white/5 border border-white/10 rounded-2xl text-white font-medium text-sm focus:border-primary/50 outline-none transition-all placeholder:text-white/20" />
                    <button type="button" onClick={() => setShowPassword(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors">
                      {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button onClick={() => {
                  if (!username.trim() || !email.trim() || !password.trim()) { toast({ variant: 'destructive', title: 'Fill all fields' }); return; }
                  setStep('profile');
                }}
                  className="w-full h-12 bg-primary rounded-2xl font-black text-white text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-xl shadow-primary/20">
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <p className="text-center text-xs text-white/30">
                Already have an account?{' '}
                <Link href="/sign-in" className="text-primary font-black hover:text-primary/80 transition-colors">Sign in</Link>
              </p>
            </div>
          )}

          {/* ── STEP 2: Profile Picture ── */}
          {step === 'profile' && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h1 className="text-3xl font-black uppercase tracking-tight text-white">Profile picture</h1>
                <p className="text-sm text-white/40">Add a photo so people know it's you</p>
              </div>

              {/* Preview */}
              <div className="flex justify-center">
                <div className="relative h-28 w-28">
                  <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-primary/30 bg-white/5">
                    {profilePic || picUrl ? (
                      <img src={profilePic || picUrl} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-12 w-12 text-white/20" />
                      </div>
                    )}
                  </div>
                  <button onClick={() => fileRef.current?.click()}
                    className="absolute bottom-0 right-0 h-9 w-9 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-lg">
                    <Camera className="h-4 w-4 text-white" />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
              </div>

              {/* Mode toggle */}
              <div className="flex gap-2 bg-white/5 p-1 rounded-2xl">
                {(['upload', 'url'] as const).map(m => (
                  <button key={m} onClick={() => setPicMode(m)}
                    className={cn("flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                      picMode === m ? "bg-primary text-white" : "text-white/40")}>
                    {m === 'upload' ? '📁 Upload' : '🔗 URL'}
                  </button>
                ))}
              </div>

              {picMode === 'upload' ? (
                <button onClick={() => fileRef.current?.click()}
                  className="w-full h-12 border-2 border-dashed border-white/10 rounded-2xl text-white/40 text-sm font-bold hover:border-primary/40 hover:text-white/60 transition-all flex items-center justify-center gap-2">
                  <Upload className="h-4 w-4" /> Choose from device
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <input value={picUrl} onChange={e => { setPicUrl(e.target.value); setProfilePic(''); }}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full h-12 pl-11 pr-4 bg-white/5 border border-white/10 rounded-2xl text-white font-medium text-sm focus:border-primary/50 outline-none transition-all placeholder:text-white/20" />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep('account')}
                  className="flex-1 h-12 bg-white/5 border border-white/10 rounded-2xl font-black text-white/60 text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button onClick={() => setStep('age')}
                  className="flex-1 h-12 bg-primary rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-xl shadow-primary/20">
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <button onClick={() => setStep('age')} className="w-full text-center text-xs text-white/20 hover:text-white/40 transition-colors">
                Skip for now
              </button>
            </div>
          )}

          {/* ── STEP 3: Age Group ── */}
          {step === 'age' && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h1 className="text-3xl font-black uppercase tracking-tight text-white">Your age group</h1>
                <p className="text-sm text-white/40">We'll personalize your experience</p>
              </div>

              <div className="space-y-3">
                {AGE_GROUPS.map(ag => (
                  <button key={ag.id} onClick={() => setAgeGroup(ag.id)}
                    className={cn("w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-[0.98]",
                      ageGroup === ag.id ? "border-primary bg-primary/10" : "border-white/10 bg-white/5 hover:bg-white/8")}>
                    <span className="text-2xl">{ag.emoji}</span>
                    <div className="text-left">
                      <p className={cn("font-black text-sm uppercase tracking-tight", ageGroup === ag.id ? "text-primary" : "text-white")}>{ag.label}</p>
                      <p className="text-[10px] text-white/40 font-medium">{ag.desc}</p>
                    </div>
                    {ageGroup === ag.id && <div className="ml-auto h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('profile')}
                  className="flex-1 h-12 bg-white/5 border border-white/10 rounded-2xl font-black text-white/60 text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button onClick={handleFinish} disabled={!ageGroup || isLoading}
                  className="flex-1 h-12 bg-primary rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-xl shadow-primary/20 disabled:opacity-50">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create account <ArrowRight className="h-4 w-4" /></>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
