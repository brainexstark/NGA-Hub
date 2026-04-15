'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Logo } from "../../components/logo";
import { ArrowLeft, Loader2, Shield, Eye, EyeOff, Zap, Calendar, Smartphone } from "lucide-react";
import Link from "next/link";
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, updateProfile, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth, useFirestore } from "../../firebase";
import { useToast } from "../../hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { DatePicker } from "../../components/ui/date-picker";
import { differenceInYears } from 'date-fns';

type AgeGroup = 'under-10' | '10-16' | '16-plus' | '';

export default function SignUpPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('');
  const [dob, setDob] = useState<Date>();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    // Handle redirect result from Google sign-in
    if (auth && firestore) {
      getRedirectResult(auth)
        .then(async (result) => {
          if (result?.user) {
            const user = result.user;
            const userRef = doc(firestore, "users", user.uid);
            await setDoc(userRef, { uid: user.uid, displayName: user.displayName, email: user.email, lastLogin: serverTimestamp() }, { merge: true });
            toast({ title: "Authorized", description: "Google account synchronized." });
            router.push('/select-age');
          }
        })
        .catch((err) => { if (err?.code !== 'auth/no-current-user') console.error(err); });
    }
  }, [auth, firestore]);

  const validateAgeGroup = (birthDate: Date, group: AgeGroup): boolean => {
      const age = differenceInYears(new Date(), birthDate);
      if (group === 'under-10' && age < 10) return true;
      if (group === '10-16' && age >= 10 && age <= 16) return true;
      if (group === '16-plus' && age > 16) return true;
      return false;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;

    if (!ageGroup || !dob) {
      toast({ variant: 'destructive', title: "Incomplete Node Data", description: "All fields are required for synchronization." });
      return;
    }

    if (!validateAgeGroup(dob, ageGroup)) {
        toast({ variant: 'destructive', title: "Validation Error", description: "Date of birth does not match age group protocols." });
        return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: username });
      
      const userRef = doc(firestore, "users", user.uid);
      const userData = {
        uid: user.uid,
        displayName: username,
        email: user.email,
        ageGroup: ageGroup,
        dob: dob.toISOString(),
        phoneNumber: ageGroup === '16-plus' ? phoneNumber : null,
        lastLogin: serverTimestamp(),
      };

      await setDoc(userRef, userData, { merge: true });
      toast({ title: "Authorized", description: "Account created and synchronized." });
      router.push(`/`);
    } catch (err: any) {
      console.error("Sign Up Node Sync Error:", err);
      toast({ variant: 'destructive', title: "Sync Failed", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) return;
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = doc(firestore, "users", user.uid);
      await setDoc(userRef, { uid: user.uid, displayName: user.displayName, email: user.email, lastLogin: serverTimestamp() }, { merge: true });
      toast({ title: "Authorized", description: "Google account synchronized." });
      router.push('/select-age');
    } catch (popupError: any) {
      if (popupError?.code === 'auth/popup-blocked' ||
          popupError?.code === 'auth/popup-closed-by-user' ||
          popupError?.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectError: any) {
          toast({ variant: "destructive", title: "Sign In Failed", description: redirectError.message });
          setIsGoogleLoading(false);
        }
      } else {
        toast({ variant: "destructive", title: "Sign In Failed", description: popupError.message });
        setIsGoogleLoading(false);
      }
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-[#0a051a]" />;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center p-6 overflow-y-auto bg-[#0a051a]">
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[140px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[140px] animate-pulse [animation-delay:3s]" />
      </div>

      <Link href="/" className="absolute top-8 left-8 z-50">
        <Button variant="ghost" size="sm" className="rounded-full bg-blue-950/40 backdrop-blur-md hover:bg-blue-900/60 text-white border border-blue-500/20 transition-all">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>
      </Link>
      
      <div className="w-full max-md relative z-10 animate-in zoom-in-95 duration-700 py-12">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-[3rem] blur opacity-30 animate-pulse"></div>
        
        <Card className="relative border border-blue-500/30 bg-[#0a0525]/90 backdrop-blur-3xl shadow-[0_0_100px_rgba(64,93,230,0.2)] rounded-[2.5rem] overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-400 to-purple-600 animate-pulse" />
          
          <CardHeader className="text-center pt-10 space-y-6">
            <div className="mb-2 flex justify-center scale-110">
              <Logo />
            </div>
            <div className="space-y-2">
                <CardTitle className="font-headline text-4xl font-black uppercase tracking-tighter animate-text-color-sync">Establish Node</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 flex items-center justify-center gap-2 text-blue-200 animate-text-color-sync">
                    <Shield className="h-3 w-3 text-blue-400" /> Initialize network lineage
                </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 p-8 relative">
            <form className="space-y-4 relative z-10" onSubmit={handleSignUp}>
               <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 ml-2 text-blue-300">Community Identifier (Username)</Label>
                <Input placeholder="legacy_node_01" required value={username} onChange={(e) => setUsername(e.target.value)} className="h-12 rounded-2xl bg-blue-950/40 border-blue-500/20 focus:border-blue-400/50 text-white font-bold" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 ml-2 text-blue-300">Network Address (Email)</Label>
                <Input type="email" placeholder="node@stark-b.network" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-2xl bg-blue-950/40 border-blue-500/20 focus:border-blue-400/50 text-white font-bold" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 ml-2 text-purple-300">Security Token (Password)</Label>
                 <div className="relative">
                    <Input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pr-12 rounded-2xl bg-purple-950/40 border-purple-500/20 focus:border-purple-400/50 text-white font-bold" placeholder="••••••••" />
                    <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full text-purple-300/30 hover:text-purple-300" onClick={() => setShowPassword((prev) => !prev)}>
                        {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </Button>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 ml-2 text-blue-300">Mission Sector (Age Group)</Label>
                    <Select value={ageGroup} onValueChange={(value: AgeGroup) => setAgeGroup(value)}>
                    <SelectTrigger className="h-12 rounded-2xl bg-blue-950/40 border-blue-500/20 text-white font-bold">
                        <SelectValue placeholder="Select Sector" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0525] border-blue-500/30">
                        <SelectItem value="under-10" className="text-white font-bold">Under 10</SelectItem>
                        <SelectItem value="10-16" className="text-white font-bold">10-16</SelectItem>
                        <SelectItem value="16-plus" className="text-white font-bold">16 Plus</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                {ageGroup === '16-plus' && (
                    <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 ml-2 text-blue-300">Hardware Link (Phone)</Label>
                        <div className="relative">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400/40" />
                            <Input type="tel" placeholder="+254..." required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="h-12 pl-12 rounded-2xl bg-blue-950/40 border-blue-500/20 focus:border-blue-400/50 text-white font-bold" />
                        </div>
                    </div>
                )}
              </div>

              <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 ml-2 text-blue-300 flex items-center gap-2">
                      <Calendar className="h-3 w-3" /> Solar Cycle (DOB)
                  </Label>
                  <div className="bg-blue-950/40 border border-blue-500/20 rounded-2xl p-2">
                    <DatePicker date={dob} setDate={setDob} />
                  </div>
              </div>

              <Button type="submit" className="w-full font-black h-14 rounded-2xl text-[11px] tracking-[0.2em] animate-bg-color-sync border-none text-white shadow-xl" disabled={isLoading || isGoogleLoading}>
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <span className="flex items-center gap-2 animate-text-color-sync brightness-200">
                        CREATE ACCOUNT <Zap className="h-4 w-4" />
                    </span>
                )}
              </Button>
            </form>

            <div className="relative pt-2">
                <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.4em] mb-4">
                    <span className="bg-[#0a0525] px-4 text-blue-300/30 relative z-10">External Node Sync</span>
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-blue-500/10" />
                </div>
                <Button variant="outline" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading} className="w-full h-12 rounded-2xl font-black text-[9px] tracking-widest bg-white/5 border-blue-500/20 text-blue-100 hover:text-white">
                    <span className="animate-text-color-sync">Authorize with Google Account</span>
                </Button>
            </div>

            <div className="text-center text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 text-blue-200">
              Already a legacy member?{" "}
              <Link href="/sign-in" className="font-black text-blue-400 hover:text-blue-300 transition-colors underline decoration-blue-400/20 underline-offset-8">Login Node</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
