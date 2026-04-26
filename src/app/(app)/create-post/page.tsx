'use client';

import * as React from 'react';
import { useState, useRef, Suspense, useCallback } from 'react';
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Slider } from "../../../components/ui/slider";
import {
  Upload, Loader2, X, Send, Music, Sliders, Type,
  Sun, Contrast, ChevronLeft, Check, Film, BookImage,
  Clapperboard, Play, Pause, Volume2, VolumeX, ShieldAlert
} from "lucide-react";
import { useToast } from '../../../hooks/use-toast';
import { containsInappropriateWords } from '../../../lib/inappropriate-words';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '../../../firebase';
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { moderateContent } from '../../../ai/flows/moderate-content';
import Image from 'next/image';
import type { UserProfile } from '../../../lib/types';
import { publishPost } from '../../../hooks/use-realtime-feed';
import { cn } from '../../../lib/utils';
import { isVideoUrl as isVideoMedia } from '../../../lib/utils';
import { supabase } from '../../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
type NodeType = 'post' | 'story' | 'reel' | 'lesson';
type EditStep = 'upload' | 'edit' | 'publish';

const FILTERS = [
  { id: 'none',     label: 'Normal',  css: 'none' },
  { id: 'vivid',    label: 'Vivid',   css: 'saturate(1.8) contrast(1.1)' },
  { id: 'cool',     label: 'Cool',    css: 'hue-rotate(30deg) saturate(1.3)' },
  { id: 'warm',     label: 'Warm',    css: 'sepia(0.4) saturate(1.4)' },
  { id: 'bw',       label: 'B&W',     css: 'grayscale(1)' },
  { id: 'fade',     label: 'Fade',    css: 'opacity(0.85) saturate(0.7) brightness(1.1)' },
  { id: 'drama',    label: 'Drama',   css: 'contrast(1.5) saturate(0.8)' },
  { id: 'neon',     label: 'Neon',    css: 'saturate(2.5) hue-rotate(15deg) brightness(1.1)' },
];

// ─── Media Preview ────────────────────────────────────────────────────────────
function MediaPreview({ url, fileType, filter, textOverlay, textColor, musicUrl, muted = false }:
  { url: string; fileType?: string; filter?: string; textOverlay?: string; textColor?: string; musicUrl?: string; muted?: boolean }) {
  const isVideo = isVideoMedia(url, fileType);
  const isExternal = url.includes('youtube') || url.includes('youtu.be') || url.includes('tiktok') || url.includes('instagram');
  const audioRef = React.useRef<HTMLAudioElement>(null);

  React.useEffect(() => {
    if (audioRef.current && musicUrl) {
      audioRef.current.src = musicUrl;
      audioRef.current.loop = true;
      audioRef.current.volume = 0.4;
      audioRef.current.play().catch(() => {});
    }
    return () => { audioRef.current?.pause(); };
  }, [musicUrl]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {isVideo ? (
        isExternal ? (
          <iframe src={getEmbedUrl(url)} className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : (
          <video src={url} className="w-full h-full object-cover" autoPlay loop playsInline muted={muted}
            style={{ filter: filter || 'none' }} />
        )
      ) : (
        <Image src={url} alt="preview" fill className="object-cover"
          style={{ filter: filter || 'none' }} unoptimized />
      )}
      {textOverlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="font-black text-2xl drop-shadow-2xl px-4 text-center"
            style={{ color: textColor || '#ffffff' }}>{textOverlay}</span>
        </div>
      )}
      {musicUrl && <audio ref={audioRef} className="hidden" />}
    </div>
  );
}

// ─── Music Library ────────────────────────────────────────────────────────────
function MusicLibrary({ onSelect, selected }: { onSelect: (url: string, name: string) => void; selected: string }) {
  const [tracks, setTracks] = React.useState<any[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    supabase.from('music_library').select('*').order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => { if (data) setTracks(data); });
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) { toast({ variant: 'destructive', title: 'Audio files only' }); return; }
    setUploading(true);
    const url = URL.createObjectURL(file);
    const newTrack = { id: Date.now().toString(), name: file.name.replace(/\.[^.]+$/, ''), url, created_at: new Date().toISOString() };
    setTracks(prev => [newTrack, ...prev]);
    onSelect(url, newTrack.name);
    setUploading(false);
    toast({ title: 'Music added', description: newTrack.name });
  };

  const PRESET_TRACKS = [
    { id: 'p1', name: 'Upbeat Vibes', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'p2', name: 'Chill Beats', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'p3', name: 'Epic Energy', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'p4', name: 'Smooth Flow', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  ];

  const allTracks = [...tracks, ...PRESET_TRACKS];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Background Music</p>
        <button onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase text-primary hover:opacity-80 transition-opacity">
          <Upload className="h-3 w-3" /> Upload
        </button>
        <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleUpload} />
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
        <button onClick={() => onSelect('', '')}
          className={cn("w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all border",
            !selected ? "bg-primary/10 border-primary/30" : "bg-white/5 border-white/5 hover:bg-white/10")}>
          <VolumeX className="h-4 w-4 opacity-40 shrink-0" />
          <span className="text-xs font-black uppercase">No Music</span>
        </button>
        {allTracks.map(t => (
          <button key={t.id} onClick={() => onSelect(t.url, t.name)}
            className={cn("w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all border",
              selected === t.url ? "bg-primary/10 border-primary/30" : "bg-white/5 border-white/5 hover:bg-white/10")}>
            <Music className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-medium truncate">{t.name}</span>
            {selected === t.url && <Check className="h-3 w-3 text-primary ml-auto shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Create Post Content ─────────────────────────────────────────────────
function CreatePostContent() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') as NodeType | null;

  // Step state
  const [step, setStep] = React.useState<EditStep>('upload');
  const [nodeType, setNodeType] = React.useState<NodeType>(
    typeParam === 'story' ? 'story' : typeParam === 'reel' ? 'reel' : 'post'
  );

  // Media state
  const [mediaUrl, setMediaUrl] = React.useState('');
  const [mediaFile, setMediaFile] = React.useState<File | null>(null);
  const [fileType, setFileType] = React.useState<string>('');
  const [urlInput, setUrlInput] = React.useState('');
  const [sourceMode, setSourceMode] = React.useState<'file' | 'url'>('file');
  const fileRef = React.useRef<HTMLInputElement>(null);

  // Edit state
  const [activeFilter, setActiveFilter] = React.useState('none');
  const [brightness, setBrightness] = React.useState(100);
  const [contrast, setContrast] = React.useState(100);
  const [saturation, setSaturation] = React.useState(100);
  const [textOverlay, setTextOverlay] = React.useState('');
  const [textColor, setTextColor] = React.useState('#ffffff');
  const [musicUrl, setMusicUrl] = React.useState('');
  const [musicName, setMusicName] = React.useState('');
  const [editTab, setEditTab] = React.useState<'filters' | 'adjust' | 'text' | 'music'>('filters');

  // Publish state
  const [title, setTitle] = React.useState('');
  const [caption, setCaption] = React.useState('');
  const [category, setCategory] = React.useState('general');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef);

  const filterBase = FILTERS.find(f => f.id === activeFilter)?.css || 'none';
  const adjustments = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  const fullFilter = filterBase === 'none' ? adjustments : `${filterBase} ${adjustments}`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setFileType(file.type);

    // Convert to data URL so it persists and can be previewed/posted
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setMediaUrl(dataUrl);
      setStep('edit');
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;
    setMediaUrl(urlInput.trim());
    setFileType('');
    setStep('edit');
  };

    const handlePublish = async () => {
    if (!title.trim() || !caption.trim()) {
      toast({ variant: 'destructive', title: 'Add title and caption' }); return;
    }
    if (!user) { toast({ variant: 'destructive', title: 'Not logged in' }); return; }
    if (!mediaUrl.trim()) { toast({ variant: 'destructive', title: 'No media', description: 'Paste a URL or upload a file first.' }); return; }
    setIsSubmitting(true);

    try {
      const modResult = await moderateContent({ text: `${title} ${caption}` });
      if (modResult.isInappropriate) {
        toast({ variant: 'destructive', title: 'Content flagged', description: modResult.reason });
        setIsSubmitting(false); return;
      }
    } catch { if (containsInappropriateWords(title) || containsInappropriateWords(caption)) {
      toast({ variant: 'destructive', title: 'Inappropriate content' }); setIsSubmitting(false); return;
    }}

    // Ensure media_url is always a non-empty string (Supabase NOT NULL)
    const finalUrl = mediaUrl.trim() || 'https://placehold.co/600x400/1a0533/ffffff?text=NGA+Hub';

    try {
      const postId = await publishPost({
        userId: user.uid,
        userName: profile?.displayName || user.displayName || 'User',
        userAvatar: profile?.profilePicture || user.photoURL || '',
        type: nodeType === 'post' ? (isVideoMedia(mediaUrl, fileType) ? 'video' : 'image') : nodeType as any,
        mediaUrl: finalUrl,
        url: finalUrl,
        caption,
        title,
        ageGroup: profile?.ageGroup || '10-16',
        likesCount: 0,
        commentsCount: 0,
        isFlagged: false,
        category,
      }, firestore);
      if (postId) {
        toast({ title: 'Published!', description: 'Your content is now live.' });
        router.push(`/HomeTon/${profile?.ageGroup || '10-16'}`);
      } else {
        toast({ variant: 'destructive', title: 'Publish failed', description: 'Could not save post. Try again.' });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Publish failed', description: err?.message || 'Unknown error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const NODE_TYPES: { id: NodeType; label: string; icon: any; desc: string }[] = [
    { id: 'post',   label: 'Post',    icon: BookImage,    desc: 'Photo or video to your feed' },
    { id: 'story',  label: 'Story',   icon: Clapperboard, desc: '24-hour disappearing content' },
    { id: 'reel',   label: 'Reel',    icon: Film,         desc: 'Short-form vertical video' },
    { id: 'lesson', label: 'Lesson',  icon: Play,         desc: 'Educational lesson video' },
  ];

  // ── STEP 1: Upload ──────────────────────────────────────────────────────────
  if (step === 'upload') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="flex items-center gap-4 p-4 border-b border-white/5">
          <button onClick={() => router.back()} className="p-2 rounded-full bg-white/5">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="font-black text-lg uppercase tracking-tight">Create</h1>
        </header>

        <div className="flex-1 p-5 space-y-6 max-w-lg mx-auto w-full">
          {/* Node type selector */}
          <div className="grid grid-cols-4 gap-2">
            {NODE_TYPES.map(n => (
              <button key={n.id} onClick={() => setNodeType(n.id)}
                className={cn("flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                  nodeType === n.id ? "border-primary bg-primary/10" : "border-white/10 bg-white/5 hover:bg-white/10")}>
                <n.icon className={cn("h-6 w-6", nodeType === n.id ? "text-primary" : "text-white/60")} />
                <span className={cn("text-xs font-black uppercase tracking-widest", nodeType === n.id ? "text-primary" : "text-white/60")}>{n.label}</span>
                <span className="text-[9px] text-white/30 text-center leading-tight">{n.desc}</span>
              </button>
            ))}
          </div>

          {/* Source toggle */}
          <div className="flex gap-2 bg-white/5 p-1 rounded-2xl">
            {(['file', 'url'] as const).map(s => (
              <button key={s} onClick={() => setSourceMode(s)}
                className={cn("flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  sourceMode === s ? "bg-primary text-white" : "text-white/40")}>
                {s === 'file' ? '📁 Upload File' : '🔗 Paste URL'}
              </button>
            ))}
          </div>

          {sourceMode === 'file' ? (
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-white/10 rounded-3xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all space-y-3">
              <Upload className="h-10 w-10 mx-auto opacity-40" />
              <p className="font-black text-sm uppercase tracking-widest opacity-60">Tap to upload</p>
              <p className="text-[10px] text-white/30">Any format — photo, video, gif</p>
              <input ref={fileRef} type="file" accept="image/*,video/*,audio/*,.gif,.webp,.mp4,.mov,.avi,.mkv,.webm"
                className="hidden" onChange={handleFileChange} />
            </div>
          ) : (
            <div className="space-y-3">
              <Input placeholder="Paste YouTube, TikTok, Instagram or direct media URL..."
                value={urlInput} onChange={e => setUrlInput(e.target.value)}
                className="h-12 bg-white/5 border-white/10 rounded-2xl font-medium" />
              <Button onClick={handleUrlSubmit} disabled={!urlInput.trim()}
                className="w-full h-12 rounded-2xl font-black uppercase text-xs">
                Continue →
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── STEP 2: Edit ────────────────────────────────────────────────────────────
  if (step === 'edit') {
    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 z-20 bg-black/60 backdrop-blur-md">
          <button onClick={() => setStep('upload')} className="p-2 rounded-full bg-white/10">
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <span className="font-black text-white text-xs uppercase tracking-widest">Edit {nodeType}</span>
          <button onClick={() => setStep('publish')}
            className="flex items-center gap-2 bg-primary px-4 py-2 rounded-full font-black text-xs uppercase text-white">
            Next <Check className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Preview */}
        <div className="flex-1 relative">
          <MediaPreview url={mediaUrl} fileType={fileType} filter={fullFilter}
            textOverlay={textOverlay} textColor={textColor} musicUrl={musicUrl} muted />
        </div>

        {/* Edit tabs */}
        <div className="bg-black/90 backdrop-blur-xl border-t border-white/10 pb-safe">
          <div className="flex border-b border-white/5">
            {([
              { id: 'filters', icon: Sliders,  label: 'Filters' },
              { id: 'adjust',  icon: Sun,       label: 'Adjust'  },
              { id: 'text',    icon: Type,      label: 'Text'    },
              { id: 'music',   icon: Music,     label: 'Music'   },
            ] as const).map(tab => (
              <button key={tab.id} onClick={() => setEditTab(tab.id)}
                className={cn("flex-1 flex flex-col items-center gap-1 py-3 transition-all",
                  editTab === tab.id ? "text-primary border-b-2 border-primary" : "text-white/40")}>
                <tab.icon className="h-4 w-4" />
                <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-4">
            {editTab === 'filters' && (
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {FILTERS.map(f => (
                  <button key={f.id} onClick={() => setActiveFilter(f.id)}
                    className={cn("flex flex-col items-center gap-1.5 shrink-0 transition-all", activeFilter === f.id ? "scale-110" : "opacity-60")}>
                    <div className={cn("h-14 w-14 rounded-2xl overflow-hidden border-2", activeFilter === f.id ? "border-primary" : "border-white/10")}>
                      <div className="h-full w-full bg-gradient-to-br from-purple-500 to-pink-500" style={{ filter: f.css }} />
                    </div>
                    <span className="text-[9px] font-black uppercase text-white tracking-widest">{f.label}</span>
                  </button>
                ))}
              </div>
            )}

            {editTab === 'adjust' && (
              <div className="space-y-4">
                {[
                  { label: 'Brightness', value: brightness, set: setBrightness, min: 50, max: 150, color: 'text-yellow-400' },
                  { label: 'Contrast',   value: contrast,   set: setContrast,   min: 50, max: 150, color: 'text-blue-400' },
                  { label: 'Saturation', value: saturation, set: setSaturation, min: 0,  max: 200, color: 'text-pink-400' },
                ].map(s => (
                  <div key={s.label} className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className={cn("text-[10px] font-black uppercase", s.color)}>{s.label}</span>
                      <span className="text-[10px] font-black text-white">{s.value}%</span>
                    </div>
                    <Slider min={s.min} max={s.max} step={1} value={[s.value]}
                      onValueChange={([v]) => s.set(v)} className="w-full" />
                  </div>
                ))}
              </div>
            )}

            {editTab === 'text' && (
              <div className="space-y-3">
                <Input placeholder="Add text overlay..." value={textOverlay}
                  onChange={e => setTextOverlay(e.target.value)}
                  className="bg-white/10 border-white/10 text-white rounded-2xl h-11 font-bold" />
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

            {editTab === 'music' && (
              <MusicLibrary onSelect={(url, name) => { setMusicUrl(url); setMusicName(name); }} selected={musicUrl} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 3: Publish ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center gap-4 p-4 border-b border-white/5">
        <button onClick={() => setStep('edit')} className="p-2 rounded-full bg-white/5">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="font-black text-lg uppercase tracking-tight">Publish {nodeType}</h1>
      </header>

      <div className="flex-1 p-5 space-y-5 max-w-lg mx-auto w-full">
        {/* Preview thumbnail */}
        <div className="relative aspect-square rounded-3xl overflow-hidden bg-black max-w-xs mx-auto w-full">
          <MediaPreview url={mediaUrl} fileType={fileType} filter={fullFilter}
            textOverlay={textOverlay} textColor={textColor} muted />
          {musicName && (
            <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full">
              <Music className="h-3 w-3 text-primary" />
              <span className="text-[9px] font-black text-white truncate max-w-[120px]">{musicName}</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Title</Label>
            <Input placeholder="Give your content a title..." value={title}
              onChange={e => setTitle(e.target.value)}
              className="h-12 bg-white/5 border-white/10 rounded-2xl font-bold" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Caption</Label>
            <Textarea placeholder="Write a caption..." value={caption}
              onChange={e => setCaption(e.target.value)} rows={3}
              className="bg-white/5 border-white/10 rounded-2xl font-medium resize-none" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Category</Label>
            <div className="flex flex-wrap gap-2">
              {['general','news','music','sports','entertainment','education','tech','art'].map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={cn("px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                    category === c ? "bg-primary text-white border-primary" : "bg-white/5 text-white/50 border-white/10")}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
            <ShieldAlert className="h-4 w-4 text-primary shrink-0" />
            <p className="text-[9px] font-black uppercase tracking-widest text-primary/60">AI Moderation Active</p>
          </div>

          <Button onClick={handlePublish} disabled={isSubmitting || !title.trim() || !caption.trim()}
            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Publish to Feed
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}>
      <CreatePostContent />
    </Suspense>
  );
}
