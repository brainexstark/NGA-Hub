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
  Loader2, User, Camera, Shield, Save, CheckCircle2, Palette, RefreshCw,
  Zap, Bell, Moon, Globe, Lock, Languages, LogOut, Bot, Flame, Film,
  Download, ShieldCheck, Cpu, LineChart, Eye, EyeOff, Trash2, Share2,
  Smartphone, Volume2, VolumeX, MessageCircle, Heart, Radio, BookOpen
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
  { value: 'ghana', label: 'Ghana' },
  { value: 'tanzania', label: 'Tanzania' },
  { value: 'uganda', label: 'Uganda' },
  { value: 'canada', label: 'Canada' },
  { value: 'australia', label: 'Australia' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'sw', label: 'Swahili' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ar', label: 'Arabic' },
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

  const [displayName, setDisplayName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [ageGroup, setAgeGroup] = useState<'under-10' | '10-16' | '16-plus'>('10-16');
  const [timerNotifications, setTimerNotifications] = useState(false);
  const [darkTheme, setDarkTheme] = useState(true);
  const [language, setLanguage] = useState('en');
  const [country, setCountry] = useState('kenya');
  const [privacyLevel, setPrivacyLevel] = useState<'public' | 'private'>('public');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [chatNotifications, setChatNotifications] = useState(true);
  const [likeNotifications, setLikeNotifications] = useState(true);
  const [liveNotifications, setLiveNotifications] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  // Track if profile has loaded once to avoid re-applying on every render
  const profileLoadedRef = React.useRef(false);

  useEffect(() => {
    if (profile && !profileLoadedRef.current) {
      profileLoadedRef.current = true;
      if (!displayName) setDisplayName(profile.displayName || '');
      if (!profilePicture) setProfilePicture(profile.profilePicture || '');
      if (profile.ageGroup) setAgeGroup(profile.ageGroup);
      if (profile.timerNotifications !== undefined) setTimerNotifications(profile.timerNotifications);
      // Only read dark mode from localStorage — never force it from profile on page load
      const saved = localStorage.getItem('nga-dark-mode');
      const isDark = saved !== null ? saved === '1' : (profile.darkTheme ?? true);
      setDarkTheme(isDark);
      // Do NOT call applyDarkMode here — the app already has its theme applied
      if (profile.language) setLanguage(profile.language);
      if (profile.country) setCountry(profile.country);
      if (profile.privacyLevel) setPrivacyLevel(profile.privacyLevel);
    }
  }, [profile]);

  const applyDarkMode = (dark: boolean) => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      root.style.removeProperty('--background');
      root.style.removeProperty('--foreground');
      root.style.removeProperty('--card');
      root.style.removeProperty('--card-foreground');
      root.style.removeProperty('--muted');
      root.style.removeProperty('--muted-foreground');
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
      root.style.setProperty('--background', '0 0% 98%');
      root.style.setProperty('--foreground', '285 70% 5%');
      root.style.setProperty('--card', '0 0% 100%');
      root.style.setProperty('--card-foreground', '285 70% 5%');
      root.style.setProperty('--muted', '285 10% 92%');
      root.style.setProperty('--muted-foreground', '285 10% 40%');
    }
    localStorage.setItem('nga-dark-mode', dark ? '1' : '0');
  };

  const handleToggleDark = (checked: boolean) => {
    setDarkTheme(checked);
    applyDarkMode(checked);
    if (user && firestore) {
      updateDoc(doc(firestore, 'users', user.uid), { darkTheme: checked }).catch(() => {});
    }
  };

  const handleSave = async () => {
    if (!user || !firestore) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(firestore, 'users', user.uid), {
        displayName, profilePicture, timerNotifications, darkTheme,
        language, country, privacyLevel,
      });
      toast({ title: 'Settings Saved', description: 'All changes synchronized.' });
      setLastSynced(new Date());
    } catch {
      toast({ variant: 'destructive', title: 'Save Failed' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/sign-in');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure? This cannot be undone.')) return;
    toast({ variant: 'destructive', title: 'Account deletion requires email verification. Contact support.' });
  };

  if (isUserLoading || (user && isProfileLoading)) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const mobileTools = [
    { href: '/ai-tools', label: 'AI Suite', icon: Bot, color: 'text-primary' },
    { href: '/video-bank', label: 'Video Bank', icon: Film, color: 'text-accent' },
    { href: '/activity', label: 'Analytics', icon: LineChart, color: 'text-blue-400' },
    { href: '/security', label: 'Security', icon: ShieldCheck, color: 'text-green-400' },
    { href: '/live-lesson', label: 'Live Lesson', icon: Flame, color: 'text-orange-400' },
    { href: '/install', label: 'Install App', icon: Download, color: 'text-cyan-400' },
    { href: '/live-stream', label: 'Go Live', icon: Radio, color: 'text-red-400' },
    { href: '/learning-hub', label: 'Learning', icon: BookOpen, color: 'text-yellow-400' },
    { href: '/chat', label: 'Chat', icon: MessageCircle, color: 'text-purple-400' },
  ];

  return (
    <div className="container mx-auto max-w-5xl space-y-10 pb-32 animate-in fade-in duration-700 pt-6">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest">
          <Palette className="h-4 w-4" /> Settings
        </div>
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter dynamic-text-mesh">Node Configuration</h1>
      </header>

      {/* Mobile quick links */}
      <section className="md:hidden space-y-4">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 px-1">Quick Access</p>
        <div className="grid grid-cols-3 gap-3">
          {mobileTools.map(tool => (
            <Link key={tool.href} href={tool.href}>
              <Card className="bg-white/5 border-white/5 rounded-2xl p-3 flex flex-col items-center text-center gap-2 active:scale-95 transition-all">
                <div className={cn("p-2 rounded-xl bg-black/20", tool.color)}>
                  <tool.icon className="h-5 w-5" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-tight">{tool.label}</span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left sidebar */}
        <div className="lg:col-span-4 space-y-5">
          {/* Profile card */}
          <Card className="border-2 border-primary/10 bg-card/50 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="text-center pb-2 bg-muted/20 border-b border-white/5">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Profile Preview</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-6 pb-6">
              <div className="relative group">
                <Avatar className="h-32 w-32 ring-4 ring-offset-4 ring-offset-background ring-primary/20 border-4 border-background">
                  <AvatarImage key={profilePicture} src={profilePicture} className="object-cover" />
                  <AvatarFallback className="text-4xl font-black bg-primary/10 text-primary">{displayName.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <button
                  onClick={() => router.push('/record-video')}
                  className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-primary flex items-center justify-center border-4 border-background z-20 shadow-xl hover:scale-110 transition-transform"
                >
                  <Camera className="h-4 w-4 text-white" />
                </button>
              </div>
              <p className="font-headline text-2xl font-bold tracking-tight mt-4">{displayName || 'User'}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mt-1">{ageGroup} · {privacyLevel}</p>
              {lastSynced && (
                <div className="mt-3 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-green-500/80 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                  <CheckCircle2 className="h-3 w-3" /> Saved {lastSynced.toLocaleTimeString()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account card */}
          <Card className="bg-black/40 border-white/5 rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/10 p-5">
              <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Account
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="opacity-50 font-bold uppercase">UID</span>
                  <span className="font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded">{user?.uid.slice(0, 12)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-50 font-bold uppercase">Email</span>
                  <span className="font-mono text-[10px] truncate max-w-[130px]">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-50 font-bold uppercase">Status</span>
                  <span className="text-green-400 font-bold text-[10px] flex items-center gap-1"><Zap className="h-3 w-3" /> Active</span>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <Button variant="outline" size="sm" className="w-full h-9 text-[10px] font-black uppercase border-white/10"
                  onClick={() => { localStorage.removeItem('nga-tour-done'); toast({ title: 'Tour reset — refresh to see it.' }); }}>
                  <RefreshCw className="mr-2 h-3 w-3" /> Restart App Tour
                </Button>
                <Button variant="outline" size="sm" className="w-full h-9 text-[10px] font-black uppercase border-white/10"
                  onClick={() => { navigator.share?.({ title: 'NGA Hub', url: window.location.origin }).catch(() => {}); toast({ title: 'Share link copied!' }); }}>
                  <Share2 className="mr-2 h-3 w-3" /> Share App
                </Button>
                <Button variant="destructive" size="sm" onClick={handleLogout} className="w-full h-9 text-[10px] font-black uppercase">
                  <LogOut className="mr-2 h-3 w-3" /> Sign Out
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDeleteAccount} className="w-full h-9 text-[10px] font-black uppercase text-destructive/60 hover:text-destructive">
                  <Trash2 className="mr-2 h-3 w-3" /> Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right forms */}
        <div className="lg:col-span-8 space-y-6">
          {/* Identity */}
          <Card className="border-2 border-primary/10 bg-card/40 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-white/5 p-6">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Display Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
                  <Input placeholder="Your name..." className="pl-11 h-12 bg-black/20 rounded-2xl border-white/5 font-bold"
                    value={displayName} onChange={e => setDisplayName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Profile Picture</Label>
                <div className="flex items-center gap-3 p-4 bg-black/20 rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/40 transition-all cursor-pointer"
                  onClick={() => document.getElementById('gallery-picker')?.click()}>
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarImage src={profilePicture} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary font-black">{displayName.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-black text-sm uppercase tracking-tight">Choose from Gallery</p>
                    <p className="text-[10px] text-white/40 mt-0.5">Tap to pick from your device</p>
                  </div>
                  <Camera className="h-5 w-5 text-primary shrink-0" />
                  <input id="gallery-picker" type="file" accept="image/*" className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = ev => setProfilePicture(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }} />
                </div>
                <Input placeholder="Or paste image URL..." className="h-11 bg-black/20 rounded-2xl border-white/5 text-sm"
                  value={profilePicture.startsWith('data:') ? '' : profilePicture}
                  onChange={e => setProfilePicture(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Privacy</Label>
                <Select value={privacyLevel} onValueChange={(v: any) => setPrivacyLevel(v)}>
                  <SelectTrigger className="h-12 bg-black/20 rounded-2xl border-white/5 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 rounded-2xl">
                    <SelectItem value="public" className="font-bold"><Eye className="inline h-3 w-3 mr-2" />Public</SelectItem>
                    <SelectItem value="private" className="font-bold"><EyeOff className="inline h-3 w-3 mr-2" />Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="border-2 border-accent/10 bg-card/40 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-white/5 p-6">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <Palette className="h-5 w-5 text-accent" /> Appearance & Region
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between p-3 bg-black/20 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Moon className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-bold text-sm">Dark Mode</p>
                    <p className="text-[10px] text-white/40">Changes instantly</p>
                  </div>
                </div>
                <Switch checked={darkTheme} onCheckedChange={handleToggleDark} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="h-11 bg-black/20 rounded-2xl border-white/5 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 rounded-2xl">
                      {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value} className="font-bold">{l.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="h-11 bg-black/20 rounded-2xl border-white/5 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 rounded-2xl">
                      {COUNTRIES.map(c => <SelectItem key={c.value} value={c.value} className="font-bold">{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-2 border-white/5 bg-card/40 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-white/5 p-6">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <Bell className="h-5 w-5 text-yellow-400" /> Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[
                { label: 'Timer Alerts', desc: 'Session time warnings', icon: Bell, state: timerNotifications, set: setTimerNotifications, key: 'timerNotifications' },
                { label: 'Chat Messages', desc: 'New message alerts', icon: MessageCircle, state: chatNotifications, set: setChatNotifications, key: 'chatNotifications' },
                { label: 'Likes & Reactions', desc: 'When someone likes your post', icon: Heart, state: likeNotifications, set: setLikeNotifications, key: 'likeNotifications' },
                { label: 'Live Streams', desc: 'When someone goes live', icon: Radio, state: liveNotifications, set: setLiveNotifications, key: 'liveNotifications' },
                { label: 'Sound Effects', desc: 'App sounds and alerts', icon: soundEnabled ? Volume2 : VolumeX, state: soundEnabled, set: setSoundEnabled, key: 'soundEnabled' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-black/20 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-white/60" />
                    <div>
                      <p className="font-bold text-sm">{item.label}</p>
                      <p className="text-[10px] text-white/40">{item.desc}</p>
                    </div>
                  </div>
                  <Switch checked={item.state} onCheckedChange={(v) => {
                    item.set(v);
                    if (user && firestore) updateDoc(doc(firestore, 'users', user.uid), { [item.key]: v }).catch(() => {});
                  }} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Save button */}
          <Button onClick={handleSave} disabled={isUpdating}
            className="w-full h-14 text-lg font-black font-headline rounded-3xl shadow-2xl shadow-primary/20">
            {isUpdating ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Save className="mr-3 h-5 w-5" />}
            SAVE ALL SETTINGS
          </Button>
        </div>
      </div>
    </div>
  );
}
