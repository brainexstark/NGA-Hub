'use client';
import * as React from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Megaphone, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export default function AnnouncementsPage() {
  const [mounted, setMounted] = React.useState(false);
  const [announcements, setAnnouncements] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => { setMounted(true); }, []);

  React.useEffect(() => {
    // Use notifications table for system announcements
    supabase.from('notifications').select('*').eq('type', 'system')
      .order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setAnnouncements(data); setLoading(false); });
  }, []);

  if (!mounted) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;

  return (
    <div className="container mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="space-y-2">
        <h1 className="font-headline text-4xl font-black uppercase tracking-tighter dynamic-text-mesh">Announcements</h1>
        <p className="text-muted-foreground italic">Platform updates and community news</p>
      </header>
      {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div> :
        announcements.length === 0 ? (
          <div className="py-20 text-center opacity-30 space-y-3">
            <Megaphone className="h-12 w-12 mx-auto" />
            <p className="font-black uppercase text-sm">No announcements yet</p>
          </div>
        ) : announcements.map(a => (
          <Card key={a.id} className="border border-white/5 bg-white/3 rounded-2xl">
            <CardContent className="p-5">
              <p className="font-medium text-sm">{a.message}</p>
              <p className="text-[10px] text-white/30 mt-1 font-black uppercase">
                {new Date(a.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
