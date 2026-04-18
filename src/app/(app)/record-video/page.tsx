'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Camera, StopCircle, Save, Loader2, RefreshCw, AlertCircle,
  FlipHorizontal, Mic, MicOff, Type, Sliders, Scissors,
  Zap, ChevronLeft, Check, X, Sun, Contrast, Gauge
} from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { publishPost } from '@/hooks/use-realtime-feed';
import { useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';

// ─── Filter definitions ───────────────────────────────────────────────────────
const FILTERS = [
  { id: 'none',      label: 'Normal',   css: 'none' },
  { id: 'vivid',     label: 'Vivid',    css: 'saturate(1.8) contrast(1.1)' },
  { id: 'cool',      label: 'Cool',     css: 'hue-rotate(30deg) saturate(1.3)' },
  { id: 'warm',      label: 'Warm',     css: 'sepia(0.4) saturate(1.4)' },
  { id: 'bw',        label: 'B&W',      css: 'grayscale(1)' },
  { id: 'fade',      label: 'Fade',     css: 'opacity(0.85) saturate(0.7) brightness(1.1)' },
  { id: 'dramatic',  label: 'Drama',    css: 'contrast(1.5) saturate(0.8)' },
  { id: 'neon',      label: 'Neon',     css: 'saturate(2.5) hue-rotate(15deg) brightness(1.1)' },
];

type EditTool = 'none' | 'filters' | 'adjust' | 'text' | 'trim' | 'speed';

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

  // ─── Camera state ────────────────────────────────────────────────────────────
  const [permissionState, setPermissionState] = React.useState<'idle' | 'granted' | 'denied'>('idle');
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordedBlob, setRecordedBlob] = React.useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [recordingTime, setRecordingTime] = React.useState(0);
  const [facingMode, setFacingMode] = React.useState<'user' | 'environment'>('user');
  const [micEnabled, setMicEnabled] = React.useState(true);

  // ─── Edit state ──────────────────────────────────────────────────────────────
  const [activeTool, setActiveTool] = React.useState<EditTool>('none');
  const [activeFilter, setActiveFilter] = React.useState('none');
  const [brightness, setBrightness] = React.useState(100);
  const [contrast, setContrast] = React.useState(100);
  const [saturation, setSaturation] = React.useState(100);
  const [textOverlay, setTextOverlay] = React.useState('');
  const [textColor, setTextColor] = React.useState('#ffffff');
  const [playbackSpeed, setPlaybackSpeed] = React.useState(1);
  const [trimStart, setTrimStart] = React.useState(0);
  const [trimEnd, setTrimEnd] = React.useState(100);
  const [videoDuration, setVideoDuration] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);

  // ─── Publish state ───────────────────────────────────────────────────────────
  const [showPublish, setShowPublish] = React.useState(false);
  const [videoTitle, setVideoTitle] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const previewRef = React.useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // ─── Computed filter string ───────────────────────────────────────────────────
  const filterBase = FILTERS.find(f => f.id === activeFilter)?.css || 'none';
  const adjustments = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  const fullFilter = filterBase === 'none' ? adjustments : `${filterBase} ${adjustments}`;
  const transformStyle = flipped ? 'scaleX(-1)' : 'none';

  const startCamera = React.useCallback(async (facing: 'user' | 'environment' = facingMode) => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: micEnabled,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setPermissionState('granted');
    } catch {
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

  // Apply playback speed to preview
  React.useEffect(() => {
    if (previewRef.current) previewRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed, previewUrl]);

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
    setActiveTool('none');

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordedBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
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

  const retake = () => {
    setPreviewUrl(null);
    setRecordedBlob(null);
    setActiveTool('none');
    setActiveFilter('none');
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setTextOverlay('');
    setPlaybackSpeed(1);
    setTrimStart(0);
    setTrimEnd(100);
    setShowPublish(false);
    startCamera();
  };

  const handleSave = async () => {
    if (!videoTitle.trim()) { toast({ title: 'Add a title first.' }); return; }
    if (!user) { toast({ variant: 'destructive', title: 'Not logged in' }); return; }
    setIsSaving(true);
    try {
      const mediaUrl = previewUrl || `https://picsum.photos/seed/${Date.now()}/800/600`;
      await publishPost({
        userId: user.uid,
        userName: profile?.displayName || user.displayName || 'User',
        userAvatar: profile?.profilePicture || user.photoURL || '',
        type: 'video', category: 'general',
        mediaUrl, url: mediaUrl,
        caption: videoTitle, title: videoTitle,
        ageGroup: profile?.ageGroup || '10-16',
        likesCount: 0, commentsCount: 0, isFlagged: false,
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

  // ─── EDIT PANEL ───────────────────────────────────────────────────────────────
  const renderEditPanel = () => {
    if (activeTool === 'none') return null;
    return (
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-black/90 backdrop-blur-xl rounded-t-3xl p-5 space-y-4 animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-black uppercase tracking-widest text-white/60">
            {activeTool === 'filters' && 'Filters'}
            {activeTool === 'adjust' && 'Adjust'}
            {activeTool === 'text' && 'Text Overlay'}
            {activeTool === 'trim' && 'Trim'}
            {activeTool === 'speed' && 'Speed'}
          </span>
          <button onClick={() => setActiveTool('none')} className="p-1 rounded-full bg-white/10">
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* FILTERS */}
        {activeTool === 'filters' && (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setActiveFilter(f.id)}
                className={cn("flex flex-col items-center gap-1.5 shrink-0 transition-all", activeFilter === f.id ? "scale-110" : "opacity-60")}>
                <div className={cn("h-16 w-16 rounded-2xl overflow-hidden border-2 transition-all", activeFilter === f.id ? "border-primary" : "border-white/10")}>
                  <div className="h-full w-full bg-gradient-to-br from-purple-500 to-pink-500" style={{ filter: f.css }} />
                </div>
                <span className="text-[9px] font-black uppercase text-white tracking-widest">{f.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ADJUST */}
        {activeTool === 'adjust' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Sun className="h-3.5 w-3.5 text-yellow-400" /><span className="text-[10px] font-black uppercase text-white/60">Brightness</span></div>
                <span className="text-[10px] font-black text-white">{brightness}%</span>
              </div>
              <Slider min={50} max={150} step={1} value={[brightness]} onValueChange={([v]) => setBrightness(v)} className="w-full" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Contrast className="h-3.5 w-3.5 text-blue-400" /><span className="text-[10px] font-black uppercase text-white/60">Contrast</span></div>
                <span className="text-[10px] font-black text-white">{contrast}%</span>
              </div>
              <Slider min={50} max={150} step={1} value={[contrast]} onValueChange={([v]) => setContrast(v)} className="w-full" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-pink-400" /><span className="text-[10px] font-black uppercase text-white/60">Saturation</span></div>
                <span className="text-[10px] font-black text-white">{saturation}%</span>
              </div>
              <Slider min={0} max={200} step={1} value={[saturation]} onValueChange={([v]) => setSaturation(v)} className="w-full" />
            </div>
          </div>
        )}

        {/* TEXT OVERLAY */}
        {activeTool === 'text' && (
          <div className="space-y-3">
            <Input
              placeholder="Type your text..."
              value={textOverlay}
              onChange={e => setTextOverlay(e.target.value)}
              className="bg-white/10 border-white/10 text-white rounded-2xl h-12 font-bold placeholder:text-white/30"
            />
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase text-white/60">Color</span>
              <div className="flex gap-2">
                {['#ffffff','#ff0050','#00e5ff','#ffea00','#00ff88','#ff6d00'].map(c => (
                  <button key={c} onClick={() => setTextColor(c)}
                    className={cn("h-7 w-7 rounded-full border-2 transition-all", textColor === c ? "border-white scale-125" : "border-transparent")}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TRIM */}
        {activeTool === 'trim' && (
          <div className="space-y-4">
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Drag to set start and end points</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-white/60">Start</span>
                <span className="text-[10px] font-black text-white">{Math.round(trimStart * videoDuration / 100)}s</span>
              </div>
              <Slider min={0} max={trimEnd - 1} step={1} value={[trimStart]} onValueChange={([v]) => {
                setTrimStart(v);
                if (previewRef.current) previewRef.current.currentTime = v * videoDuration / 100;
              }} className="w-full" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-white/60">End</span>
                <span className="text-[10px] font-black text-white">{Math.round(trimEnd * videoDuration / 100)}s</span>
              </div>
              <Slider min={trimStart + 1} max={100} step={1} value={[trimEnd]} onValueChange={([v]) => setTrimEnd(v)} className="w-full" />
            </div>
            <div className="h-10 bg-white/5 rounded-2xl overflow-hidden relative">
              <div className="absolute inset-y-0 bg-primary/30 rounded-2xl transition-all"
                style={{ left: `${trimStart}%`, right: `${100 - trimEnd}%` }} />
              <div className="absolute inset-y-0 left-0 w-1 bg-primary rounded-l-2xl transition-all" style={{ left: `${trimStart}%` }} />
              <div className="absolute inset-y-0 w-1 bg-primary rounded-r-2xl transition-all" style={{ left: `${trimEnd}%` }} />
            </div>
          </div>
        )}

        {/* SPEED */}
        {activeTool === 'speed' && (
          <div className="space-y-4">
            <div className="flex gap-3 justify-center">
              {[0.5, 0.75, 1, 1.5, 2].map(s => (
                <button key={s} onClick={() => setPlaybackSpeed(s)}
                  className={cn("px-4 py-2 rounded-2xl font-black text-sm transition-all border", playbackSpeed === s ? "bg-primary text-white border-primary" : "bg-white/10 text-white/60 border-white/10")}>
                  {s}x
                </button>
              ))}
            </div>
            <p className="text-center text-[10px] text-white/40 font-bold uppercase tracking-widest">
              {playbackSpeed < 1 ? 'Slow Motion' : playbackSpeed > 1 ? 'Fast Forward' : 'Normal Speed'}
            </p>
          </div>
        )}
      </div>
    );
  };

  // ─── PUBLISH PANEL ────────────────────────────────────────────────────────────
  if (showPublish) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col animate-in fade-in duration-300">
        <div className="flex items-center gap-4 p-4 border-b border-white/10">
          <button onClick={() => setShowPublish(false)} className="p-2 rounded-full bg-white/10">
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <span className="font-black text-white uppercase tracking-widest text-sm">Publish Video</span>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {previewUrl && (
            <div className="relative aspect-[9/16] max-h-[50vh] rounded-3xl overflow-hidden bg-black mx-auto w-full max-w-xs">
              <video src={previewUrl} className="w-full h-full object-cover"
                style={{ filter: fullFilter, transform: transformStyle }}
                loop muted autoPlay playsInline />
              {textOverlay && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="font-black text-2xl drop-shadow-2xl px-4 text-center" style={{ color: textColor }}>{textOverlay}</span>
                </div>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-white/60">Video Title</Label>
            <Input placeholder="e.g., My Engineering Project" value={videoTitle}
              onChange={e => setVideoTitle(e.target.value)}
              className="h-12 bg-white/5 rounded-2xl border-white/10 font-bold text-white" />
          </div>
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/40 px-1">
            <span>Duration</span><span>{fmt(recordingTime)}</span>
          </div>
          <Button className="w-full h-14 font-black uppercase tracking-widest text-xs shadow-xl rounded-2xl"
            onClick={handleSave} disabled={!videoTitle.trim() || isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            PUBLISH TO LIVE FEED
          </Button>
        </div>
      </div>
    );
  }

  // ─── MAIN FULLSCREEN VIEW ─────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black overflow-hidden">

      {/* ── LIVE CAMERA ── */}
      {!previewUrl && (
        <video ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: fullFilter, transform: transformStyle }}
          autoPlay muted playsInline />
      )}

      {/* ── RECORDED PREVIEW ── */}
      {previewUrl && (
        <>
          <video ref={previewRef} src={previewUrl}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: fullFilter, transform: transformStyle }}
            loop autoPlay playsInline
            onLoadedMetadata={e => setVideoDuration((e.target as HTMLVideoElement).duration)} />
          {/* Text overlay on video */}
          {textOverlay && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <span className="font-black text-3xl drop-shadow-2xl px-6 text-center" style={{ color: textColor }}>{textOverlay}</span>
            </div>
          )}
        </>
      )}

      {/* ── PERMISSION DENIED ── */}
      {permissionState === 'denied' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/95 p-8 text-center z-20">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="font-black text-white uppercase tracking-widest text-sm">Camera Access Required</p>
          <p className="text-white/40 text-xs">Allow camera in your browser settings then retry.</p>
          <Button onClick={() => startCamera()} className="rounded-2xl font-black uppercase text-xs">
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-safe pt-4">
        <button onClick={() => router.back()} className="p-2.5 bg-black/40 backdrop-blur-md rounded-full">
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>
        <div className="flex flex-col items-center">
          <span className="font-black text-white text-xs uppercase tracking-widest drop-shadow">Record Legacy</span>
          {isRecording && (
            <span className="text-red-400 font-black text-xs animate-pulse">{fmt(recordingTime)}</span>
          )}
        </div>
        <div className="flex gap-2">
          {!previewUrl && permissionState === 'granted' && (
            <>
              <button onClick={flipCamera} className="p-2.5 bg-black/40 backdrop-blur-md rounded-full">
                <FlipHorizontal className="h-5 w-5 text-white" />
              </button>
              <button onClick={() => setMicEnabled(p => !p)}
                className={cn("p-2.5 backdrop-blur-md rounded-full", micEnabled ? "bg-black/40" : "bg-red-500/80")}>
                {micEnabled ? <Mic className="h-5 w-5 text-white" /> : <MicOff className="h-5 w-5 text-white" />}
              </button>
            </>
          )}
          {previewUrl && (
            <button onClick={() => setFlipped(p => !p)}
              className={cn("p-2.5 backdrop-blur-md rounded-full", flipped ? "bg-primary/80" : "bg-black/40")}>
              <FlipHorizontal className="h-5 w-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* ── RECORDING INDICATOR ── */}
      {isRecording && (
        <div className="absolute top-16 left-4 z-20 flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-full animate-pulse font-black text-xs">
          <div className="h-2 w-2 rounded-full bg-white" />
          REC {fmt(recordingTime)}
        </div>
      )}

      {/* ── EDIT TOOLS BAR (shown after recording) ── */}
      {previewUrl && activeTool === 'none' && (
        <div className="absolute top-16 left-0 right-0 z-20 flex justify-center gap-3 px-4">
          {[
            { id: 'filters' as EditTool, icon: Sliders,  label: 'Filters' },
            { id: 'adjust'  as EditTool, icon: Sun,       label: 'Adjust'  },
            { id: 'text'    as EditTool, icon: Type,      label: 'Text'    },
            { id: 'trim'    as EditTool, icon: Scissors,  label: 'Trim'    },
            { id: 'speed'   as EditTool, icon: Gauge,     label: 'Speed'   },
          ].map(tool => (
            <button key={tool.id} onClick={() => setActiveTool(tool.id)}
              className="flex flex-col items-center gap-1 bg-black/50 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 transition-all active:scale-95">
              <tool.icon className="h-4 w-4 text-white" />
              <span className="text-[8px] font-black uppercase text-white/70 tracking-widest">{tool.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── BOTTOM CONTROLS ── */}
      {activeTool === 'none' && (
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-safe pb-8 px-6">
          {!previewUrl ? (
            /* Recording controls */
            <div className="flex items-center justify-center gap-8">
              {!isRecording ? (
                <button onClick={startRecording} disabled={permissionState !== 'granted'}
                  className="h-20 w-20 rounded-full bg-red-500 border-4 border-white/30 flex items-center justify-center shadow-2xl shadow-red-500/50 active:scale-95 transition-all disabled:opacity-30">
                  <Camera className="h-8 w-8 text-white" />
                </button>
              ) : (
                <button onClick={stopRecording}
                  className="h-20 w-20 rounded-full bg-red-600 border-4 border-white/30 flex items-center justify-center shadow-2xl animate-pulse active:scale-95 transition-all">
                  <StopCircle className="h-8 w-8 text-white" />
                </button>
              )}
            </div>
          ) : (
            /* Post-recording controls */
            <div className="flex items-center gap-4">
              <button onClick={retake}
                className="flex-1 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center gap-2 font-black text-xs uppercase text-white tracking-widest active:scale-95 transition-all">
                <RefreshCw className="h-4 w-4" /> Retake
              </button>
              <button onClick={() => setShowPublish(true)}
                className="flex-1 h-14 rounded-2xl bg-primary flex items-center justify-center gap-2 font-black text-xs uppercase text-white tracking-widest shadow-xl shadow-primary/30 active:scale-95 transition-all">
                <Check className="h-4 w-4" /> Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── EDIT PANEL OVERLAY ── */}
      {renderEditPanel()}
    </div>
  );
}
