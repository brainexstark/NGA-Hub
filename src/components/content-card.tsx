'use client';

import * as React from 'react';
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
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

export function ContentCard({
  id,
  title,
  creator,
  image,
  likesCount: initialLikes = 0,
  commentsCount: initialComments = 0,
  hideActions = false,
}: ContentCardProps) {
  const { user } = useUser();
  const { likesCount, liked, toggleLike } = useRealtimeLikes(id || '', user?.uid || '');
  const [saved, setSaved] = React.useState(false);

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
  const mediaUrl  = image?.url || image?.imageUrl || '';
  const handle    = (creator || 'user').toLowerCase().replace(/\s+/g, '_');

  return (
    // ── Post container — black background, media as hero ──────────────────
    <article
      className={cn(
        'w-full bg-nga-dark-bg',
        hideActions ? '' : 'border-b border-nga-dark-border',
      )}
      onClick={handleEngagement}
    >
      {/* ── Header — avatar + username ──────────────────────────────────── */}
      {!hideActions && (
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            {/* Story ring gradient border */}
            <div className="nga-story-ring p-[2px] rounded-full">
              <div className="rounded-full bg-nga-dark-bg p-[2px]">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarSrc} alt={handle} />
                  <AvatarFallback className="bg-nga-dark-tertiary text-nga-dark-text text-xs font-semibold">
                    {creator?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="nga-username text-[13px]">{handle}</span>
            </div>
          </div>
          {/* ⋯ more options */}
          <button className="text-foreground/60 hover:text-foreground transition-colors p-1">
            <span className="text-lg font-bold leading-none">···</span>
          </button>
        </div>
      )}

      {/* ── Media — square or portrait, full bleed ──────────────────────── */}
      <div className={cn(
        'relative w-full bg-nga-dark-surface overflow-hidden',
        hideActions ? 'h-full' : 'aspect-square',
      )}>
        <MediaRenderer
          url={mediaUrl}
          className="absolute inset-0 w-full h-full"
          autoPlayOnView
          loop
          controls={false}
          alt={title}
        />
      </div>

      {/* ── Action bar ──────────────────────────────────────────────────── */}
      {!hideActions && (
        <div className="px-3 pt-2 pb-3 space-y-2">
          {/* Action icons row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Like */}
              <button
                className="active:scale-110 transition-transform"
                onClick={e => { e.stopPropagation(); toggleLike(); }}
                aria-label="Like"
              >
                <Heart
                  className={cn(
                    'h-6 w-6 transition-colors duration-150',
                    liked
                      ? 'fill-nga-red text-nga-red'   // IG red when liked
                      : 'text-foreground',
                  )}
                />
              </button>
              {/* Comment */}
              <Link
                href={`/comments/${id}`}
                className="active:opacity-60 transition-opacity"
                aria-label="Comment"
              >
                <MessageCircle className="h-6 w-6 text-foreground" />
              </Link>
              {/* Share */}
              <ShareDialog title={title} url={mediaUrl}>
                <button className="active:opacity-60 transition-opacity" aria-label="Share">
                  <Send className="h-6 w-6 text-foreground" />
                </button>
              </ShareDialog>
            </div>
            {/* Save / Bookmark */}
            <button
              onClick={e => { e.stopPropagation(); setSaved(p => !p); }}
              className="active:scale-110 transition-transform"
              aria-label="Save"
            >
              <Bookmark
                className={cn(
                  'h-6 w-6 transition-colors duration-150',
                  saved ? 'fill-foreground text-foreground' : 'text-foreground',
                )}
              />
            </button>
          </div>

          {/* Like count */}
          {likesCount > 0 && (
            <p className="nga-action-count text-[13px]">
              {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
            </p>
          )}

          {/* Caption */}
          <p className="nga-caption text-[13px] leading-[18px]">
            <span className="nga-username mr-1.5">{handle}</span>
            <span className="text-foreground/90">{image?.description || title}</span>
          </p>

          {/* View comments */}
          {initialComments > 0 && (
            <Link href={`/comments/${id}`}>
              <p className="nga-text-muted text-[13px]">
                View all {initialComments} comments
              </p>
            </Link>
          )}
        </div>
      )}
    </article>
  );
}
