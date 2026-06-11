'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '../lib/utils';

interface OnlineAvatarProps {
  src?: string;
  fallback?: string;
  isOnline?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ringColor?: string;
}

const sizes = {
  sm:  { avatar: 'h-8 w-8',   dot: 'h-2.5 w-2.5', border: 'border-[1.5px]' },
  md:  { avatar: 'h-10 w-10', dot: 'h-3 w-3',     border: 'border-2' },
  lg:  { avatar: 'h-14 w-14', dot: 'h-3.5 w-3.5', border: 'border-2' },
  xl:  { avatar: 'h-20 w-20', dot: 'h-4 w-4',     border: 'border-2' },
};

/**
 * Avatar with green online dot positioned OUTSIDE the overflow-hidden circle.
 * The dot is always visible — never clipped.
 */
export function OnlineAvatar({ src, fallback = 'U', isOnline, size = 'md', className, ringColor }: OnlineAvatarProps) {
  const s = sizes[size];

  return (
    <div className={cn('relative inline-block shrink-0', className)}>
      {/* Avatar — overflow-hidden only on the inner circle */}
      <div className={cn(s.avatar, 'rounded-full overflow-hidden border-2 border-background', ringColor && `ring-2 ${ringColor}`)}>
        <Avatar className="h-full w-full">
          <AvatarImage
            src={src || ''}
            className="object-cover w-full h-full"
            // Ensure local blob URLs render — no cross-origin restriction on blobs
            crossOrigin={src?.startsWith('blob:') ? undefined : 'anonymous'}
          />
          <AvatarFallback className="bg-white/10 text-white font-black text-xs">
            {fallback?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Green dot — OUTSIDE overflow-hidden, always visible */}
      {isOnline && (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 rounded-full bg-green-400 animate-pulse shadow-md z-20',
            s.dot, s.border, 'border-background'
          )}
          aria-label="Online"
        />
      )}
    </div>
  );
}
