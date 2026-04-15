
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Megaphone, Calendar, Zap, Loader2 } from 'lucide-react';
import { aiDatabase } from '../../../lib/ai-database';
import { cn } from '../../../lib/utils';

// LOCAL HIGH-PERFORMANCE BADGE REPLACEMENT
const LocalBadge = ({ children, variant = 'default', className = '' }: { children: React.ReactNode, variant?: string, className?: string }) => {
  const variants: Record<string, string> = {
    default: 'bg-primary/10 text-primary border-primary/20',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
    secondary: 'bg-white/5 text-white/40 border-white/5',
    outline: 'border-white/10 text-white/60'
  };
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest transition-colors", variants[variant] || variants.default, className)}>
      {children}
    </div>
  );
};

export default function AnnouncementsPage() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;

  const announcements = aiDatabase.educationalNodes.announcements;

  return (
    <div className="container mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest">
            <Megaphone className="h-4 w-4" /> Legacy Broadcaster
        </div>
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter dynamic-text-mesh">Network Announcements</h1>
        <p className="text-muted-foreground text-lg font-medium italic max-w-2xl">
            Stay synchronized with the latest platform-wide updates and high-performance mission alerts.
        </p>
      </header>

      <div className="grid gap-6">
        {announcements.map((ann) => (
          <Card key={ann.id} className="border-2 border-primary/10 bg-card/40 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden hover:border-primary/30 transition-all group">
            <div className={cn(
                "h-1 w-full animate-pulse",
                ann.priority === 'high' ? 'bg-destructive' : ann.priority === 'medium' ? 'bg-primary' : 'bg-muted'
            )} />
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-8">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <Zap className="h-6 w-6" />
                </div>
                <div>
                    <CardTitle className="text-2xl font-black uppercase tracking-tight">{ann.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1 font-bold">
                        <Calendar className="h-3 w-3" /> {ann.date}
                    </CardDescription>
                </div>
              </div>
              <LocalBadge variant={ann.priority === 'high' ? 'destructive' : 'secondary'} className="w-fit">
                {ann.priority} Priority
              </LocalBadge>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <p className="text-lg text-foreground/80 leading-relaxed font-medium italic">
                "{ann.content}"
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
