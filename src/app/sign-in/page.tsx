'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Logo } from "../../components/logo";
import { ArrowLeft, Loader2, Eye, EyeOff, History, Zap, Shield } from "lucide-react";
import Link from "next/link";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "../../firebase";
import { useToast } from "../../hooks/use-toast";

const RECENT_NODES_KEY = 'stark_b_recent_nodes';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsLoadingGoogle] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [recentNodes, setRecentNodes] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(RECENT_NODES_KEY);
    if (saved) {
      try {
        setRecentNodes(JSON.parse(saved));
      } catch (e) {
        console.warn("Node Cache Corrupt.");
      }
    }
  }, []);

  const saveRecentNode = (nodeEmail: string) => {
    const updated = Array.from(new Set([nodeEmail, ...recentNodes])).slice(0, 3);
    setRecentNodes(updated);
    localStorage.setItem(RECENT_NODES_KEY, JSON.stringify(updated));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      saveRecentNode(email);
      toast({ title: "Authorized", description: "Node synchronized." });
      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Sync Failed", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsLoadingGoogle(true);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      if (result.user?.email) saveRecentNode(result.user.email);
      toast({ title: "Authorized", description: "Google synchronization complete." });
      router.push('/');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Sync Failed", description: error.message });
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const selectRecentNode = (node: string) => {
    setEmail(node);
    setShowRecent(false);
  };

  if (!mounted) return <div className="min-h-screen bg-[#0a051a]" />;

  return (
    <main className="relative flex min-h-screen items-center justify-center p-6 overflow-hidden bg-[#0a051a]">
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/30 rounded-full blur-[140px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-600/30 rounded-full blur-[140px] animate-pulse [animation-delay:3s]" />
      </div>

      <Link href="/" className="absolute top-8 left-8 z-50">
        <Button variant="ghost" size="sm" className="rounded-full bg-indigo-950/40 backdrop-blur-md hover:bg-indigo-900/60 text-white border border-indigo-500/20">
          <ArrowLeft className="mr-2 h-4 w-4" /> Return to Hub
        </Button>
      </Link>
      
      <div className="w-full max-md relative z-10 animate-in zoom-in-95 duration-700">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 rounded-[3rem] blur opacity-30 animate-pulse"></div>
        
        <Card className="relative border border-indigo-500/30 bg-[#0f0535]/90 backdrop-blur-3xl shadow-[0_0_100px_rgba(79,70,229,0.2)] rounded-[2.5rem] overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-violet-400 to-fuchsia-600 animate-pulse" />
          
          <CardHeader className="text-center pt-12 space-y-6">
            <div className="mb-2 flex justify-center scale-110">
                <Logo />
            </div>
            <div className="space-y-2">
                <CardTitle className="font-headline text-4xl font-black uppercase tracking-tighter animate-text-color-sync">Access Node</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 flex items-center justify-center gap-2 text-indigo-200 animate-text-color-sync">
                    <Shield className="h-3 w-3 text-indigo-400" /> Authorized Network Link
                </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8 p-10 relative">
            <form className="space-y-6" onSubmit={handleSignIn}>
              <div className="space-y-2 group/input">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 ml-2 text-indigo-300">Network Identifier (Email)</label>
                <div className="relative">
                  <input
                    type="email" 
                    autoComplete="email"
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setShowRecent(true)}
                    onBlur={() => setTimeout(() => setShowRecent(false), 200)}
                    className="flex h-14 w-full rounded-2xl bg-indigo-950/40 border border-indigo-500/20 px-3 py-2 text-white font-bold focus:border-indigo-400/50 transition-all outline-none" 
                    placeholder="node@stark-b.network"
                  />
                  {showRecent && recentNodes.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-[#0f0535]/95 backdrop-blur-2xl border border-indigo-500/20 rounded-2xl p-2 z-[60] shadow-2xl">
                      <div className="flex items-center gap-2 px-3 py-2 mb-1 border-b border-indigo-500/10">
                        <History className="h-3 w-3 text-indigo-400 opacity-60" />
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-40 text-indigo-200">Localized History</span>
                      </div>
                      <div className="space-y-1">
                        {recentNodes.map((node) => (
                          <button
                            key={node}
                            type="button"
                            onClick={() => selectRecentNode(node)}
                            className="w-full text-left px-3 py-3 text-[11px] font-bold text-indigo-200/60 hover:text-white hover:bg-indigo-500/20 rounded-xl transition-all"
                          >
                            {node}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 group/input">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 ml-2 text-violet-300">Security Token (Password)</label>
                <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"} 
                      autoComplete="current-password"
                      required 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="flex h-14 w-full rounded-2xl bg-violet-950/40 border border-violet-500/20 px-3 py-2 pr-14 text-white font-bold focus:border-violet-400/50 transition-all outline-none" 
                      placeholder="••••••••"
                    />
                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-violet-300/30 hover:text-violet-300" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </button>
                </div>
              </div>

              <Button type="submit" className="w-full font-black h-16 rounded-2xl text-[12px] tracking-[0.2em] animate-bg-color-sync border-none text-white shadow-xl" disabled={isLoading || isGoogleLoading}>
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <span className="flex items-center justify-center gap-2 animate-text-color-sync brightness-200">
                        INITIALIZE SYNC <Zap className="h-4 w-4" />
                    </span>
                )}
              </Button>
            </form>
            
            <div className="relative space-y-6 pt-2">
                <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.4em]">
                    <span className="bg-[#0f0535] px-4 text-indigo-300/30 relative z-10">Cross-Platform Link</span>
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-indigo-500/10" />
                </div>

                <Button 
                    variant="outline" 
                    onClick={handleGoogleSignIn} 
                    disabled={isLoading || isGoogleLoading} 
                    className="relative z-10 w-full font-black h-14 rounded-2xl text-[10px] tracking-widest bg-white/5 border border-indigo-500/20 text-indigo-100 hover:text-white"
                >
                    {isGoogleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="animate-text-color-sync">Authorize with Google Account</span>}
                </Button>

                <div className="relative z-10 text-center text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 text-indigo-200">
                    New to the STARK-B Legacy?{" "}
                    <Link href="/sign-up" className="font-black text-indigo-400 hover:text-indigo-300 transition-colors underline decoration-indigo-400/20 underline-offset-8">Establish Account</Link>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
