'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, StopCircle, Save, Loader2, RefreshCw, AlertCircle, FlipHorizontal, Mic, MicOff } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { publishPost } from '@/hooks/use-realtime-feed';
import { useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function RecordVideoPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const profileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: profile } = useDoc<UserProfile>(profileRef);

  const [permissionState, setPermissionState] = React.useState<'idle' | 'granted' | 'denied'>('idle');
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordedBlob, setRecordedBlob] = React.useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [videoTitle, setVideoTitle] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [recordingTime, setRecordingTime] = React.useState(0);
  const [facingMode, setFacingMode] = React.useState<'user' | 'environment'>('user');
  const [micEnabled, setMicEnabled] = React.useState(true);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const startCamera = React.useCallback(async (facing: 'user' | 'environment' = facingMode) => {
    // Stop existing stream
    streamRef.current?.getTracks().forEach(t => t.stop());

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: micEnabled,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setPermissionState('granted');
    } catch (err: any) {
      setPermissionState('denied');
      toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Allow camera in browser settings.' });
    }
  }, [facingMode, micEnabled, toast]);

  React.useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const flipCamera = async () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    await startCamera(next);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    setRecordedBlob(null);
    setPreviewUrl(null);
    setRecordingTime(0);

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : 'video/mp4';

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    };

    recorder.start(100);
    setIsRecording(true);
    timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSave = async () => {
    if (!videoTitle.trim()) { toast({ title: 'Add a title first.' }); return; }
    if (!user) { toast({ variant: 'destructive', title: 'Not logged in' }); return; }

    setIsSaving(true);
    try {
      // Use blob URL as media (works locally; for production upload to storage)
      const mediaUrl = previewUrl || `https://picsum.photos/seed/${Date.now()}/800/600`;

      await publishPost({
        userId: user.uid,
        userName: profile?.displayName || user.displayName || 'User',
        userAvatar: profile?.profilePicture || user.photoURL || '',
        type: 'video',
        category: 'general',
        mediaUrl,
        url: mediaUrl,
        caption: videoTitle,
        title: videoTitle,
        ageGroup: profile?.ageGroup || '10-16',
        likesCount: 0,
        commentsCount: 0,
        isFlagged: false,
      }, firestore);

      toast({ title: 'Video Published!', description: 'Now live on the feed.' });
      router.push(`/feed/${profile?.ageGroup || '10-16'}`);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="container mx-auto max-w-2xl space-y-6 pb-32 pt-6 animate-in fade-in duration-700">
      <header className="space-y-1">
        <h1 className="font-headline text-4xl font-black uppercase tracking-tighter dynamic-text-mesh">Record Legacy</h1>
        <p className="text-white/40 text-sm font-medium">Capture and publish directly to the live feed.</p>
      </header>

      {/* Camera viewfinder */}
      <Card className="overflow-hidden border-2 border-primary/10 bg-black rounded-[2.5rem]">
        <CardContent className="p-0 relative aspect-[9/16] max-h-[70vh] flex items-center justify-center bg-black">
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />

          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-full animate-pulse font-black text-xs z-10">
              <div className="h-2 w-2 rounded-full bg-white" />
              REC {fmt(recordingTime)}
            </div>
          )}

          {/* Camera controls overlay */}
          {permissionState === 'granted' && !isRecording && !previewUrl && (
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              <button onClick={flipCamera} className="p-2.5 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-all">
                <FlipHorizontal className="h-5 w-5" />
              </button>
              <button onClick={() => setMicEnabled(p => !p)} className={cn("p-2.5 backdrop-blur-md rounded-full transition-all", micEnabled ? "bg-black/50 text-white" : "bg-red-500/80 text-white")}>
                {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>
            </div>
          )}

          {/* Permission denied */}
          {permissionState === 'denied' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/90 p-8 text-center z-20">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="font-black text-white uppercase tracking-widest text-sm">Camera Access Required</p>
              <p className="text-white/40 text-xs">Allow camera in your browser settings then refresh.</p>
              <Button onClick={() => startCamera()} className="rounded-2xl font-black uppercase text-xs">
                <RefreshCw className="mr-2 h-4 w-4" /> Retry
              </Button>
            </div>
          )}

          {/* Recorded preview */}
          {previewUrl && !isRecording && (
            <video src={previewUrl} className="absolute inset-0 w-full h-full object-cover z-10" controls />
          )}
        </CardContent>

        {/* Record controls */}
        <div className="p-6 bg-black/80 flex items-center justify-center gap-6 border-t border-white/5">
          {!previewUrl ? (
            !isRecording ? (
              <button
                onClick={startRecording}
                disabled={permissionState !== 'granted'}
                className="h-20 w-20 rounded-full bg-red-500 border-4 border-white/20 flex items-center justify-center shadow-2xl shadow-red-500/40 active:scale-95 transition-all disabled:opacity-30"
              >
                <Camera className="h-8 w-8 text-white" />
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="h-20 w-20 rounded-full bg-red-600 border-4 border-white/20 flex items-center justify-center shadow-2xl animate-pulse active:scale-95 transition-all"
              >
                <StopCircle className="h-8 w-8 text-white" />
              </button>
            )
          ) : (
            <div className="flex gap-4 w-full">
              <Button variant="outline" className="flex-1 h-12 rounded-2xl font-black uppercase text-xs border-white/10"
                onClick={() => { setPreviewUrl(null); setRecordedBlob(null); startCamera(); }}>
                <RefreshCw className="mr-2 h-4 w-4" /> Retake
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Save panel — shown after recording */}
      {previewUrl && (
        <Card className="border-2 border-primary/10 rounded-[2rem] bg-card/40 backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-300">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase tracking-tight">Publish to Feed</CardTitle>
            <CardDescription className="italic">Add a title and go live instantly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Video Title</Label>
              <Input placeholder="e.g., My Engineering Project" value={videoTitle}
                onChange={e => setVideoTitle(e.target.value)}
                className="h-12 bg-black/20 rounded-2xl border-white/5 font-bold" />
            </div>
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-40 px-1">
              <span>Duration</span><span>{fmt(recordingTime)}</span>
            </div>
            <Button className="w-full h-14 font-black uppercase tracking-widest text-xs shadow-xl rounded-2xl"
              onClick={handleSave} disabled={!videoTitle.trim() || isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              PUBLISH TO LIVE FEED
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
