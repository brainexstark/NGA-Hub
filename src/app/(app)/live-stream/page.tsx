'use client';

import * as React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Radio, User, StopCircle, Send, Camera, Zap, ShieldCheck, AlertCircle, Tv, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { UserProfile } from '@/lib/types';
import { useLiveStream, useActiveStreams, startLiveStream, endLiveStream, incrementViewerCount } from '@/hooks/use-live-stream';
import { supabase } from '@/lib/supabase';

// ── Viewer: watch an active stream ──────────────────────────────────────────
function StreamViewer({ streamId, onBack }: { streamId: string; onBack: () => void }) {
  const { user } = useUser();
  const { stream, chatMessages, sendMessage } = useLiveStream(streamId);
  const [msg, setMsg] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { incrementViewerCount(streamId); }, [streamId]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !msg.trim()) return;
    await sendMessage(user.uid, user.displayName || 'Viewer', user.photoURL || '', msg);
    setMsg('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-xs font-black uppercase tracking-widest opacity-60">← Back to streams</Button>
        <Card className="border-2 border-primary/10 bg-black rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-0 relative aspect-video bg-black flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 opacity-40">
              <Tv className="h-16 w-16" />
              <p className="font-black text-sm uppercase tracking-widest">Live stream in progress</p>
              <p className="text-xs opacity-60">WebRTC peer connection required for full video</p>
            </div>
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-2 animate-pulse text-xs font-black uppercase">
                <Radio className="h-3 w-3" /> LIVE
              </div>
              <div className="bg-black/60 text-white px-3 py-1 rounded-full flex items-center gap-2 text-xs font-bold">
                <User className="h-3 w-3 text-primary" /> {stream?.viewer_count || 0}
              </div>
            </div>
          </CardContent>
          <div className="p-6">
            <p className="font-black text-lg uppercase tracking-tight">{stream?.title}</p>
            <p className="text-xs text-primary font-black uppercase tracking-widest mt-1">{stream?.host_name}</p>
          </div>
        </Card>
      </div>
      <div className="lg:col-span-1">
        <Card className="border-2 border-white/5 bg-card/40 rounded-[2rem] overflow-hidden flex flex-col h-[500px]">
          <CardHeader className="p-4 border-b border-white/5">
            <CardTitle className="text-xs font-black uppercase tracking-widest">Live Chat</CardTitle>
          </CardHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {chatMessages.map((m) => (
              <div key={m.id} className="animate-in slide-in-from-bottom-2">
                <span className="text-[10px] font-black text-primary/70 uppercase">{m.user_name} </span>
                <span className="text-sm font-medium opacity-80">{m.message}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 border-t border-white/5">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Say something..." className="bg-white/5 border-white/10 rounded-xl text-xs h-10" />
              <Button type="submit" size="icon" className="h-10 w-10 rounded-xl shrink-0" disabled={!msg.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Host: broadcast your own stream ─────────────────────────────────────────
function StreamBroadcaster({ profile, user, onEnd }: { profile: UserProfile | null; user: any; onEnd: () => void }) {
  const { toast } = useToast();
  const [streamId, setStreamId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasCam, setHasCam] = useState<boolean | null>(null);
  const [title, setTitle] = useState('');
  const [starting, setStarting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { chatMessages, sendMessage } = useLiveStream(streamId);
  const [msg, setMsg] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; }
        setHasCam(true);
      })
      .catch(() => {
        setHasCam(false);
        toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Enable camera permissions to broadcast.' });
      });
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [toast]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const handleStart = async () => {
    if (!title.trim()) { toast({ title: 'Add a stream title first.' }); return; }
    setStarting(true);
    const id = await startLiveStream(
      user.uid, profile?.displayName || user.displayName || 'Host',
      profile?.profilePicture || user.photoURL || '',
      title, profile?.ageGroup || '10-16'
    );
    if (id) { setStreamId(id); setIsStreaming(true); }
    else toast({ variant: 'destructive', title: 'Could not start stream. Check Supabase connection.' });
    setStarting(false);
  };

  const handleEnd = async () => {
    if (streamId) await endLiveStream(streamId);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setIsStreaming(false);
    setStreamId(null);
    onEnd();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !msg.trim() || !streamId) return;
    await sendMessage(user.uid, profile?.displayName || user.displayName || 'Host', profile?.profilePicture || user.photoURL || '', msg);
    setMsg('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card className="border-2 border-primary/10 bg-black rounded-[2.5rem] overflow-hidden shadow-2xl">
          <CardContent className="p-0 relative aspect-video bg-black">
            <video ref={videoRef} className={cn("w-full h-full object-cover", !isStreaming && "opacity-30")} autoPlay muted playsInline />
            {hasCam === false && (
              <div className="absolute inset-0 flex items-center justify-center p-8 bg-background/90 z-20">
                <Alert variant="destructive" className="max-w-md border-2 rounded-3xl">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle className="font-black uppercase">Camera Required</AlertTitle>
                  <AlertDescription>Allow camera access to broadcast.</AlertDescription>
                </Alert>
              </div>
            )}
            {isStreaming && (
              <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                <div className="bg-red-500 text-white px-4 py-1.5 rounded-full flex items-center gap-2 animate-pulse text-xs font-black uppercase">
                  <Radio className="h-3 w-3" /> LIVE
                </div>
              </div>
            )}
          </CardContent>
          <div className="p-6 space-y-4">
            {!isStreaming ? (
              <div className="flex gap-3">
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Stream title..." className="bg-black/20 border-white/10 rounded-2xl font-bold h-12" />
                <Button onClick={handleStart} disabled={!hasCam || starting || !title.trim()} className="h-12 px-6 rounded-2xl font-black uppercase text-xs shrink-0">
                  {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Camera className="mr-2 h-4 w-4" /> Go Live</>}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8"><AvatarImage src={profile?.profilePicture || user?.photoURL || ''} /><AvatarFallback>U</AvatarFallback></Avatar>
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">{title}</p>
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest">{profile?.displayName || user?.displayName}</p>
                  </div>
                </div>
                <Button variant="destructive" onClick={handleEnd} className="rounded-2xl font-black uppercase text-xs h-10 px-5">
                  <StopCircle className="mr-2 h-4 w-4" /> End Stream
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="border-2 border-primary/10 bg-primary/5 rounded-[2rem] overflow-hidden flex flex-col h-[500px]">
          <CardHeader className="p-4 border-b border-primary/10 bg-primary/10">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Live Chat
              {!isStreaming && <span className="ml-auto text-[9px] opacity-40">Start stream to enable</span>}
            </CardTitle>
          </CardHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {chatMessages.map((m) => (
              <div key={m.id} className="animate-in slide-in-from-bottom-2">
                <span className="text-[10px] font-black text-primary/70 uppercase">{m.user_name} </span>
                <span className="text-sm font-medium opacity-80">{m.message}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 border-t border-white/5">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Chat..." disabled={!isStreaming} className="bg-white/5 border-white/10 rounded-xl text-xs h-10" />
              <Button type="submit" size="icon" className="h-10 w-10 rounded-xl shrink-0" disabled={!msg.trim() || !isStreaming}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function LiveStreamPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState<'lobby' | 'broadcast' | 'watch'>('lobby');
  const [watchingId, setWatchingId] = useState<string | null>(null);
  const activeStreams = useActiveStreams(profile?.ageGroup || '10-16');

  useEffect(() => {
    if (user && firestore) {
      getDoc(doc(firestore, 'users', user.uid)).then(snap => {
        if (snap.exists()) setProfile(snap.data() as UserProfile);
      });
    }
  }, [user, firestore]);

  if (view === 'broadcast') {
    return (
      <div className="container mx-auto space-y-6 pb-32 animate-in fade-in duration-700">
        <Header />
        <StreamBroadcaster profile={profile} user={user} onEnd={() => setView('lobby')} />
      </div>
    );
  }

  if (view === 'watch' && watchingId) {
    return (
      <div className="container mx-auto space-y-6 pb-32 animate-in fade-in duration-700">
        <Header />
        <StreamViewer streamId={watchingId} onBack={() => { setView('lobby'); setWatchingId(null); }} />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 pb-32 animate-in fade-in duration-700">
      <Header />

      {/* Go Live CTA */}
      <Card className="border-2 border-primary/20 bg-primary/5 rounded-[2.5rem] p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary animate-pulse" />
            <p className="font-black text-lg uppercase tracking-tight">Start Broadcasting</p>
          </div>
          <p className="text-sm text-muted-foreground italic">Go live instantly with your camera. Chat syncs in real-time via Supabase.</p>
        </div>
        <Button onClick={() => setView('broadcast')} size="lg" className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 shrink-0">
          <Camera className="mr-2 h-5 w-5" /> Go Live Now
        </Button>
      </Card>

      {/* Active streams */}
      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/60 px-1">
          Active Streams · <span className="text-green-400">● {activeStreams.length} live</span>
        </p>
        {activeStreams.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-30 space-y-3">
            <Radio className="h-10 w-10 mx-auto" />
            <p className="font-medium italic text-sm">No active streams. Be the first to go live.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeStreams.map(s => (
              <Card key={s.id} className="border-2 border-white/5 bg-card/40 rounded-[2rem] overflow-hidden cursor-pointer hover:border-primary/30 transition-all"
                onClick={() => { setWatchingId(s.id); setView('watch'); }}>
                <CardContent className="p-5 flex items-center gap-4">
                  <Avatar className="h-12 w-12 ring-2 ring-red-500/40">
                    <AvatarImage src={s.host_avatar} />
                    <AvatarFallback>{s.host_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm uppercase tracking-tight truncate">{s.title}</p>
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest">{s.host_name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase animate-pulse">LIVE</div>
                    <div className="flex items-center gap-1 text-[10px] font-bold opacity-60">
                      <User className="h-3 w-3" /> {s.viewer_count}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="space-y-3">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest border border-primary/20">
        <Radio className="h-4 w-4" /> Supabase Live Broadcast
      </div>
      <h1 className="font-headline text-5xl font-black uppercase tracking-tighter dynamic-text-mesh">Live Stream</h1>
      <p className="text-muted-foreground text-lg font-medium italic max-w-2xl">
        Real-time broadcasts powered by Supabase. Go live, watch others, chat instantly.
      </p>
    </header>
  );
}
