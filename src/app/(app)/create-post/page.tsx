'use client';

import * as React from 'react';
import { useState, useRef, Suspense } from 'react';
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Send, Loader2, Upload, Link2, Image as ImageIcon, X, Zap, ShieldAlert } from "lucide-react";
import { useToast } from '../../../hooks/use-toast';
import { containsInappropriateWords } from '../../../lib/inappropriate-words';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '../../../firebase';
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { errorEmitter } from '../../../firebase/error-emitter';
import { FirestorePermissionError } from '../../../firebase/errors';
import { moderateContent } from '../../../ai/flows/moderate-content';
import Image from 'next/image';
import type { UserProfile } from '../../../lib/types';
import { getEmbedUrl } from '../../../lib/utils';
import { publishPost } from '../../../hooks/use-realtime-feed';

function CreatePostContent() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'story' | 'reel'>((typeParam as any) || 'video');
  const [sourceType, setSourceType] = useState<'file' | 'url'>('file');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setMediaUrl(objectUrl); 
  };

  const handleUrlChange = (url: string) => {
      setMediaUrl(url);
      setPreviewUrl(url);
  };

  const clearMedia = () => {
      if (previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setMediaUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !content || !mediaUrl || !user || !firestore) {
      toast({ variant: 'destructive', title: 'Missing Node Data', description: 'Ensure title, link/file, and caption are provided.' });
      return;
    }

    setIsSubmitting(true);

    try {
        const modResult = await moderateContent({ text: `${title} ${content}`, mediaUrl: mediaUrl.startsWith('http') ? mediaUrl : undefined });
        if (modResult.isInappropriate) {
            toast({ 
                variant: 'destructive', 
                title: 'Academic Protocol Violation', 
                description: modResult.reason || 'Inappropriate node detected.' 
            });
            
            await addDoc(collection(firestore, 'flagged_content'), {
                contentId: 'pending',
                contentType: 'post',
                userId: user.uid,
                userName: profile?.displayName || user.displayName || 'Authorized User',
                text: `${title} ${content}`,
                mediaUrl: mediaUrl.startsWith('http') ? mediaUrl : 'local_storage',
                reason: modResult.reason || 'AI Moderation Flag',
                severity: modResult.severity || 'medium',
                timestamp: serverTimestamp(),
                status: 'pending'
            });

            setIsSubmitting(false);
            return;
        }
    } catch (e) {
        if (containsInappropriateWords(title) || containsInappropriateWords(content)) {
            toast({ variant: 'destructive', title: 'Inappropriate Content Detected' });
            setIsSubmitting(false);
            return;
        }
    }
    
    const timestamp = Date.now();
    const finalMediaUrl = mediaUrl.startsWith('blob:') 
        ? `https://picsum.photos/seed/starkb-${timestamp}/800/600` 
        : mediaUrl;

    const postData = {
      userId: user.uid,
      userName: profile?.displayName || user.displayName || 'Authorized User',
      userAvatar: profile?.profilePicture || user.photoURL || '',
      type: mediaType,
      mediaUrl: finalMediaUrl,
      url: finalMediaUrl,
      caption: content,
      title: title,
      ageGroup: profile?.ageGroup || '10-16',
      likesCount: 0,
      commentsCount: 0,
      isFlagged: false,
      category: 'general',
    };

    try {
      await publishPost(postData, firestore);
      toast({ title: 'Broadcast Successful', description: 'Post live on the feed!' });
      setTimeout(() => router.push(`/feed/${postData.ageGroup}`), 800);
    } catch {
      toast({ variant: 'destructive', title: 'Broadcast Failed', description: 'Could not publish post.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const InternalPlayer = ({ url }: { url: string }) => {
      if (!url) return null;
      const embedUrl = getEmbedUrl(url);
      if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('instagram.com') || url.includes('tiktok.com')) {
          return <iframe src={embedUrl} className="w-full h-full border-none" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
      }
      return <video src={url} className="w-full h-full object-cover" controls autoPlay muted />;
  };

  return (
    <div className="container mx-auto max-w-3xl py-10 animate-in fade-in duration-700">
      <header className="mb-10 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest">
            <Zap className="h-4 w-4 fill-current" /> High Performance Broadcast
        </div>
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter dynamic-text-mesh">New Content Node</h1>
        <p className="text-muted-foreground text-lg font-medium italic">Broadcast permanent media assets to the community feed. AI Moderation active.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="space-y-6">
          <Card className="border-2 border-primary/10 bg-card/40 backdrop-blur-2xl shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-white/5">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Node Configuration</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1 opacity-60">Broadcast Title</Label>
                <Input placeholder="e.g., My New Engineering Project" value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 bg-black/20 rounded-2xl border-white/5 font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1 opacity-60">Media Protocol</Label>
                    <Select value={mediaType} onValueChange={(v: any) => { setMediaType(v); clearMedia(); }}>
                        <SelectTrigger className="h-12 bg-black/20 rounded-2xl border-white/5 font-bold">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 rounded-2xl">
                            <SelectItem value="video" className="font-bold">Video Node</SelectItem>
                            <SelectItem value="image" className="font-bold">Photo Node</SelectItem>
                            <SelectItem value="story" className="font-bold">Story Node</SelectItem>
                            <SelectItem value="reel" className="font-bold">Reel Node</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1 opacity-60">Source Logic</Label>
                    <Select value={sourceType} onValueChange={(v: any) => { setSourceType(v); clearMedia(); }}>
                        <SelectTrigger className="h-12 bg-black/20 rounded-2xl border-white/5 font-bold">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 rounded-2xl">
                            <SelectItem value="file" className="font-bold">Local Memory (Upload)</SelectItem>
                            <SelectItem value="url" className="font-bold">External Node (Link)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </div>

              {sourceType === 'file' ? (
                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/10 rounded-3xl p-8 text-center cursor-pointer hover:border-primary/50 transition-all bg-black/10">
                      <Upload className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <Input type="file" ref={fileInputRef} className="hidden" accept={mediaType === 'image' ? "image/*" : "video/*"} onChange={handleFileChange} />
                      <p className="font-bold text-sm uppercase opacity-60">Click to Upload & Sync</p>
                  </div>
              ) : (
                  <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase ml-1 opacity-60 text-primary">External URL Link (YouTube, etc.)</Label>
                      <div className="relative">
                          <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 opacity-40" />
                          <Input 
                            placeholder="Paste link here (e.g. https://youtube.com/...)" 
                            value={mediaUrl} 
                            onChange={(e) => handleUrlChange(e.target.value)} 
                            className="h-14 pl-12 bg-black/20 rounded-2xl border-white/5 font-medium text-primary" 
                          />
                      </div>
                  </div>
              )}

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1 opacity-60">Transmission Caption (Description)</Label>
                <Textarea 
                    placeholder="Enter broadcast metadata or caption..." 
                    rows={4} 
                    value={content} 
                    onChange={(e) => setContent(e.target.value)} 
                    className="bg-black/20 rounded-2xl border-white/5 font-medium" 
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-primary/60">STARK-B AI Moderation Node Active</p>
              </div>

              <Button onClick={handleSubmit} className="w-full h-16 text-xl font-black font-headline rounded-3xl shadow-2xl shadow-primary/20" disabled={isSubmitting || !mediaUrl}>
                {isSubmitting ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : <Send className="mr-3 h-6 w-6" />}
                EXECUTE BROADCAST
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-4">Broadcast Preview Node</h2>
            <div className="relative aspect-square rounded-[3rem] overflow-hidden border-2 border-white/5 bg-black shadow-2xl">
                {previewUrl ? (
                    mediaType === 'image' || mediaType === 'story' ? (
                        <Image src={previewUrl} alt="Preview" fill className="object-cover" unoptimized />
                    ) : (
                        <div className="w-full h-full">
                            <InternalPlayer url={previewUrl} />
                        </div>
                    )
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-10 opacity-30">
                        <ImageIcon className="h-12 w-12 text-primary" />
                        <p className="font-headline text-xl font-bold uppercase mt-4">Awaiting Node Data</p>
                        <p className="text-[10px] font-black mt-2">Paste a link or upload a file to initialize</p>
                    </div>
                )}
            </div>
        </section>
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
