'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '../../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { 
    ArrowLeft, 
    Send, 
    Loader2, 
    MoreVertical,
    Zap,
    Heart
} from 'lucide-react';
import { useToast } from '../../../../hooks/use-toast';
import type { Post, UserProfile } from '../../../../lib/types';
import { aiDatabase } from '../../../../lib/ai-database';

export default function CommentsClient({ postId }: { postId: string }) {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [post, setPost] = useState<Partial<Post> | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && firestore) {
        getDoc(doc(firestore, 'users', user.uid)).then(snap => {
            if (snap.exists()) setProfile(snap.data() as UserProfile);
        });
    }
  }, [user, firestore]);

  useEffect(() => {
    if (postId && firestore) {
        const mockPost = [...aiDatabase.reels['under-10'], ...aiDatabase.reels['10-16'], ...aiDatabase.reels['16-plus'], ...aiDatabase.superdatabasePosts['under-10'], ...aiDatabase.superdatabasePosts['10-16'], ...aiDatabase.superdatabasePosts['16-plus']].find(r => r.id === postId);
        const mockComments = (aiDatabase as any).mockComments?.[postId] || [];

        if (mockPost) {
            setPost({
                id: mockPost.id,
                userName: mockPost.userName || 'STARK-B Legacy Node',
                caption: mockPost.caption || (mockPost as any).description,
                userAvatar: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679'
            });
            setComments(mockComments.map((c: any) => ({
                id: c.id,
                userName: c.userName,
                userAvatar: `https://picsum.photos/seed/${c.userName}/100/100`,
                text: c.text,
                createdAt: new Date()
            })));
            setLoading(false);
        } else {
            getDoc(doc(firestore, 'posts', postId)).then(snap => {
                if (snap.exists()) setPost(snap.data() as Post);
                setLoading(false);
            }).catch(() => setLoading(false));
        }
    }
  }, [postId, firestore]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    const newComment = {
        id: Date.now().toString(),
        userName: profile?.displayName || user?.displayName || 'Authorized User',
        userAvatar: profile?.profilePicture || user?.photoURL || '',
        text: commentText,
        createdAt: new Date()
    };

    setComments(prev => [...prev, newComment]);
    setCommentText('');
    setIsSubmitting(false);
    toast({ title: "Sync Successful" });
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
                    <button onClick={() => router.back()} className="h-10 w-10 rounded-full border border-white/20 flex items-center justify-center bg-white/5 cursor-pointer hover:bg-white/10">
                        <ArrowLeft className="h-5 w-5 opacity-60" />
                    </button>
                    <h1 className="text-2xl font-black tracking-tight text-foreground font-headline">Transmissions</h1>
                </div>
                <MoreVertical className="h-5 w-5 opacity-30" />
            </div>

            <div className="bg-white/5 rounded-3xl p-5 border border-white/5 shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-8 w-8 border border-white/10">
                        <AvatarImage src={post?.userAvatar} />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">{post?.userName}</span>
                </div>
                <p className="text-sm font-medium italic opacity-80 leading-relaxed text-white/80">"{post?.caption || 'Node metadata localized.'}"</p>
            </div>
        </header>

        <main className="flex-1 px-6 overflow-y-auto no-scrollbar pt-4" ref={scrollRef}>
            <div className="space-y-6 pb-20">
                {comments.length > 0 ? comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4 animate-in slide-in-from-bottom-2">
                        <Avatar className="h-12 w-12 shrink-0 border border-white/5">
                            <AvatarImage src={comment.userAvatar} />
                            <AvatarFallback>{comment.userName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{comment.userName}</span>
                                <span className="text-[8px] font-bold opacity-20 uppercase tracking-widest">{comment.time || 'Just Now'}</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5 shadow-lg">
                                <p className="text-sm font-medium leading-relaxed text-white/80">{comment.text}</p>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
                        <Zap className="h-12 w-12 text-primary animate-pulse" />
                        <p className="font-headline text-lg font-black uppercase tracking-tighter text-white">Awaiting node transmissions</p>
                    </div>
                )}
            </div>
        </main>

        <footer className="p-6 bg-muted/5 border-t border-white/5">
            <form onSubmit={handleSendComment} className="flex items-center gap-3 bg-white/5 rounded-[2rem] p-2 border border-white/5 focus-within:border-primary/40 transition-all">
                <div className="h-10 w-10 flex items-center justify-center opacity-30 text-white"><Heart className="h-5 w-5" /></div>
                <Input 
                    placeholder="Add a node..." 
                    className="border-none bg-transparent focus-visible:ring-0 shadow-none h-10 placeholder:opacity-30 font-medium text-white"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    disabled={isSubmitting}
                />
                <Button 
                    type="submit"
                    disabled={!commentText.trim() || isSubmitting}
                    className="rounded-2xl h-10 w-10 p-0 bg-primary"
                >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </form>
        </footer>
    </div>
  );
}
