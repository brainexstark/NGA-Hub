'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Send, PlayCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { ShareDialog } from './share-dialog';
import Link from 'next/link';
import { cn, getEmbedUrl } from '../lib/utils';
import { useUser, useFirestore, updateDocumentNonBlocking } from '../firebase';
import { doc, arrayUnion } from 'firebase/firestore';
import { useRealtimeLikes } from '../hooks/use-realtime';

interface ContentCardProps {
  id?: string;
  title: string;
  creator: string;
  image: any;
  likesCount?: number;
  commentsCount?: number;
  hideActions?: boolean;
}

function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.includes('youtube') || lower.includes('youtu.be') ||
    lower.includes('tiktok') || lower.includes('instagram') ||
    lower.endsWith('.mp4') || lower.endsWith('.webm') ||
    lower.endsWith('.mov') || lower.endsWith('.avi') ||
    lower.endsWith('.mkv') || lower.startsWith('data:video');
}

function InlinePlayer({ url, thumbnail }: { url: string; thumbnail: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const isVideo = isVideoUrl(url);
  const isExternal = url?.includes('youtube') || url?.includes('youtu.be') ||
    url?.includes('instagram') || url?.includes('tiktok');

  useEffect(() => {
    if (!isVideo) return; // photos never autoplay
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPlaying(entry.isIntersecting && entry.intersectionRatio >= 0.6),
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isVideo]);

  const embedUrl = React.useMemo(() => {
    const base = getEmbedUrl(url);
    if (!playing) return base;
    if (base.includes('youtube.com/embed')) {
      return base.includes('?')
        ? `${base}&autoplay=1&mute=1&playsinline=1`
        : `${base}?autoplay=1&mute=1&playsinline=1`;
    }
    return base;
  }, [url, playing]);

  return (
    <div ref={ref} className="absolute inset-0 w-full h-full">
      {!isVideo ? (
        <Image src={url || thumbnail} alt="post" fill className="object-cover" unoptimized />
      ) : playing ? (
        isExternal ? (
          <iframe key="playing" src={embedUrl} className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : (
          <video src={url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
        )
      ) : (
        <div className="absolute inset-0">
          <Image src={thumbnail || url} alt="thumbnail" fill className="object-cover" unoptimized />
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <PlayCircle className="h-12 w-12 text-white/80 drop-shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}

export function ContentCard({ id, title, creator, image, likesCount: initialLikes = 0, commentsCount: initialComments = 0, hideActions = false }: ContentCardProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { likesCount, liked, toggleLike } = useRealtimeLikes(id || '', user?.uid || '');

  const handleEngagement = () => {
    window.dispatchEvent(new CustomEvent('stark-b-entertainment-engaged'));
    if (user && firestore) {
      const userRef = doc(firestore, 'users', user.uid);
      if (image?.category) {
        updateDocumentNonBlocking(userRef, {
          [`interests.${image.category}`]: (prev: any) => (prev || 0) + 1,
          watchHistory: arrayUnion(id),
        });
      } else {
        updateDocumentNonBlocking(userRef, { watchHistory: arrayUnion(id) });
      }
    }
  };

  // Use creator avatar from image data, or generate from creator name seed
  const avatarSrc = image?.userAvatar || image?.avatar || '';

  return (
    <Card className={cn("border-none bg-transparent shadow-none w-full", hideActions ? "" : "space-y-4")} onClick={handleEngagement}>
      {!hideActions && (
      <CardHeader className="p-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border-2 border-background ring-2 ring-primary/20">
            <AvatarImage src={avatarSrc} />
            <AvatarFallback className="bg-primary/20 text-primary font-black text-sm">
              {creator?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-tighter">{creator.toLowerCase().replace(/\s/g, '_')}</span>
          </div>
        </div>
      </CardHeader>
      )}

      <CardContent className={cn(
        "p-0 overflow-hidden relative bg-black border-none shadow-2xl",
        hideActions ? "w-full h-full" : "aspect-square rounded-[2.5rem]"
      )}>
        <InlinePlayer url={image?.url || image?.imageUrl} thumbnail={image?.imageUrl} />
      </CardContent>

      {!hideActions && (
      <CardFooter className="p-0 flex flex-col items-start gap-4">
        <div className="flex items-center gap-5">
          <button className="transition-all active:scale-125 flex items-center gap-1.5" onClick={(e) => { e.stopPropagation(); toggleLike(); }}>
            <Heart className={cn("h-7 w-7", liked ? "fill-red-500 text-red-500" : "text-foreground")} />
            {likesCount > 0 && <span className="text-xs font-black opacity-60">{likesCount}</span>}
          </button>
          <Link href={`/comments/${id}`} className="flex items-center gap-1.5">
            <MessageCircle className="h-7 w-7" />
            {initialComments > 0 && <span className="text-xs font-black opacity-60">{initialComments}</span>}
          </Link>
          <ShareDialog title={title} url={image?.url || image?.imageUrl}>
            <button><Send className="h-7 w-7" /></button>
          </ShareDialog>
        </div>
        <div className="text-[13px] leading-relaxed">
          <span className="font-black mr-2 uppercase text-xs">{creator.toLowerCase().replace(/\s/g, '_')}</span>
          <span className="font-medium text-foreground/80">{image?.description || title}</span>
        </div>
      </CardFooter>
      )}
    </Card>
  );
}
