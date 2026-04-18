'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { UserCheck, UserPlus, UserMinus, X, Zap, Users, Loader2, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser, useFirestore } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, increment, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface SocialStatsPopoverProps {
  type: 'disciples' | 'followers' | 'following';
  count: number;
  label: string;
  colorClass?: string;
}

export function SocialStatsPopover({ type, count, label, colorClass }: SocialStatsPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [people, setPeople] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  React.useEffect(() => {
    if (!open) return;
    if (!open) return;
    if (!user || !firestore) return;
    setLoading(true);
    const colName = type === 'following' ? 'following' : type === 'followers' ? 'followers' : 'disciples_of';
    const unsub = onSnapshot(collection(firestore, 'users', user.uid, colName), (snap) => {
      setPeople(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [open, user, firestore, type]);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleUnfollow = async (personId: string) => {
    if (!user || !firestore) return;
    await deleteDoc(doc(firestore, 'users', user.uid, 'following', personId));
    await updateDoc(doc(firestore, 'users', user.uid), { followingCount: increment(-1) }).catch(() => {});
    await updateDoc(doc(firestore, 'users', personId), { followersCount: increment(-1) }).catch(() => {});
  };

  const handleFollow = async (personId: string, personName: string, personAvatar: string) => {
    if (!user || !firestore) return;
    await setDoc(doc(firestore, 'users', user.uid, 'following', personId), {
      userId: personId, displayName: personName, profilePicture: personAvatar, followedAt: serverTimestamp(),
    });
    await setDoc(doc(firestore, 'users', personId, 'followers', user.uid), {
      userId: user.uid, followedAt: serverTimestamp(),
    });
    await updateDoc(doc(firestore, 'users', user.uid), { followingCount: increment(1) }).catch(() => {});
    await updateDoc(doc(firestore, 'users', personId), { followersCount: increment(1) }).catch(() => {});
  };

  const title = type === 'disciples' ? 'Disciples' : type === 'followers' ? 'Followers' : 'Following';
  const Icon = type === 'disciples' ? Zap : Users;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)} className="flex flex-col items-center group cursor-pointer hover:opacity-80 transition-opacity">
        <span className={cn("text-sm font-black leading-none tabular-nums", colorClass)}>{count}</span>
        <span className="text-[10px] font-black uppercase tracking-widest mt-1 group-hover:text-primary transition-colors">{label}</span>
      </button>

      {open && (
        <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 z-[200] w-80 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              <span className="font-black text-sm uppercase tracking-widest text-white">{title}</span>
              <span className="bg-primary/20 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">{people.length}</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto no-scrollbar divide-y divide-white/5">
            {loading && <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
            {!loading && people.length === 0 && (
              <div className="py-10 text-center opacity-30">
                <Users className="h-8 w-8 mx-auto mb-2" />
                <p className="text-xs font-black uppercase tracking-widest">No {title.toLowerCase()} yet</p>
              </div>
            )}
            {!loading && people.map((person) => (
              <div key={person.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors">
                <Avatar className="h-10 w-10 border border-white/10 shrink-0">
                  <AvatarImage src={person.profilePicture || person.avatar || `https://picsum.photos/seed/${person.id}/100/100`} className="object-cover" />
                  <AvatarFallback className="text-sm font-black">{(person.displayName || person.name || 'U')[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-white truncate">{person.displayName || person.name || 'User'}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                    {type === 'disciples' ? 'Disciple' : type === 'followers' ? 'Follows you' : 'You follow'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-primary/10"
                    onClick={() => { setOpen(false); router.push('/chat'); }}>
                    <MessageCircle className="h-3.5 w-3.5" />
                  </Button>
                  {type === 'following' ? (
                    <Button size="sm" variant="outline" className="h-8 px-2 rounded-full text-[9px] font-black uppercase border-white/20 hover:border-destructive/50 hover:text-destructive"
                      onClick={() => handleUnfollow(person.id)}>
                      <UserMinus className="h-3 w-3 mr-1" /> Unfollow
                    </Button>
                  ) : type === 'followers' ? (
                    <Button size="sm" className="h-8 px-2 rounded-full text-[9px] font-black uppercase bg-primary"
                      onClick={() => handleFollow(person.id, person.displayName || 'User', person.profilePicture || '')}>
                      <UserPlus className="h-3 w-3 mr-1" /> Follow
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
