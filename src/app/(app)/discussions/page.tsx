'use client';
import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageSquareText, Search, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export default function DiscussionsPage() {
  const [mounted, setMounted] = React.useState(false);
  const [discussions, setDiscussions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [newTitle, setNewTitle] = React.useState('');
  const { user } = useUser();
  const { toast } = useToast();

  React.useEffect(() => { setMounted(true); }, []);

  React.useEffect(() => {
    supabase.from('feature_requests').select('*').order('votes', { ascending: false }).limit(30)
      .then(({ data }) => { if (data) setDiscussions(data); setLoading(false); });
    const ch = supabase.channel('discussions-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feature_requests' },
        (p) => setDiscussions(prev => [p.new, ...prev]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  if (!mounted) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;

  return (
    <div className="container mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="space-y-2">
        <h1 className="font-headline text-4xl font-black uppercase tracking-tighter dynamic-text-mesh">Discussions</h1>
        <p className="text-muted-foreground italic">Community threads and ideas</p>
      </header>
      <div className="flex gap-3">
        <Input placeholder="Start a discussion..." value={newTitle} onChange={e => setNewTitle(e.target.value)}
          className="bg-black/20 border-white/10 rounded-2xl h-12" />
        <Button onClick={async () => {
          if (!newTitle.trim() || !user) return;
          await supabase.from('feature_requests').insert({ user_id: user.uid, user_name: user.displayName || 'User', request_text: newTitle, benefit: '' });
          setNewTitle('');
          toast({ title: 'Discussion started!' });
        }} className="h-12 px-6 rounded-2xl font-black uppercase text-xs shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Post
        </Button>
      </div>
      {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div> :
        discussions.length === 0 ? (
          <div className="py-20 text-center opacity-30 space-y-3">
            <MessageSquareText className="h-12 w-12 mx-auto" />
            <p className="font-black uppercase text-sm">No discussions yet — start one!</p>
          </div>
        ) : discussions.map(d => (
          <Card key={d.id} className="border border-white/5 bg-white/3 rounded-2xl">
            <CardContent className="p-4">
              <p className="font-medium text-sm">{d.request_text}</p>
              <p className="text-[10px] text-white/30 mt-1 font-black uppercase">by {d.user_name} · {d.votes} votes</p>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
