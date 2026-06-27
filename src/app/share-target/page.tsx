'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Share2, CheckCircle } from 'lucide-react';
import { useUser } from '../../firebase';
import type { UserProfile } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import { publishPost } from '../../hooks/use-realtime-feed';
import { useToast } from '../../hooks/use-toast';

// This page handles content shared TO NGA Hub from other apps
// It's registered as the share_target in manifest.json
export default function ShareTargetPage() {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const [status, setStatus] = React.useState<'processing' | 'done' | 'error'>('processing');
  const [sharedTitle, setSharedTitle] = React.useState('');
  const [sharedUrl, setSharedUrl] = React.useState('');
  const processed = React.useRef(false);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);

  React.useEffect(() => {
    if (user) supabase.from('app_users').select('*').eq('id', user.uid).single()
      .then(({ data }) => { if (data) setProfile(data as UserProfile); });
  }, [user?.uid]);

  React.useEffect(() => {
    if (processed.current) return;
    if (!user || !profile) return;
    processed.current = true;

    const handleShare = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const title = params.get('title') || 'Shared from another app';
        const text = params.get('text') || '';
        const url = params.get('url') || '';
        setSharedTitle(title || text || url);
        setSharedUrl(url);
        const mediaUrl = url || `https://picsum.photos/seed/${Date.now()}/800/600`;
        const caption = text || title || 'Shared via NGA Hub';

        await publishPost({
          userId: user.uid,
          userName: profile.displayName || user.displayName || 'User',
          userAvatar: profile.profilePicture || user.photoURL || '',
          type: 'video',
          mediaUrl,
          url: mediaUrl,
          caption,
          title: title || caption,
          ageGroup: profile.ageGroup || '14-17',
          likesCount: 0,
          commentsCount: 0,
          isFlagged: false,
          category: 'general',
        });

        setStatus('done');
        toast({ title: 'Posted to NGA Hub!', description: 'Your shared content is now live.' });
        setTimeout(() => router.push(`/feed/${profile.ageGroup || '14-17'}`), 2000);
      } catch (err: any) {
        setStatus('error');
        toast({ variant: 'destructive', title: 'Share failed', description: err.message });
      }
    };

    handleShare();
  }, [user, profile]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className={`h-20 w-20 rounded-full flex items-center justify-center ${
        status === 'processing' ? 'bg-primary/10' :
        status === 'done' ? 'bg-green-500/10' : 'bg-red-500/10'
      }`}>
        {status === 'processing' && <Loader2 className="h-10 w-10 text-primary animate-spin" />}
        {status === 'done' && <CheckCircle className="h-10 w-10 text-green-400" />}
        {status === 'error' && <Share2 className="h-10 w-10 text-red-400" />}
      </div>

      <div className="space-y-2">
        <h1 className="font-black text-2xl uppercase tracking-tight">
          {status === 'processing' ? 'Posting to NGA Hub...' :
           status === 'done' ? 'Posted!' : 'Share Failed'}
        </h1>
        {sharedTitle && (
          <p className="text-sm text-white/60 italic line-clamp-2">"{sharedTitle}"</p>
        )}
        {status === 'processing' && (
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Publishing to your feed</p>
        )}
        {status === 'done' && (
          <p className="text-xs text-green-400 font-bold uppercase tracking-widest">Redirecting to feed...</p>
        )}
        {status === 'error' && (
          <button onClick={() => router.push('/create-post')}
            className="text-xs text-primary font-black uppercase tracking-widest hover:opacity-80">
            Try manually →
          </button>
        )}
      </div>
    </div>
  );
}
