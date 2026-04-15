'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
    Video, 
    Radio, 
    User, 
    Dot, 
    PlayCircle, 
    StopCircle, 
    Send, 
    Loader2, 
    Camera,
    Mic,
    Zap,
    ShieldCheck,
    AlertCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { UserProfile } from '@/lib/types';

export default function LiveStreamPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [chatMessages, setChatMessages] = useState([
    { id: '1', user: 'Alex', text: 'This is awesome! 🚀', time: '2 mins ago' },
    { id: '2', user: 'Maria', text: 'Can you explain that last part again? 🧠', time: '1 min ago' },
    { id: '3', user: 'Sam', text: 'Loving the stream! 🔥', time: 'Just now' },
  ]);
  const [newMessage, setNewMessage] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // SECURE HARDWARE SYNCHRONIZATION
  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();

    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [toast]);

  useEffect(() => {
    if (user && firestore) {
        getDoc(doc(firestore, 'users', user.uid)).then(snap => {
            if (snap.exists()) setProfile(snap.data() as UserProfile);
        });
    }
  }, [user, firestore]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const msg = {
        id: Date.now().toString(),
        user: profile?.displayName || user?.displayName || 'Authorized User',
        text: newMessage,
        time: 'Just Now'
    };
    setChatMessages(prev => [...prev, msg]);
    setNewMessage('');
  };

  return (
    <div className="container mx-auto space-y-8 pb-32 animate-in fade-in duration-700">
       <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest border border-primary/20">
            <Radio className="h-4 w-4" /> Live Node Broadcast
        </div>
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter dynamic-text-mesh">Live Stream</h1>
        <p className="text-muted-foreground text-lg font-medium italic max-w-2xl">
          Broadcast high-performance missions and watch live events in real-time within the secure STARK-B environment.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border-2 border-primary/10 bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
            <CardContent className="p-0 relative aspect-video bg-black flex flex-col items-center justify-center">
                {/* Video tag is always rendered to prevent race conditions */}
                <video 
                    ref={videoRef} 
                    className={cn("w-full h-full object-cover", !isStreaming && "opacity-20")} 
                    autoPlay 
                    muted 
                    playsInline 
                />
                
                { !hasCameraPermission && (
                    <div className="absolute inset-0 flex items-center justify-center p-8 bg-background/90 backdrop-blur-xl z-20">
                        <Alert variant="destructive" className="max-w-md border-2 rounded-3xl">
                            <AlertCircle className="h-5 w-5" />
                            <AlertTitle className="font-black uppercase tracking-tight">Camera Access Required</AlertTitle>
                            <AlertDescription className="font-medium italic">
                                Please allow hardware camera access to initialize your broadcast node.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}

                {isStreaming && (
                    <div className="absolute top-6 left-6 flex items-center gap-3 z-10">
                        <div className="bg-red-500 text-white px-4 py-1.5 rounded-full flex items-center gap-2 animate-pulse shadow-lg">
                            <Radio className="h-4 w-4" />
                            <span className="text-xs font-black uppercase tracking-widest">LIVE</span>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md text-white px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                            <User className="h-3 w-3 text-primary" />
                            <span className="text-xs font-bold tabular-nums">1,204</span>
                        </div>
                    </div>
                )}
            </CardContent>
             <CardHeader className="p-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <CardTitle className="text-3xl font-black uppercase tracking-tight">Building the Future: Live Session</CardTitle>
                        <div className="flex items-center gap-4 text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                                    <AvatarImage src={profile?.profilePicture || user?.photoURL || ''} />
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                                <span className="font-black text-xs uppercase tracking-widest text-primary">{profile?.displayName || user?.displayName || 'Authorized User'}</span>
                            </div>
                            <Dot className="opacity-20" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">NGA Hub Mission Node</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-2xl border border-primary/20">
                        <Zap className="h-4 w-4 text-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">High Perf. Link</span>
                    </div>
                </div>
            </CardHeader>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-8">
            <Card className="border-2 border-primary/10 bg-primary/5 rounded-[2rem] overflow-hidden shadow-xl">
                <CardHeader className="bg-primary/10 p-6 border-b border-primary/10">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" /> Node Governance
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 flex flex-col gap-4">
                    {!isStreaming ? (
                        <Button size="lg" className="h-14 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 text-xs" onClick={() => setIsStreaming(true)} disabled={!hasCameraPermission}>
                            Initialize Stream <Camera className="ml-2 h-5 w-5" />
                        </Button>
                    ) : (
                        <Button size="lg" variant="destructive" className="h-14 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-destructive/20 text-xs" onClick={() => setIsStreaming(false)}>
                            Terminate Node <StopCircle className="ml-2 h-5 w-5" />
                        </Button>
                    )}
                     <p className="text-[9px] text-muted-foreground text-center uppercase font-black tracking-widest opacity-40 pt-2">
                        STARK-B Security Protocol: Encryption active
                     </p>
                </CardContent>
            </Card>

            <Card className="border-2 border-white/5 bg-card/40 backdrop-blur-xl rounded-[2rem] overflow-hidden flex flex-col h-[450px] shadow-2xl">
                 <CardHeader className="p-6 border-b border-white/5 bg-muted/10">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <PlayCircle className="h-4 w-4 text-accent" /> Live Intelligence Chat
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                   {chatMessages.map((msg) => (
                       <div key={msg.id} className="animate-in slide-in-from-bottom-2">
                           <div className="flex items-center gap-2 mb-1">
                               <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{msg.user}</span>
                               <span className="text-[8px] font-bold opacity-30 uppercase">{msg.time}</span>
                           </div>
                           <p className="text-sm font-medium italic opacity-80 leading-relaxed bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5 shadow-inner">
                               "{msg.text}"
                           </p>
                       </div>
                   ))}
                   <div ref={chatEndRef} />
                </CardContent>
                <div className="p-4 bg-black/20 border-t border-white/5">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-white/5 rounded-2xl p-1.5 border border-white/10 focus-within:border-primary/40 transition-all">
                        <Input 
                            placeholder="Add a node..." 
                            className="bg-transparent border-none focus-visible:ring-0 text-xs h-10 font-medium placeholder:opacity-30"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <Button type="submit" size="icon" className="h-10 w-10 rounded-xl bg-primary shadow-lg" disabled={!newMessage.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
}
