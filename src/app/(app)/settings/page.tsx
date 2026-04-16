
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '../../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useToast } from '../../../hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, 
  User, 
  Camera, 
  Shield, 
  Save, 
  CheckCircle2, 
  Palette, 
  RefreshCw,
  Zap,
  Bell,
  Moon,
  Globe,
  MapPin,
  Lock,
  Languages,
  LogOut,
  Bot,
  Flame,
  Film,
  Download,
  ShieldCheck,
  Cpu,
  LineChart
} from 'lucide-react';
import type { UserProfile } from '../../../lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Switch } from "../../../components/ui/switch";
import { cn } from '../../../lib/utils';

const COUNTRIES = [
  { value: 'kenya', label: 'Kenya' },
  { value: 'usa', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'nigeria', label: 'Nigeria' },
  { value: 'south_africa', label: 'South Africa' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'sw', label: 'Swahili' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
];

export default function SettingsPage() {
  const { user, isUserLoading, auth } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  // Identity State
  const [displayName, setDisplayName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [ageGroup, setAgeGroup] = useState<'under-10' | '10-16' | '16-plus'>('10-16');
  
  // Customization State
  const [timerNotifications, setTimerNotifications] = useState(false);
  const [darkTheme, setDarkTheme] = useState(true);
  const [language, setLanguage] = useState('en');
  const [locationNotifications, setLocationNotifications] = useState(false);
  const [country, setCountry] = useState('kenya');
  const [privacyLevel, setPrivacyLevel] = useState<'public' | 'private'>('public');

  const [isUpdating, setIsUpdating] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  useEffect(() => {
    if (profile) {
      if (!displayName) setDisplayName(profile.displayName || '');
      if (!profilePicture) setProfilePicture(profile.profilePicture || '');
      if (profile.ageGroup) setAgeGroup(profile.ageGroup);
      
      if (profile.timerNotifications !== undefined) setTimerNotifications(profile.timerNotifications);
      if (profile.darkTheme !== undefined) {
          setDarkTheme(profile.darkTheme);
          const root = document.documentElement;
          if (profile.darkTheme) root.classList.add('dark');
          else root.classList.remove('dark');
      }
      if (profile.language) setLanguage(profile.language);
      if (profile.locationNotifications !== undefined) setLocationNotifications(profile.locationNotifications);
      if (profile.country) setCountry(profile.country);
      if (profile.privacyLevel) setPrivacyLevel(profile.privacyLevel);
    }
  }, [profile]);

  const handleToggleDark = (checked: boolean) => {
    setDarkTheme(checked);
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (checked) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const handleManualSave = async () => {
    if (!user || !firestore) return;
    setIsUpdating(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, { 
        displayName, 
        profilePicture,
        timerNotifications,
        darkTheme,
        language,
        locationNotifications,
        country,
        privacyLevel
      });
      toast({ title: "Node Configuration Saved", description: "Your personalization protocols have been synchronized." });
      setLastSynced(new Date());
    } catch (error) {
      toast({ variant: 'destructive', title: "Sync Failed", description: "Could not update profile data." });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({ title: "Session Terminated", description: "Node disconnected successfully." });
      router.push('/sign-in');
    } catch (error) {
      toast({ variant: 'destructive', title: "Logout Failed" });
    }
  };

  if (isUserLoading || (user && isProfileLoading)) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 animate-pulse">Synchronizing Node Data...</p>
      </div>
    );
  }

  const mobileTools = [
    { href: '/ai-tools', label: 'AI Suite', icon: Bot, color: 'text-primary' },
    { href: '/video-bank', label: 'Video Bank', icon: Film, color: 'text-accent' },
    { href: '/activity', label: 'Analytics', icon: LineChart, color: 'text-blue-400' },
    { href: '/security', label: 'Security Node', icon: ShieldCheck, color: 'text-green-400' },
    { href: '/live-lesson', label: 'Live Lesson', icon: Flame, color: 'text-orange-400' },
    { href: '/install', label: 'Install Hub', icon: Download, color: 'text-cyan-400' },
  ];

  return (
    <div className="container mx-auto max-w-5xl space-y-12 pb-32 animate-in fade-in duration-700 pt-6">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest">
            <Palette className="h-4 w-4" /> Personalization Protocol
        </div>
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter dynamic-text-mesh">Node Configuration</h1>
        <p className="text-muted-foreground text-lg font-medium italic max-w-2xl">
            Configure your STARK-B identity and visual synchronization protocols.
        </p>
      </header>

      {/* MOBILE DISCOVERY MATRIX (Replaces Sidebar on Phones) */}
      <section className="md:hidden space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Cpu className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-black uppercase tracking-widest">Discovery Hub</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
              {mobileTools.map((tool) => (
                  <Link key={tool.href} href={tool.href}>
                      <Card className="bg-white/5 border-white/5 rounded-2xl p-4 flex flex-col items-center text-center gap-3 active:scale-95 transition-all shadow-lg">
                          <div className={cn("p-2 rounded-xl bg-black/20", tool.color)}>
                              <tool.icon className="h-6 w-6" />
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-tight">{tool.label}</span>
                      </Card>
                  </Link>
              ))}
          </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-2 border-primary/10 overflow-hidden bg-card/50 backdrop-blur-xl shadow-2xl rounded-[2.5rem]">
            <CardHeader className="text-center pb-2 bg-muted/20 border-b border-white/5">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Identity Preview</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/40 transition-all animate-pulse" />
                <Avatar className="h-40 w-40 ring-4 ring-offset-4 ring-offset-background ring-primary/20 transition-all duration-700 group-hover:scale-105 border-4 border-background relative z-10">
                  <AvatarImage key={profilePicture} src={profilePicture} className="object-cover" />
                  <AvatarFallback className="text-5xl font-black bg-primary/10 text-primary">{displayName.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <button
                  onClick={async () => {
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
                      stream.getTracks().forEach(t => t.stop());
                      router.push('/record-video');
                    } catch {
                      toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Allow camera in browser settings.' });
                    }
                  }}
                  className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-primary flex items-center justify-center border-4 border-background z-20 shadow-xl hover:scale-110 transition-transform active:scale-95"
                >
                  <Camera className="h-5 w-5 text-primary-foreground" />
                </button>
              </div>
              <div className="mt-8 text-center">
                <p className="font-headline text-3xl font-bold tracking-tight">{displayName || 'Authorized User'}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Lock className="h-2.5 w-2.5" /> Secure {ageGroup} Node
                    </p>
                </div>
              </div>
              {lastSynced && (
                <div className="mt-6 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-green-500/80 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                  <CheckCircle2 className="h-3 w-3" /> Synchronized
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-xl border-white/5 shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/10">
              <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Security Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="flex justify-between items-center text-xs">
                <span className="opacity-60 font-bold uppercase tracking-wider">Node UID:</span>
                <span className="font-mono text-[10px] bg-white/5 px-2 py-1 rounded border border-white/5">{user?.uid.slice(0, 16)}...</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="opacity-60 font-bold uppercase tracking-wider">Encryption:</span>
                <span className="text-primary font-bold flex items-center gap-1"><Zap className="h-3 w-3 fill-current" /> High Performance</span>
              </div>
              <div className="pt-4 space-y-3">
                <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleLogout}
                    className="w-full h-10 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-destructive/20"
                >
                    <LogOut className="mr-2 h-3 w-3" /> Terminate Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Forms */}
        <div className="lg:col-span-8 space-y-8">
          {/* Identity Settings */}
          <Card className="border-2 border-primary/10 bg-card/40 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-white/5 p-8">
              <CardTitle className="font-headline text-2xl font-bold uppercase tracking-tight">Identity Settings</CardTitle>
              <CardDescription className="font-medium italic">Updates synchronize across all STARK-B community nodes.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="display-name" className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Community Display Name</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 opacity-40" />
                    <Input 
                      id="display-name" 
                      placeholder="Identify your node..." 
                      className="pl-12 h-14 bg-black/20 rounded-2xl border-white/5 focus:border-primary/50 transition-all font-bold text-lg"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Profile Picture</Label>
                  {/* Gallery picker */}
                  <div
                    className="flex items-center gap-4 p-4 bg-black/20 rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/40 transition-all cursor-pointer"
                    onClick={() => document.getElementById('gallery-picker')?.click()}
                  >
                    <Avatar className="h-14 w-14 shrink-0">
                      <AvatarImage src={profilePicture} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-primary font-black">{displayName.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-black text-sm uppercase tracking-tight">Choose from Gallery</p>
                      <p className="text-[10px] text-white/40 font-medium mt-0.5">Tap to pick a photo from your device</p>
                    </div>
                    <Camera className="h-5 w-5 text-primary ml-auto shrink-0" />
                    <input
                      id="gallery-picker"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const result = ev.target?.result as string;
                          setProfilePicture(result);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </div>
                  {/* URL fallback */}
                  <div className="relative mt-1">
                    <Input
                      placeholder="Or paste an image URL..."
                      className="h-12 bg-black/20 rounded-2xl border-white/5 font-medium text-sm pl-4"
                      value={profilePicture.startsWith('data:') ? '' : profilePicture}
                      onChange={(e) => setProfilePicture(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* STARK-B Customization Suite */}
          <Card className="border-2 border-accent/10 bg-card/40 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-white/5 p-8">
              <CardTitle className="font-headline text-2xl font-bold uppercase tracking-tight flex items-center gap-3">
                  <Zap className="h-6 w-6 text-accent" /> Customization Suite
              </CardTitle>
              <CardDescription className="font-medium italic">Adjust your environment nodes.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 border-b border-white/5 pb-2">Environment Controls</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <Bell className="h-4 w-4 text-accent" /> Timer Notifications
                    </Label>
                    <p className="text-[10px] text-muted-foreground">Receive alerts for session milestones.</p>
                  </div>
                  <Switch checked={timerNotifications} onCheckedChange={setTimerNotifications} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <Moon className="h-4 w-4 text-accent" /> Dark Theme Background
                    </Label>
                    <p className="text-[10px] text-muted-foreground">Synchronize high-contrast mode.</p>
                  </div>
                  <Switch checked={darkTheme} onCheckedChange={handleToggleDark} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                    <Languages className="h-3 w-3" /> Linguistic Node
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="h-12 bg-black/20 rounded-2xl border-white/5 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 rounded-2xl">
                      {LANGUAGES.map(lang => (
                        <SelectItem key={lang.value} value={lang.value} className="font-bold">{lang.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                    <Globe className="h-3 w-3" /> Regional Node
                  </Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="h-12 bg-black/20 rounded-2xl border-white/5 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 rounded-2xl">
                      {COUNTRIES.map(c => (
                        <SelectItem key={c.value} value={c.value} className="font-bold">{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                className="w-full h-16 text-xl font-black font-headline rounded-3xl shadow-2xl shadow-primary/20 transition-all active:scale-[0.98] group"
                onClick={handleManualSave}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : <Save className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" />}
                CONFIRM NODE SYNC
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
