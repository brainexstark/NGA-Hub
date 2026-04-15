'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '../../../firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { 
    ShieldAlert, 
    Trash2, 
    CheckCircle2, 
    Loader2, 
    AlertTriangle,
    Zap,
    ExternalLink
} from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { cn } from '../../../lib/utils';
import type { FlaggedContent } from '../../../lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';

const ADMIN_UID = "s1EFDYsBy3SryAxicoIivG46M353";

// LOCAL HIGH-PERFORMANCE BADGE REPLACEMENT
const LocalBadge = ({ children, variant = 'default', className = '' }: { children: React.ReactNode, variant?: string, className?: string }) => {
  const variants: Record<string, string> = {
    default: 'bg-primary/10 text-primary border-primary/20',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
    outline: 'border-white/10 text-white/60',
    secondary: 'bg-white/5 text-white/40 border-white/5'
  };
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest transition-colors", variants[variant] || variants.default, className)}>
      {children}
    </div>
  );
};

export default function ModerationHubPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const isAdmin = user?.uid === ADMIN_UID;

  const flaggedQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'flagged_content'), orderBy('timestamp', 'desc'));
  }, [firestore]);

  const { data: flaggedItems, isLoading } = useCollection<FlaggedContent>(flaggedQuery);

  const handleBlockContent = async (item: FlaggedContent) => {
    if (!firestore || !isAdmin) return;
    try {
        const flaggedRef = doc(firestore, 'flagged_content', item.id);
        await updateDoc(flaggedRef, { status: 'blocked' });
        toast({ title: "Node Blocked", description: "Inappropriate content restricted across network." });
    } catch (e) {
        toast({ variant: 'destructive', title: "Enforcement Failed" });
    }
  };

  const handleClearContent = async (item: FlaggedContent) => {
    if (!firestore || !isAdmin) return;
    try {
        const flaggedRef = doc(firestore, 'flagged_content', item.id);
        await updateDoc(flaggedRef, { status: 'cleared' });
        toast({ title: "Node Cleared", description: "Content authorized for community display." });
    } catch (e) {
        toast({ variant: 'destructive', title: "Enforcement Failed" });
    }
  };

  if (!isAdmin) {
    return (
        <div className="flex h-[80vh] items-center justify-center p-8">
            <Card className="max-w-md text-center border-destructive/20 bg-destructive/5 rounded-[2.5rem] p-10 space-y-6">
                <ShieldAlert className="h-16 w-16 text-destructive mx-auto animate-pulse" />
                <h2 className="text-3xl font-black uppercase tracking-tighter text-destructive">Restricted Protocol</h2>
                <p className="font-medium italic opacity-60">This node is strictly reserved for STARK-B Administrative Intelligence.</p>
            </Card>
        </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 pb-32 animate-in fade-in duration-700 max-w-6xl pt-6">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest border border-primary/20">
            <ShieldAlert className="h-4 w-4" /> Administrative Moderation Hub
        </div>
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter dynamic-text-mesh">Content Backend Viewer</h1>
        <p className="text-muted-foreground text-lg font-medium italic max-w-3xl">
            Detect, analyze, and block inappropriate content synchronized from local hardware or external web nodes.
        </p>
      </header>

      {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
      ) : flaggedItems && flaggedItems.length > 0 ? (
          <div className="grid gap-6">
              {flaggedItems.map((item) => (
                  <Card key={item.id} className={cn(
                      "border-2 bg-card/40 backdrop-blur-xl rounded-3xl overflow-hidden transition-all group",
                      item.status === 'blocked' ? "border-destructive/20 opacity-60" : "border-white/5 hover:border-primary/20"
                  )}>
                      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-8 border-b border-white/5">
                          <div className="flex items-center gap-4">
                              <div className={cn(
                                  "p-4 rounded-2xl transition-transform group-hover:scale-110",
                                  item.severity === 'high' ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                              )}>
                                  <AlertTriangle className="h-6 w-6" />
                              </div>
                              <div>
                                  <div className="flex items-center gap-3">
                                      <CardTitle className="text-xl font-black uppercase tracking-tight text-white">Flagged {item.contentType}</CardTitle>
                                      <LocalBadge variant={item.status === 'blocked' ? 'destructive' : item.status === 'cleared' ? 'outline' : 'secondary'}>
                                          {item.status}
                                      </LocalBadge>
                                  </div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-1">Severity: {item.severity} • {item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleString() : 'Recent'}</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-3">
                              {item.status === 'pending' && (
                                  <>
                                      <Button variant="outline" size="sm" className="rounded-xl border-primary/20 text-primary hover:bg-primary/10" onClick={() => handleClearContent(item)}>
                                          <CheckCircle2 className="mr-2 h-4 w-4" /> Clear Node
                                      </Button>
                                      <Button variant="destructive" size="sm" className="rounded-xl shadow-lg shadow-destructive/20" onClick={() => handleBlockContent(item)}>
                                          <Trash2 className="mr-2 h-4 w-4" /> Block Transm.
                                      </Button>
                                  </>
                              )}
                          </div>
                      </CardHeader>
                      <CardContent className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="space-y-6">
                              <div className="space-y-2">
                                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-white">Reason for Flagging:</p>
                                  <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/10 font-bold text-sm italic text-destructive/80">
                                      "{item.reason}"
                                  </div>
                              </div>
                              <div className="space-y-2">
                                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-white">Content Preview:</p>
                                  <p className="text-lg font-medium italic text-foreground/80 leading-relaxed text-white/80">"{item.text}"</p>
                              </div>
                              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                                  <Avatar className="h-10 w-10 border border-white/10">
                                      <AvatarFallback className="text-white">{item.userName[0]}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                      <p className="text-xs font-black uppercase tracking-tight text-white">{item.userName}</p>
                                      <p className="text-[10px] opacity-40 uppercase font-bold tracking-widest text-white/60">Target UID: {item.userId.slice(0, 12)}...</p>
                                  </div>
                              </div>
                          </div>
                          <div className="relative aspect-video rounded-3xl overflow-hidden bg-black border-2 border-white/5 flex items-center justify-center">
                              {item.mediaUrl ? (
                                  <div className="w-full h-full relative">
                                      <iframe src={item.mediaUrl} className="w-full h-full border-none opacity-40 grayscale" />
                                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 backdrop-blur-sm">
                                          <ShieldAlert className="h-10 w-10 text-white" />
                                          <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Restricted Asset</p>
                                          <Button variant="ghost" size="sm" className="mt-4 text-white hover:bg-white/10" onClick={() => window.open(item.mediaUrl, '_blank')}>
                                              <ExternalLink className="mr-2 h-3 w-3" /> External Preview
                                          </Button>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="flex flex-col items-center gap-2 opacity-20">
                                      <Zap className="h-10 w-10 text-white" />
                                      <p className="text-[10px] font-black uppercase tracking-widest text-white">No Media Node</p>
                                  </div>
                              )}
                          </div>
                      </CardContent>
                  </Card>
              ))}
          </div>
      ) : (
          <div className="py-32 text-center border-2 border-dashed rounded-[3rem] border-white/5 bg-white/5 opacity-30 space-y-4">
              <Zap className="h-12 w-12 mx-auto animate-pulse text-white" />
              <p className="italic font-medium text-lg text-white">"The STARK-B network is currently stable. No inappropriate node detected."</p>
          </div>
      )}
    </div>
  );
}