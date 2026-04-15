'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { UserCheck, UserPlus, X, Zap, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { aiDatabase } from '../lib/ai-database';

interface SocialStatsPopoverProps {
  type: 'disciples' | 'followers' | 'following';
  count: number;
  label: string;
  colorClass?: string;
}

// Generate mock list from aiDatabase contacts + extras
const MOCK_PEOPLE = [
  ...aiDatabase.contacts.map(c => ({ id: c.id, name: c.name, avatar: c.avatar, isFollowing: false })),
  { id: 'p6', name: 'NASA Official', avatar: 'https://picsum.photos/seed/nasa/200/200', isFollowing: true },
  { id: 'p7', name: 'Mark Rober', avatar: 'https://picsum.photos/seed/rober/200/200', isFollowing: false },
  { id: 'p8', name: 'MKBHD', avatar: 'https://picsum.photos/seed/mkbhd/200/200', isFollowing: true },
  { id: 'p9', name: 'Burna Boy', avatar: 'https://picsum.photos/seed/burna/200/200', isFollowing: false },
  { id: 'p10', name: 'Wizkid', avatar: 'https://picsum.photos/seed/wizkid/200/200', isFollowing: true },
];

export function SocialStatsPopover({ type, count, label, colorClass }: SocialStatsPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [following, setFollowing] = React.useState<Record<string, boolean>>({});
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggleFollow = (id: string) => {
    setFollowing(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const title = type === 'disciples' ? 'Disciples' : type === 'followers' ? 'Followers' : 'Following';
  const icon = type === 'disciples' ? Zap : Users;
  const Icon = icon;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex flex-col items-center group cursor-pointer hover:opacity-80 transition-opacity"
      >
        <span className={cn("text-sm font-black leading-none tabular-nums", colorClass)}>{count}</span>
        <span className="text-[10px] font-black uppercase tracking-widest mt-1 group-hover:text-primary transition-colors">{label}</span>
      </button>

      {open && (
        <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 z-[200] w-80 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              <span className="font-black text-sm uppercase tracking-widest text-white">{title}</span>
              <span className="bg-primary/20 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">{count}</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto no-scrollbar divide-y divide-white/5">
            {MOCK_PEOPLE.slice(0, Math.max(3, count)).map((person) => {
              const isFollowed = following[person.id] ?? person.isFollowing;
              return (
                <div key={person.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors">
                  <Avatar className="h-10 w-10 border border-white/10 shrink-0">
                    <AvatarImage src={person.avatar} className="object-cover" />
                    <AvatarFallback className="text-sm font-black">{person.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-white truncate">{person.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                      {type === 'disciples' ? 'Disciple' : type === 'followers' ? 'Follows you' : 'You follow'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={isFollowed ? 'outline' : 'default'}
                    className={cn(
                      "h-8 px-3 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 transition-all",
                      isFollowed
                        ? "border-white/20 text-white/60 hover:border-destructive/50 hover:text-destructive"
                        : "bg-primary border-none text-white shadow-lg shadow-primary/20"
                    )}
                    onClick={() => toggleFollow(person.id)}
                  >
                    {isFollowed ? (
                      <><UserCheck className="h-3 w-3 mr-1" /> Following</>
                    ) : (
                      <><UserPlus className="h-3 w-3 mr-1" /> Follow</>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          {count === 0 && (
            <div className="py-10 text-center opacity-30">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p className="text-xs font-black uppercase tracking-widest">No {title.toLowerCase()} yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
