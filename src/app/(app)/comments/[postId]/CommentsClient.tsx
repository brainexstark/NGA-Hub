'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '../../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { ArrowLeft, Send, Loader2, MoreVertical, Zap, Heart } from 'lucide-react';
import { useToast } from '../../../../hooks/use-toast';
import type { Post, UserProfile } from '../../../../lib/types';
import { useRealtimeComments } from '../../../../hooks/use-realtime';

export default function CommentsClient({ postId }: { postId: string }) {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [commentText, setCommentText] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [post, setPost] = React.useState<Partial<Post> | null>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Real-time comments from Supabase
  const { comments, loading, addComment } = useRealtimeComments(postId);

  // Load user profile
  React.useEffect(() => {
    if (user && firestore) {
      getDoc(doc(firestore, 'users', user.uid)).then(snap => {
        if (snap.exists()) setProfile(snap.data() as UserProfile);
      });
    }
  }, [user, firestore]);

  // Load post info from Firestore
  React.useEffect(() => {
    if (!postId || !firestore) return;
    getDoc(doc(firestore, 'posts', postId)).then(snap => {
      if (snap.exists()) setPost(snap.data() as Post);
    }).catch(() => {});
  }, [postId, firestore]);

  // Auto-scroll to bottom on new comments
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [comments]);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    setIsSubmitting(true);
    const { error } = await addComment(
      user.uid,
      profile?.displayName || user.displayName || 'User',
      profile?.profilePicture || user.photoURL || '',
      commentText.trim()
    );
    if (error) toast({ variant: 'destructive', title: 'Failed to send' });
    else setCommentText('');
    setIsSubmitting(false);
  };

  if (loading) {
    return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-full bg-background max-w-md mx-auto w-full border-x border-white/5 animate-in fade-in duration-500">
      <header className="px-6 pt-12 pb-6 bg-gradient-to-b from-primary/20 via-background to-background relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary animate-pulse" />
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="h-10 w-10 rounded-full border border-white/20 flex items-center justify-center bg-white/5 hover:bg-white/10">
              <ArrowLeft className="h-5 w-5 opacity-60" />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight font-headline">Comments</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-green-400">● Live</p>
            </div>
          </div>
          <MoreVertical className="h-5 w-5 opacity-30" />
        </div>
        {post && (
          <div className="bg-white/5 rounded-3xl p-4 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="h-7 w-7 border border-white/10">
                <AvatarImage src={(post as any).userAvatar} />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">{(post as any).userName}</span>
            </div>
            <p className="text-xs font-medium italic opacity-70">"{post.caption || post.title}"</p>
          </div>
        )}
      </header>

      <main className="flex-1 px-6 overflow-y-auto no-scrollbar pt-4" ref={scrollRef}>
        <div className="space-y-5 pb-20">
          {comments.length > 0 ? comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 animate-in slide-in-from-bottom-2">
              <Avatar className="h-10 w-10 shrink-0 border border-white/10">
                <AvatarImage src={comment.user_avatar} />
                <AvatarFallback>{comment.user_name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{comment.user_name}</span>
                  <span className="text-[8px] font-bold opacity-20 uppercase">
                    {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-none border border-white/5">
                  <p className="text-sm font-medium leading-relaxed text-white/80">{comment.text}</p>
                </div>
              </div>
            </div>
          )) : (
            <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
              <Zap className="h-12 w-12 text-primary animate-pulse" />
              <p className="font-headline text-lg font-black uppercase tracking-tighter">Be the first to comment</p>
            </div>
          )}
        </div>
      </main>

      <footer className="p-5 border-t border-white/5">
        <form onSubmit={handleSendComment} className="flex items-center gap-3 bg-white/5 rounded-[2rem] p-2 border border-white/5 focus-within:border-primary/40 transition-all">
          <Avatar className="h-8 w-8 shrink-0 ml-1">
            <AvatarImage src={profile?.profilePicture || user?.photoURL || ''} />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <Input
            placeholder="Write a comment..."
            className="border-none bg-transparent focus-visible:ring-0 shadow-none h-10 placeholder:opacity-30 font-medium text-white"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            disabled={isSubmitting}
          />
          <Button type="submit" disabled={!commentText.trim() || isSubmitting} className="rounded-2xl h-10 w-10 p-0 bg-primary shrink-0">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </footer>
    </div>
  );
}
