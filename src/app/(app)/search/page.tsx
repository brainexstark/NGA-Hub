
'use client';

import * as React from 'react';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { 
    Search, 
    Zap, 
    Cpu, 
    Code, 
    Globe, 
    Sparkles, 
    ArrowRight, 
    Loader2, 
    ExternalLink, 
    RefreshCw, 
    ShieldCheck,
    PlayCircle
} from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "../../../components/ui/dialog";
import { getEmbedUrl } from "../../../lib/utils";
import { useUser, useFirestore, updateDocumentNonBlocking } from '../../../firebase';
import { doc, arrayUnion } from 'firebase/firestore';

export default function SearchPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [query, setQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [activeUrl, setActiveUrl] = React.useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // Algorithmic History Sync
    if (user && firestore) {
        const userRef = doc(firestore, 'users', user.uid);
        updateDocumentNonBlocking(userRef, { searchHistory: arrayUnion(query.trim()) });
    }

    setIsSearching(true);
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&igu=1`;
    
    setTimeout(() => {
        setIsSearching(false);
        setActiveUrl(searchUrl);
    }, 800);
  };

  const categories = [
    { label: 'Intelligence', icon: Cpu, color: 'text-accent' },
    { label: 'Legacy Data', icon: Zap, color: 'text-primary' },
    { label: 'Global Feed', icon: Globe, color: 'text-green-500' },
    { label: 'Algorithms', icon: Code, color: 'text-purple-500' },
  ];

  const InternalViewer = ({ url }: { url: string }) => {
      const [isLoading, setIsLoading] = React.useState(true);

      return (
        <div className="w-full h-full flex flex-col bg-black">
            <div className="bg-slate-900 p-3 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Google Free Mode: {query}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-3 text-[9px] font-black uppercase text-white/40 hover:text-white hover:bg-white/5"
                        onClick={() => window.open(url, '_blank')}
                    >
                        <ExternalLink className="mr-1.5 h-3 w-3" /> Protocol Override
                    </Button>
                </div>
            </div>
            <div className="flex-1 relative overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950 text-center p-8 space-y-6">
                        <div className="relative">
                            <RefreshCw className="h-12 w-12 animate-spin text-primary opacity-20" />
                            <Zap className="absolute inset-0 m-auto h-5 w-5 text-primary animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <p className="font-headline text-2xl font-bold uppercase tracking-tight text-white">Synchronizing Node...</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Initializing Internal Handshake</p>
                        </div>
                        <div className="pt-6 max-w-xs border-t border-white/5">
                            <p className="text-[10px] text-white/60 italic leading-relaxed font-medium">
                                "Note: External intelligence nodes may restrict synchronization. Use 'Protocol Override' to initialize the native host."
                            </p>
                        </div>
                    </div>
                )}
                <iframe 
                    src={url} 
                    className="w-full h-full border-none bg-white" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => setIsLoading(false)}
                />
            </div>
        </div>
      );
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
      <div className="w-full max-w-2xl space-y-12 text-center">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-[2.5rem] bg-primary/10 shadow-2xl shadow-primary/20 border border-primary/20 animate-pulse">
              <Globe className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="font-headline text-5xl font-black uppercase tracking-tighter dynamic-text-mesh">
            Intelligence Node
          </h1>
          <p className="text-muted-foreground font-medium italic">Execute Google Free Mode: Browse the matrix internally.</p>
        </div>

        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-0 group-focus-within:opacity-40 transition-opacity duration-500" />
          <div className="relative flex items-center bg-card/40 backdrop-blur-2xl border-2 border-white/5 rounded-[2rem] p-2 focus-within:border-primary/50 transition-all shadow-2xl">
            <Search className="ml-4 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Initialize Google Free Mode query..."
              className="flex-1 bg-transparent border-none focus-visible:ring-0 text-lg h-14 font-medium placeholder:italic placeholder:opacity-30"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button 
              type="submit" 
              className="rounded-full h-12 px-8 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20"
              disabled={isSearching}
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Execute Query"}
            </Button>
          </div>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <button 
                key={cat.label} 
                onClick={() => { setQuery(cat.label); }}
                className={`flex flex-col items-center gap-3 p-4 rounded-3xl bg-white/5 border border-white/5 hover:border-primary/20 hover:bg-primary/5 transition-all group`}
            >
              <div className={`p-3 rounded-2xl bg-black/20 group-hover:scale-110 transition-transform ${cat.color}`}>
                <cat.icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="pt-8 border-t border-white/5 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Intelligence Commands</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['/analyze_core', '/sync_legacy', '/node_status', '/fetch_lesson'].map(cmd => (
              <span 
                key={cmd} 
                onClick={() => setQuery(cmd.replace('/', ''))}
                className="px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-[10px] cursor-pointer hover:bg-accent hover:text-accent-foreground transition-all"
              >
                {cmd}
              </span>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={!!activeUrl} onOpenChange={(open) => !open && setActiveUrl(null)}>
          <DialogContent className="max-w-[96vw] h-[96vh] p-0 overflow-hidden border-2 border-primary/20 bg-black rounded-[3rem] shadow-2xl flex flex-col">
              <DialogTitle className="sr-only">Free Mode Internal Viewer</DialogTitle>
              {activeUrl && <InternalViewer url={activeUrl} />}
          </DialogContent>
      </Dialog>
    </div>
  );
}
