'use client';

import * as React from 'react';
import { Heart, MessageCircle, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { ShareDialog } from './share-dialog';
import Link from 'next/link';
import { cn } from '../lib/utils';
import { useUser } from '../firebase';
import { supabase } from '../lib/supabase';
import { useRealtimeLikes } from '../hooks/use-realtime';
import { MediaRenderer } from './media-renderer';

interface ContentCardProps {
  id?: string;
  title: string;
  creator: string;
  image: any;
  likesCount?: number;
  commentsCount?: number;
  hideActions?: boolean;
}

export function ContentCard({ id, title, creator, image, likesCount: initialLikes = 0, commentsCount: initialComments = 0, hideActions = false }: ContentCardProps) {
  const { user } = useUser();
  const { likesCount, liked, toggleLike } = useRealtimeLikes(id || '', user?.uid || '');

  const handleEngagement = () => {
    window.dispatchEvent(new CustomEvent('stark-b-entertainment-engaged'));
    if (user && id) {
      void (async () => {
        try {
          const { data } = await supabase.from('app_users').select('watch_history').eq('id', user.uid).single();
          const history: string[] = (data as any)?.watch_history || [];
          if (!history.includes(id)) {
            await supabase.from('app_users').update({ watch_history: [...history, id] }).eq('id', user.uid);
          }
        } catch {}
      })();
    }
  };

  const avatarSrc = image?.userAvatar || image?.avatar || '';
  const mediaUrl = image?.url || image?.imageUrl || '';

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
        hideActions ? "w-full h-full" : "aspect-[9/16] rounded-[2.5rem]"
      )}>
        <MediaRenderer
          url={mediaUrl}
          className="absolute inset-0 w-full h-full"
          autoPlayOnView
          loop
          controls={false}
          alt={title}
        />
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
