'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Send, PlayCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { PlaceHolderImages } from '../lib/placeholder-images';
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
}

function InlinePlayer({ url, thumbnail }: { url: string; thumbnail: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPlaying(entry.isIntersecting && entry.intersectionRatio >= 0.6),
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

  const isExternal = url?.includes('youtube') || url?.includes('youtu.be') ||
    url?.includes('instagram') || url?.includes('tiktok');

  return (
    <div ref={ref} className="w-full h-full">
      {playing ? (
        isExternal ? (
          <iframe key="playing" src={embedUrl} className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : (
          <video src={url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
        )
      ) : (
        <div className="w-full h-full relative">
          <Image src={thumbnail} alt="thumbnail" fill className="object-cover" unoptimized />
        </div>
      )}
    </div>
  );
}

export function ContentCard({ id, title, creator, image, likesCount: initialLikes = 0, commentsCount: initialComments = 0 }: ContentCardProps) {
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

  return (
    <Card className="border-none bg-transparent shadow-none w-full space-y-4" onClick={handleEngagement}>
      <CardHeader className="p-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border-2 border-background ring-2 ring-primary/20">
            <AvatarImage src={PlaceHolderImages.find(img => img.id === 'user-avatar-1')?.imageUrl} />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-tighter">{creator.toLowerCase().replace(/\s/g, '_')}</span>
            <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">STARK-B Node</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-hidden relative aspect-square rounded-[2.5rem] border-none shadow-2xl bg-black">
        <InlinePlayer url={image?.url || image?.imageUrl} thumbnail={image?.imageUrl} />
      </CardContent>

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
    </Card>
  );
}
