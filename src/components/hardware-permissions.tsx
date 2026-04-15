'use client';

import * as React from 'react';
import { Camera, Mic, MicOff, VideoOff, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';

interface HardwarePermissionsProps {
  mode: 'camera' | 'microphone' | 'both';
  onStream?: (stream: MediaStream) => void;
  onClose?: () => void;
  autoRequest?: boolean;
}

export function HardwarePermissions({ mode, onStream, onClose, autoRequest = false }: HardwarePermissionsProps) {
  const { toast } = useToast();
  const [status, setStatus] = React.useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const requestAccess = React.useCallback(async () => {
    setStatus('requesting');
    try {
      const constraints: MediaStreamConstraints = {
        video: mode === 'camera' || mode === 'both' ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        audio: mode === 'microphone' || mode === 'both' ? { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 } : false,
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setStatus('granted');
      if (videoRef.current && (mode === 'camera' || mode === 'both')) {
        videoRef.current.srcObject = mediaStream;
      }
      onStream?.(mediaStream);
      toast({ title: mode === 'microphone' ? '🎤 Microphone Active' : '📷 Camera Active', description: 'Hardware access granted.' });
    } catch (err: any) {
      setStatus('denied');
      toast({ variant: 'destructive', title: 'Hardware Access Denied', description: err.name === 'NotAllowedError' ? 'Please allow access in your browser settings.' : err.message });
    }
  }, [mode, onStream, toast]);

  React.useEffect(() => {
    if (autoRequest) requestAccess();
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, []);

  const stopStream = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setStatus('idle');
    onClose?.();
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-slate-900/90 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl max-w-sm w-full">
      {/* Preview */}
      {(mode === 'camera' || mode === 'both') && status === 'granted' && (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10">
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-red-500/80 backdrop-blur-md px-2 py-1 rounded-full">
            <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
            <span className="text-[9px] font-black uppercase text-white">LIVE</span>
          </div>
        </div>
      )}

      {/* Icon */}
      <div className={`h-16 w-16 rounded-full flex items-center justify-center border-2 transition-all ${
        status === 'granted' ? 'bg-green-500/10 border-green-500/30' :
        status === 'denied' ? 'bg-destructive/10 border-destructive/30' :
        'bg-primary/10 border-primary/20'
      }`}>
        {status === 'granted' ? <CheckCircle2 className="h-8 w-8 text-green-400" /> :
         status === 'denied' ? <AlertTriangle className="h-8 w-8 text-destructive" /> :
         mode === 'microphone' ? <Mic className="h-8 w-8 text-primary" /> :
         <Camera className="h-8 w-8 text-primary" />}
      </div>

      <div className="text-center space-y-1">
        <p className="font-black text-sm uppercase tracking-widest text-white">
          {status === 'idle' && `Allow ${mode === 'microphone' ? 'Microphone' : mode === 'camera' ? 'Camera' : 'Camera & Mic'}`}
          {status === 'requesting' && 'Requesting Access...'}
          {status === 'granted' && `${mode === 'microphone' ? 'Microphone' : 'Camera'} Active`}
          {status === 'denied' && 'Access Denied'}
        </p>
        <p className="text-[10px] text-white/40 font-medium">
          {status === 'denied' ? 'Check browser permissions and try again.' : 'Required for this feature.'}
        </p>
      </div>

      <div className="flex gap-3 w-full">
        {status !== 'granted' && (
          <Button className="flex-1 h-11 rounded-2xl font-black uppercase text-[10px] tracking-widest" onClick={requestAccess} disabled={status === 'requesting'}>
            {mode === 'microphone' ? <Mic className="mr-2 h-4 w-4" /> : <Camera className="mr-2 h-4 w-4" />}
            {status === 'requesting' ? 'Requesting...' : 'Allow Access'}
          </Button>
        )}
        {status === 'granted' && (
          <Button variant="destructive" className="flex-1 h-11 rounded-2xl font-black uppercase text-[10px] tracking-widest" onClick={stopStream}>
            {mode === 'microphone' ? <MicOff className="mr-2 h-4 w-4" /> : <VideoOff className="mr-2 h-4 w-4" />}
            Stop
          </Button>
        )}
        {onClose && (
          <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl border border-white/10" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Hook for easy use anywhere in the app
export function useHardwareAccess() {
  const { toast } = useToast();

  const requestCamera = React.useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      toast({ title: '📷 Camera Active' });
      return stream;
    } catch {
      toast({ variant: 'destructive', title: 'Camera Denied', description: 'Allow camera access in browser settings.' });
      return null;
    }
  }, [toast]);

  const requestMicrophone = React.useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      toast({ title: '🎤 Microphone Active' });
      return stream;
    } catch {
      toast({ variant: 'destructive', title: 'Microphone Denied', description: 'Allow microphone access in browser settings.' });
      return null;
    }
  }, [toast]);

  const requestBoth = React.useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: { echoCancellation: true, noiseSuppression: true } });
      toast({ title: '📷🎤 Camera & Mic Active' });
      return stream;
    } catch {
      toast({ variant: 'destructive', title: 'Hardware Access Denied' });
      return null;
    }
  }, [toast]);

  return { requestCamera, requestMicrophone, requestBoth };
}
