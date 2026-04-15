'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, StopCircle, Play, Save, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

export default function RecordVideoPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
          description: 'Please enable camera permissions in your browser settings to record videos.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [toast]);

  const startRecording = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    if (!stream) return;

    setRecordedChunks([]);
    setVideoUrl(null);
    setRecordingTime(0);
    
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks((prev) => [...prev, event.data]);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      setVideoUrl(URL.createObjectURL(blob));
    };

    mediaRecorder.start();
    setIsRecording(true);

    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSave = async () => {
    if (!videoTitle || !user || !firestore) {
        toast({ title: "Provide a title for your legacy node." });
        return;
    }
    setIsSaving(true);
    try {
      const mockVideoUrl = `https://nga-hub-recorded-${Date.now()}.mp4`;
      await addDoc(collection(firestore, 'users', user.uid, 'videos'), {
        userId: user.uid,
        title: videoTitle,
        videoUrl: mockVideoUrl,
        duration: `${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')}`,
        source: 'record',
        createdAt: serverTimestamp(),
      });
      toast({ title: "Node Saved", description: "Asset synchronized to the superdatabase." });
      router.push('/video-bank');
    } catch (error) {
      toast({ variant: 'destructive', title: "Failed to save video" });
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-8 pb-32 animate-in fade-in duration-700">
      <header className="space-y-2">
        <h1 className="font-headline text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent uppercase">
          Record Your Legacy
        </h1>
        <p className="text-muted-foreground text-lg">
          Capture high-performance moments and share them with the community.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden border-2 border-primary/10 bg-black/5 rounded-[2.5rem]">
            <CardContent className="p-0 relative aspect-video flex flex-col items-center justify-center">
              <video 
                ref={videoRef} 
                className={cn("w-full h-full object-cover", !isRecording && !videoUrl && "opacity-20")} 
                autoPlay 
                muted 
                playsInline
              />
              
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full animate-pulse font-bold text-sm z-10">
                  <div className="h-2 w-2 rounded-full bg-white" />
                  REC {formatTime(recordingTime)}
                </div>
              )}

              {hasCameraPermission === false && (
                <div className="absolute inset-0 flex items-center justify-center p-6 bg-background/90 backdrop-blur-sm z-20">
                  <Alert variant="destructive" className="max-w-md rounded-3xl border-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-black uppercase">Camera Access Required</AlertTitle>
                    <AlertDescription className="italic">
                      Please allow camera access to record videos for the superdatabase.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
            <div className="p-6 bg-muted/30 flex justify-center gap-4 border-t">
              {!isRecording ? (
                <Button 
                    size="lg" 
                    onClick={startRecording} 
                    disabled={hasCameraPermission !== true}
                    className="rounded-full px-8 shadow-lg shadow-primary/20 font-black uppercase text-[10px] tracking-widest h-12"
                >
                  <Camera className="mr-2 h-5 w-5" /> Start Recording
                </Button>
              ) : (
                <Button 
                    size="lg" 
                    variant="destructive" 
                    onClick={stopRecording}
                    className="rounded-full px-8 animate-pulse shadow-lg shadow-destructive/20 font-black uppercase text-[10px] tracking-widest h-12"
                >
                  <StopCircle className="mr-2 h-5 w-5" /> Stop Recording
                </Button>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="border-2 border-primary/10 rounded-[2rem] bg-card/40 backdrop-blur-xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-black uppercase tracking-tight">Superdatabase Sync</CardTitle>
              <CardDescription className="italic">Identify your legacy node asset.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="video-title" className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Asset Title</Label>
                <Input 
                    id="video-title" 
                    placeholder="e.g., Robotics Mission Alpha" 
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className="h-12 bg-black/20 rounded-2xl border-white/5 font-bold"
                />
              </div>

              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="space-y-2 text-[10px] font-black uppercase tracking-widest opacity-60">
                    <p className="flex justify-between"><span>Status</span> <span className={isRecording ? 'text-red-500 animate-pulse' : 'text-green-500'}>{isRecording ? 'Active' : 'Standby'}</span></p>
                    <p className="flex justify-between"><span>Duration</span> <span>{formatTime(recordingTime)}</span></p>
                </div>
              </div>

              <Button 
                className="w-full h-14 font-black uppercase tracking-widest text-[10px] shadow-xl" 
                onClick={handleSave} 
                disabled={isRecording || !videoTitle || recordingTime === 0 || isSaving}
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                EXECUTE SAVE
              </Button>
              
              <Button variant="ghost" className="w-full h-10 text-[9px] font-bold uppercase tracking-widest" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-3 w-3" /> Reset Hardware Node
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
