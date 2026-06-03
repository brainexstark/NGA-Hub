
'use client';

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Film, 
  PlayCircle, 
  Loader2, 
  Camera, 
  Download, 
  Link2, 
  Trash2,
  UploadCloud,
  Zap,
  ShieldAlert
} from "lucide-react";
import { cn, getEmbedUrl } from "@/lib/utils";
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, serverTimestamp, deleteDoc, doc, query, orderBy, addDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { moderateContent } from '@/ai/flows/moderate-content';
import type { VideoEntry, UserProfile } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useCollection } from '@/firebase';
import { UsageTimer } from "@/components/usage-timer";
import { supabase } from "@/lib/supabase";

const InternalPlayer = ({ url }: { url: string }) => {
  if (!url) return null;
  const embedUrl = getEmbedUrl(url);
  const isSocial = url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || url.includes('tiktok.com') || url.includes('instagram.com');

  if (isSocial) {
    return (
      <iframe
        src={embedUrl}
        className="w-full h-full border-none"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  // Direct video: file extension, blob URL, or Supabase/CDN storage path
  const isDirectVideo = (u: string) =>
    /\.(mp4|webm|ogg|mov|m4v|avi|mkv)(\?.*)?$/i.test(u) ||
    u.startsWith('blob:') ||
    u.startsWith('data:video') ||
    u.includes('/storage/v1/object/') ||
    u.includes('/object/public/');

  if (isDirectVideo(url)) {
    return (
      <video
        src={url}
        className="w-full h-full"
        controls
        autoPlay
        playsInline
        onError={(e) => {
          // If blob URL is expired (session ended), show a friendly message
          const target = e.currentTarget;
          if (url.startsWith('blob:')) {
            target.parentElement!.innerHTML =
              '<div class="flex flex-col items-center justify-center h-full gap-3 text-white/40 p-8 text-center"><svg xmlns=\'http://www.w3.org/2000/svg\' class=\'h-12 w-12\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z\' /></svg><p class=\'text-xs font-black uppercase tracking-widest\'>Local video expired</p><p class=\'text-[10px]\'>Re-upload the file to play it again</p></div>';
          }
        }}
      />
    );
  }

  return (
    <iframe
      src={url}
      className="w-full h-full border-none"
      allowFullScreen
    />
  );
};

export default function VideoBankPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<VideoEntry | null>(null);
  const [uploadSource, setUploadSource] = useState<'url' | 'local'>('url');
  
  // Session Governance Sync
  const [remainingSeconds, setRemainingSeconds] = useState<number>(1800);
  const [protocolStatus, setProtocolStatus] = useState<string>('AUTHORIZED');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const userProfileRef = useMemoFirebase(() => (!user || !firestore) ? null : doc(firestore, 'users', user.uid), [user, firestore]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef);

  const videosQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'videos'),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: userVideos, isLoading } = useCollection<VideoEntry>(videosQuery);

  useEffect(() => {
    const handleSync = (e: any) => {
        setRemainingSeconds(e.detail.remainingSeconds);
        setProtocolStatus(e.detail.protocolStatus);
    };
    window.addEventListener('stark-b-timer-sync', handleSync);
    return () => window.removeEventListener('stark-b-timer-sync', handleSync);
  }, []);

  const handleSelectVideo = (video: VideoEntry) => {
    setCurrentVideo(video);
    // STARK-B Engagement Sync: Archival videos are part of entertainment protocol
    window.dispatchEvent(new CustomEvent('stark-b-entertainment-engaged'));
  };

  const handleDeposit = async () => {
    if (!videoUrl || !videoTitle || !user || !firestore) {
        toast({ variant: 'destructive', title: "Missing Node Data" });
        return;
    }

    setIsDepositing(true);

    try {
        const modResult = await moderateContent({ text: videoTitle, mediaUrl: videoUrl.startsWith('http') ? videoUrl : undefined });
        if (modResult.isInappropriate) {
            toast({ 
                variant: 'destructive', 
                title: 'Academic Protocol Violation', 
                description: modResult.reason || 'Inappropriate node detected.' 
            });
            
            await addDoc(collection(firestore, 'flagged_content'), {
                contentId: 'pending',
                contentType: 'video',
                userId: user.uid,
                userName: profile?.displayName || user.displayName || 'Authorized User',
                text: videoTitle,
                mediaUrl: videoUrl.startsWith('http') ? videoUrl : 'local_storage',
                reason: modResult.reason || 'AI Moderation Flag',
                severity: modResult.severity || 'medium',
                timestamp: serverTimestamp(),
                status: 'pending'
            });

            setIsDepositing(false);
            return;
        }
    } catch (e) {
        console.warn("Moderation handshake failed - relying on legacy filter.");
    }

    const videoId = `vid_${Date.now()}`;
    const videoRef = doc(firestore, 'users', user.uid, 'videos', videoId);
    
    const videoData = {
      userId: user.uid,
      title: videoTitle,
      videoUrl: videoUrl,
      duration: '0:30',
      source: uploadSource === 'local' ? 'record' : 'deposit',
      createdAt: serverTimestamp(),
    };

    setDocumentNonBlocking(videoRef, videoData, { merge: true });
    
    setVideoUrl('');
    setVideoTitle('');
    toast({ title: "Asset Deposited", description: "Video successfully synced to your superdatabase records." });
    setIsDepositing(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Show local preview immediately so the user sees something
      const localBlob = URL.createObjectURL(file);
      setVideoUrl(localBlob);
      setVideoTitle(prev => prev || file.name.replace(/\.[^.]+$/, ''));
      setUploadSource('local');

      // Upload to Supabase Storage in the background and replace blob with real URL
      try {
        const ext = file.name.split('.').pop() || 'mp4';
        const path = `videos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { data, error } = await supabase.storage.from('media').upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });
        if (data && !error) {
          const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
          if (urlData?.publicUrl) {
            setVideoUrl(urlData.publicUrl);
            toast({ title: 'Video uploaded', description: 'Ready to deposit.' });
          }
        } else if (error) {
          toast({ variant: 'destructive', title: 'Upload failed', description: 'Video saved locally for this session only.' });
        }
      } catch {
        toast({ variant: 'destructive', title: 'Upload failed', description: 'Video saved locally for this session only.' });
      }
  };

  const handleWithdraw = (videoId: string) => {
    if (!user || !firestore) return;
    const videoRef = doc(firestore, 'users', user.uid, 'videos', videoId);

    if (currentVideo?.id === videoId) setCurrentVideo(null);

    deleteDoc(videoRef).catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: videoRef.path,
        operation: 'delete',
      }));
    });
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'record': return <Camera className="h-4 w-4" />;
      case 'save': return <Download className="h-4 w-4" />;
      default: return <Link2 className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto space-y-8 animate-in fade-in duration-500 pt-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-headline text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent uppercase">
            Video Bank
          </h1>
          <p className="text-muted-foreground text-lg font-medium italic">
            Your personal superdatabase for high-performance media. AI Moderation active.
          </p>
        </div>
        <div className="flex items-center gap-6">
            {protocolStatus === 'ENTERTANING' && (
                <div className="w-48 scale-90 origin-right transition-all duration-1000">
                    <UsageTimer remainingSeconds={remainingSeconds} />
                </div>
            )}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="shadow-lg font-bold px-6 h-12 rounded-full">
                  <Plus className="mr-2 h-5 w-5" /> Deposit Video
                </Button>
              </DialogTrigger>
              <DialogContent className="border-2 border-primary/10 bg-slate-900 rounded-[3rem] max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-headline uppercase text-white">Deposit Asset</DialogTitle>
                  <DialogDescription className="text-primary/60 font-bold uppercase tracking-widest text-[10px]">
                    Synchronize local or external node data
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                      <Button 
                        variant={uploadSource === 'url' ? 'default' : 'ghost'} 
                        className="flex-1 rounded-xl h-10 text-[10px] font-black uppercase tracking-widest"
                        onClick={() => setUploadSource('url')}
                      >
                          URL Link
                      </Button>
                      <Button 
                        variant={uploadSource === 'local' ? 'default' : 'ghost'} 
                        className="flex-1 rounded-xl h-10 text-[10px] font-black uppercase tracking-widest"
                        onClick={() => { setUploadSource('local'); fileInputRef.current?.click(); }}
                      >
                          Local Node
                      </Button>
                  </div>

                  <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileChange} />

                  <div className="space-y-2">
                    <Label htmlFor="video-title" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Asset Title</Label>
                    <Input 
                      id="video-title" 
                      value={videoTitle} 
                      onChange={(e) => setVideoTitle(e.target.value)} 
                      placeholder="e.g., STARK-B Legacy Asset" 
                      className="bg-black/40 border-white/10 text-white rounded-2xl h-12"
                    />
                  </div>

                  {uploadSource === 'url' ? (
                      <div className="space-y-2">
                        <Label htmlFor="video-url" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Video Node Link</Label>
                        <Input 
                          id="video-url" 
                          value={videoUrl} 
                          onChange={(e) => setVideoUrl(e.target.value)} 
                          placeholder="YouTube, TikTok, etc." 
                          className="bg-black/40 border-white/10 text-white rounded-2xl h-12"
                        />
                      </div>
                  ) : (
                      <div className="p-6 border-2 border-dashed border-primary/20 rounded-3xl text-center bg-primary/5">
                          <UploadCloud className="h-10 w-10 text-primary mx-auto mb-2" />
                          <p className="text-[10px] font-black uppercase text-primary/60 tracking-widest">
                              {videoUrl ? "Node Prepared for Sync" : "Click 'Local Node' to select file"}
                          </p>
                          {videoUrl && <p className="text-[8px] text-white/40 mt-1 truncate">{videoUrl.slice(0, 30)}...</p>}
                      </div>
                  )}

                  <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
                      <ShieldAlert className="h-4 w-4 text-primary" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-primary/60">AI Protocol: Media Scanning Active</p>
                  </div>

                  <Button onClick={handleDeposit} disabled={isDepositing || !videoUrl} className="w-full h-14 text-sm font-black uppercase tracking-widest shadow-lg rounded-full">
                    {isDepositing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                    EXECUTE DEPOSIT
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        <div className="lg:col-span-2">
          <Card className="border-2 border-primary/10 overflow-hidden shadow-xl bg-card rounded-[2.5rem]">
            <CardHeader className="bg-muted/30 border-b border-primary/5">
              <CardTitle className="flex items-center gap-2 text-primary font-headline uppercase tracking-tight">
                <PlayCircle className="h-5 w-5" />
                Internal High-Performance Player
              </CardTitle>
              <CardDescription className="italic">
                {currentVideo ? `Now playing: ${currentVideo.title}` : "Select a video from your superdatabase records."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full aspect-video bg-black flex items-center justify-center relative">
                {currentVideo ? (
                  <InternalPlayer url={currentVideo.videoUrl} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-[#0a0514]">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                      <Film className="h-10 w-10 text-primary/40" />
                    </div>
                    <p className="font-black uppercase tracking-widest text-[10px] opacity-50 text-white">Awaiting Media Selection</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="h-full border-2 border-primary/10 shadow-lg bg-card/50 backdrop-blur-md rounded-[2.5rem] overflow-hidden flex flex-col">
            <CardHeader className="border-b border-primary/5 bg-muted/20">
              <CardTitle className="text-sm font-black uppercase tracking-widest">Superdatabase Records</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-tighter opacity-60">Personal collection</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              {isLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>
              ) : userVideos && userVideos.length > 0 ? (
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                  <Table>
                    <TableBody>
                      {userVideos.map((video) => (
                        <TableRow 
                          key={video.id}
                          onClick={() => handleSelectVideo(video)}
                          className={cn(
                            "cursor-pointer transition-colors border-b border-white/5",
                            currentVideo?.id === video.id ? "bg-primary/10" : "hover:bg-white/5"
                          )}
                        >
                          <TableCell className="w-12 pr-0 pl-6">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              {getSourceIcon(video.source || 'deposit')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-bold text-sm line-clamp-1">{video.title}</p>
                            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">{video.duration} • {video.source || 'external'}</p>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors rounded-full" 
                              onClick={(e) => { e.stopPropagation(); handleWithdraw(video.id); }}
                              title="Withdraw Asset"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-24 text-center space-y-4 px-6 opacity-30">
                  <Film className="h-16 w-16 mx-auto" />
                  <p className="italic font-medium">Your superdatabase is empty.</p>
                  <p className="text-[10px] font-black uppercase tracking-widest">Deposit your first asset to build your legacy bank.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
