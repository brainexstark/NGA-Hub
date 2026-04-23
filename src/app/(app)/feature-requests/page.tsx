'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Lightbulb, Send, Zap, ThumbsUp, Loader2, CheckCircle, Clock, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface FeatureRequest {
  id: string;
  user_id: string;
  user_name: string;
  request_text: string;
  benefit: string;
  votes: number;
  status: 'pending' | 'reviewing' | 'planned' | 'done';
  created_at: string;
}

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Clock },
  reviewing: { label: 'Reviewing', color: 'text-blue-400',   bg: 'bg-blue-400/10',   icon: Eye },
  planned:   { label: 'Planned',   color: 'text-purple-400', bg: 'bg-purple-400/10', icon: Zap },
  done:      { label: 'Done',      color: 'text-green-400',  bg: 'bg-green-400/10',  icon: CheckCircle },
};

export default function FeatureRequestPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [requestText, setRequestText] = React.useState('');
  const [benefit, setBenefit] = React.useState('');
  const [requests, setRequests] = React.useState<FeatureRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [votedIds, setVotedIds] = React.useState<Set<string>>(new Set());

  const profileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: profile } = useDoc<UserProfile>(profileRef);

  // Load requests + realtime updates
  React.useEffect(() => {
    supabase.from('feature_requests').select('*')
      .order('votes', { ascending: false }).limit(50)
      .then(({ data }) => { if (data) setRequests(data); setLoading(false); });

    const channel = supabase.channel('feature-requests-all')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feature_requests' },
        (payload) => setRequests(prev => [payload.new as FeatureRequest, ...prev]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'feature_requests' },
        (payload) => setRequests(prev => prev.map(r => r.id === (payload.new as FeatureRequest).id ? payload.new as FeatureRequest : r)))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestText.trim()) return;
    if (!user) { toast({ variant: 'destructive', title: 'Sign in to submit' }); return; }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('feature_requests').insert({
        user_id: user.uid,
        user_name: profile?.displayName || user.displayName || 'User',
        user_avatar: profile?.profilePicture || user.photoURL || '',
        request_text: requestText.trim(),
        benefit: benefit.trim(),
        votes: 0,
        status: 'pending',
      });
      if (error) throw error;
      setRequestText('');
      setBenefit('');
      toast({ title: 'Request submitted!', description: 'The developer will review your idea.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Failed to submit', description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (req: FeatureRequest) => {
    if (votedIds.has(req.id)) return;
    setVotedIds(prev => new Set([...prev, req.id]));
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, votes: r.votes + 1 } : r));
    await supabase.from('feature_requests').update({ votes: req.votes + 1 }).eq('id', req.id);
  };

  return (
    <div className="container mx-auto space-y-8 pb-32 pt-6 animate-in fade-in duration-700 max-w-2xl">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20">
            <Lightbulb className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="font-headline text-3xl font-black uppercase tracking-tight">Feature Requests</h1>
            <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Tell the developer what you want</p>
          </div>
        </div>
      </header>

      {/* Submit form */}
      <Card className="border-2 border-primary/10 bg-card/40 backdrop-blur-xl rounded-[2rem] overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black uppercase tracking-widest">Suggest a Feature</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">What would you like added?</Label>
              <Textarea
                placeholder="e.g. Dark mode, video filters, group video calls..."
                rows={3}
                value={requestText}
                onChange={e => setRequestText(e.target.value)}
                className="bg-black/20 border-white/5 rounded-2xl font-medium resize-none"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Why would it help? (optional)</Label>
              <Input
                placeholder="It would help because..."
                value={benefit}
                onChange={e => setBenefit(e.target.value)}
                className="bg-black/20 border-white/5 rounded-2xl font-medium h-11"
              />
            </div>
            <Button type="submit" className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl" disabled={isSubmitting || !requestText.trim()}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit Request
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing requests */}
      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
          Community Requests · {requests.length} ideas
        </p>
        {loading ? (
          <div className="flex items-center justify-center py-10 opacity-30">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="py-10 text-center opacity-20">
            <Lightbulb className="h-10 w-10 mx-auto mb-3" />
            <p className="text-sm font-black uppercase">Be the first to suggest a feature</p>
          </div>
        ) : requests.map(req => {
          const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
          const StatusIcon = status.icon;
          const hasVoted = votedIds.has(req.id);
          return (
            <Card key={req.id} className="border border-white/5 bg-white/3 rounded-2xl overflow-hidden hover:border-white/10 transition-all">
              <CardContent className="p-4 flex gap-4">
                {/* Vote button */}
                <button onClick={() => handleVote(req)} disabled={hasVoted}
                  className={cn("flex flex-col items-center gap-1 shrink-0 p-2 rounded-xl transition-all min-w-[48px]",
                    hasVoted ? "bg-primary/20 text-primary" : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white")}>
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-[10px] font-black">{req.votes}</span>
                </button>
                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <p className="text-sm font-medium text-white/90 leading-snug">{req.request_text}</p>
                  {req.benefit && <p className="text-xs text-white/40 italic">{req.benefit}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[9px] font-black uppercase text-white/30">by {req.user_name}</span>
                    <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase", status.bg, status.color)}>
                      <StatusIcon className="h-2.5 w-2.5" />
                      {status.label}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
