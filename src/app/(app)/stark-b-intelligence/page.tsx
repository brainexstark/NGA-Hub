'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '../../../components/ui/button';
import { ArrowRight, Sparkles, Star, Zap, Users2, Shield, Cpu, PlayCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { ContentCard } from '../../../components/content-card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "../../../components/ui/dialog";

function getEmbedUrl(url: string) {
    if (!url) return url;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        const watchMatch = url.match(/[?&]v=([^&]+)/);
        if (watchMatch) videoId = watchMatch[1];
        else {
            const shortMatch = url.match(/youtu\.be\/([^?]+)/);
            if (shortMatch) videoId = shortMatch[1];
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1` : url;
    }
    return url;
}

export default function STARKBIntelligencePage() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const InternalViewer = ({ url, name }: { url: string, name: string }) => {
      const [isLoading, setIsLoading] = React.useState(true);
      const embedUrl = getEmbedUrl(url);

      return (
        <div className="w-full h-full flex flex-col bg-black">
            <div className="bg-slate-900 p-3 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Secure Intelligence Link: {name}</span>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-3 text-[9px] font-black uppercase text-white/40 hover:text-white"
                    onClick={() => window.open(url, '_blank')}
                >
                    <ExternalLink className="mr-1.5 h-3 w-3" /> Override
                </Button>
            </div>
            <div className="flex-1 relative overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950 text-center p-8 space-y-6">
                        <RefreshCw className="h-12 w-12 animate-spin text-primary" />
                        <div className="space-y-2">
                            <p className="font-headline text-2xl font-bold uppercase tracking-tight text-white">Synchronizing Node...</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Attempting encrypted STARK-B link</p>
                        </div>
                    </div>
                )}
                <iframe 
                    src={embedUrl} 
                    className="w-full h-full border-none bg-white" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => setIsLoading(false)}
                />
            </div>
        </div>
      );
  };

  if (!mounted) {
    return (
      <div className="container mx-auto p-8 space-y-8">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  const towerImage = null;
  const specialAsset = { imageUrl: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1920&q=80' };

  return (
    <div className="container mx-auto space-y-12 pb-20 max-w-6xl animate-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest">
            <Sparkles className="h-4 w-4" /> Specialized Knowledge Resource
        </div>
        <h1 className="font-headline text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          STARK-B Intelligence Hub
        </h1>
        <p className="text-muted-foreground text-xl max-w-3xl leading-relaxed font-medium">
          The ultimate specialized repository for the Great STARK-B legacy. Access curated AI insights and community resources designed for high-performance impact.
        </p>
      </header>

      {specialAsset && (
        <section className="rounded-3xl border-2 border-primary/20 overflow-hidden relative group shadow-2xl h-[400px]">
            <Image 
                src={specialAsset.imageUrl} 
                alt="Intelligence Core" 
                fill 
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                unoptimized
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent flex flex-col justify-center p-8 sm:p-12 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 backdrop-blur-md text-primary text-xs font-bold uppercase tracking-widest w-fit">
                    <Cpu className="h-3 w-3" /> Core System Online
                </div>
                <h2 className="font-headline text-4xl sm:text-5xl font-bold text-white tracking-tight">Intelligence Core</h2>
                <p className="text-lg text-white/80 max-w-lg leading-relaxed font-medium">
                    The STARK-B Special Asset has been successfully synchronized. Accessing localized AI logic and high-performance legacy datasets.
                </p>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button size="lg" className="h-14 px-8 text-lg font-bold font-headline rounded-full shadow-lg hover:shadow-primary/20 transition-all w-fit">
                            Enter Core Knowledge <ArrowRight className="ml-2 h-6 w-6" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[96vw] h-[96vh] p-0 overflow-hidden border-2 border-primary/20 bg-black rounded-[3rem] shadow-2xl flex flex-col">
                        <DialogTitle className="sr-only">STARK-B Intelligence Core</DialogTitle>
                        <InternalViewer url="https://chatgpt.com/s/m_699d6c535fe88191aead3571c484868a" name="STARK-B Intelligence Core" />
                    </DialogContent>
                </Dialog>
            </div>
        </section>
      )}

      <section className="rounded-3xl bg-primary/5 border-2 border-primary/10 shadow-2xl relative overflow-hidden group">
        <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-8 sm:p-12 space-y-6 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest w-fit">
                    <Shield className="h-3 w-3" /> Secure Access
                </div>
                <h2 className="font-headline text-4xl font-bold tracking-tight">Intelligence Portal</h2>
                <p className="text-xl text-muted-foreground leading-relaxed font-medium">
                    Enter our specialized knowledge base powered by custom STARK-B legacy datasets.
                </p>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold font-headline rounded-full shadow-lg hover:shadow-primary/20 transition-all w-fit">
                            Launch Hub Node <PlayCircle className="ml-2 h-6 w-6" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[96vw] h-[96vh] p-0 overflow-hidden border-2 border-primary/20 bg-black rounded-[3rem] shadow-2xl flex flex-col">
                        <DialogTitle className="sr-only">Intelligence Portal Node</DialogTitle>
                        <InternalViewer url="https://chatgpt.com/s/m_699d6c535fe88191aead3571c484868a" name="Intelligence Hub" />
                    </DialogContent>
                </Dialog>
            </div>
            <div className="relative h-[300px] lg:h-auto min-h-[400px]">
                {towerImage && (
                    <Image 
                        src={towerImage.imageUrl} 
                        alt="BRAINEXSTARK Tower" 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent pointer-events-none" />
            </div>
        </div>
      </section>
      
      <section className="rounded-xl bg-primary/5 p-8 border border-primary/10">
          <div className="flex items-center gap-3 mb-4">
              <Star className="h-6 w-6 text-primary fill-primary" />
              <h2 className="font-headline text-3xl font-bold">Intelligence Hub</h2>
          </div>
          <p className="text-white/40 italic text-sm">Connect with the community to explore shared knowledge and resources.</p>
      </section>
    </div>
  );
}
