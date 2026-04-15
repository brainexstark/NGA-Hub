
'use client';

import * as React from 'react';
import { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Send, PlayCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "./ui/dialog";
import { PlaceHolderImages, type ImagePlaceholder } from '../lib/placeholder-images';
import { useToast } from '../hooks/use-toast';
import { ShareDialog } from './share-dialog';
import Link from 'next/link';
import { cn, getEmbedUrl } from '../lib/utils';
import { useUser, useFirestore, updateDocumentNonBlocking } from '../firebase';
import { doc, arrayUnion } from 'firebase/firestore';

interface ContentCardProps {
  id?: string;
  title: string;
  creator: string;
  image: ImagePlaceholder & { category?: string };
  likesCount?: number;
  commentsCount?: number;
}

export function ContentCard({ id, title, creator, image, likesCount: initialLikes = 0, commentsCount: initialComments = 0 }: ContentCardProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [liked, setLiked] = useState(false);

  const handleEngagement = () => {
    window.dispatchEvent(new CustomEvent('stark-b-entertainment-engaged'));
    
    if (user && firestore) {
        const userRef = doc(firestore, 'users', user.uid);
        
        // Track category interest
        if (image.category) {
            const interestKey = `interests.${image.category}`;
            updateDocumentNonBlocking(userRef, { 
                [interestKey]: (prev: any) => (prev || 0) + 1,
                watchHistory: arrayUnion(id) 
            });
        } else {
            updateDocumentNonBlocking(userRef, { 
                watchHistory: arrayUnion(id) 
            });
        }
    }
  };

  const InternalPlayer = ({ url }: { url: string }) => {
      if (!url) return <div className="w-full h-full bg-black flex items-center justify-center text-white/40 italic">Asset Unavailable</div>;
      const embedUrl = getEmbedUrl(url);
      if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('instagram.com') || url.includes('tiktok.com')) {
          return <iframe src={embedUrl} className="w-full h-full border-none" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
      }
      return <video src={url} className="w-full h-full" controls autoPlay muted />;
  };

  return (
    <Card className="border-none bg-transparent shadow-none w-full space-y-4">
      <CardHeader className="p-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border-2 border-background ring-2 ring-primary/20">
                <AvatarImage src={PlaceHolderImages.find(img => img.id === 'user-avatar-1')?.imageUrl} />
                <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <span className="text-sm font-black uppercase tracking-tighter">{creator.toLowerCase().replace(/\s/g, '_')}</span>
                <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">STARK-B Internal Node</span>
            </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-hidden relative aspect-square group cursor-pointer rounded-[2.5rem] border-none shadow-2xl bg-muted/20">
        <Dialog>
            <DialogTrigger asChild>
                <div className="w-full h-full relative" onClick={handleEngagement}>
                    <Image src={image.imageUrl} alt={title} fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="p-5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                            <PlayCircle className="h-12 w-12 text-white" />
                        </div>
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-[96vw] h-[96vh] p-0 overflow-hidden border-2 border-primary/20 bg-black rounded-[3rem] shadow-2xl flex flex-col items-center justify-center">
                <DialogTitle className="sr-only">{title} Transmission</DialogTitle>
                <InternalPlayer url={image.url || image.imageUrl} />
            </DialogContent>
        </Dialog>
      </CardContent>

      <CardFooter className="p-0 flex flex-col items-start gap-4">
        <div className="flex items-center gap-5">
            <button className="transition-all active:scale-125" onClick={() => setLiked(!liked)}>
                <Heart className={cn("h-7 w-7", liked ? "fill-red-500 text-red-500" : "text-foreground")} />
            </button>
            <Link href={`/comments/${id}`}><MessageCircle className="h-7 w-7" /></Link>
            <ShareDialog title={title} url={image.url || image.imageUrl}>
                <button><Send className="h-7 w-7" /></button>
            </ShareDialog>
        </div>
        <div className="text-[13px] leading-relaxed">
            <span className="font-black mr-2 uppercase text-xs">{creator.toLowerCase().replace(/\s/g, '_')}</span>
            <span className="font-medium text-foreground/80">{image.description || title}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
