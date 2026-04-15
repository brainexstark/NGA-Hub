'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { 
    ArrowRight, 
    Flame, 
    Bot, 
    Sparkles, 
    BrainCircuit, 
    PenSquare, 
    PlayCircle, 
    ExternalLink, 
    RefreshCw, 
    Zap,
    ShieldCheck,
    Cpu
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { getEmbedUrl, cn } from "@/lib/utils";

const tools = [
  {
    title: "AI Live Lesson Generator",
    description: "Generate an instant lesson plan for any topic, 'streamed' by our AI instructor. An internal tool for NGA Hub.",
    href: "/live-lesson",
    icon: Flame,
    isExternal: false,
  },
  {
    title: "STARK-B Intelligence Core",
    description: "The native high-performance AI processor for the legacy network. Full system synchronization active.",
    href: "/chat",
    icon: Cpu,
    isExternal: false,
  },
  {
    title: "Grok",
    description: "Explore the latest developments with a real-time understanding of the world. From xAI.",
    href: "https://grok.x.ai",
    icon: Bot,
    isExternal: true,
  },
  {
    title: "Gemini",
    description: "Google's most capable AI model. Supercharge your ideas with Gemini.",
    href: "https://gemini.google.com",
    icon: Sparkles,
    isExternal: true,
  },
  {
    title: "ChatGPT",
    description: "A conversational AI model from OpenAI that can generate human-like text.",
    href: "https://chatgpt.com/s/m_699d6c535fe88191aead3571c484868a",
    icon: BrainCircuit,
    isExternal: true,
  },
  {
    title: "Claude",
    description: "A next-generation AI assistant for your tasks, no matter the scale. From Anthropic.",
    href: "https://claude.ai",
    icon: PenSquare,
    isExternal: true,
  },
];

export default function AiToolsPage() {
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
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Attempting encrypted STARK-B link</p>
                        </div>
                        <div className="pt-6 max-w-xs border-t border-white/5">
                            <p className="text-[10px] text-white/60 italic leading-relaxed font-medium">
                                "Note: External intelligence nodes may restrict synchronization. Use 'Protocol Override' to initialize the native host."
                            </p>
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

  return (
    <div className="container mx-auto space-y-10 animate-in fade-in duration-700 pt-6">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
            <ShieldCheck className="h-3.5 w-3.5" /> High Performance AI Suite
        </div>
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter dynamic-text-mesh">AI Matrix</h1>
        <p className="text-muted-foreground text-xl font-medium italic max-w-3xl">
          Harness the power of generative AI. Access a suite of tools to create, learn, and innovate within the secure STARK-B environment.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
        {tools.map(tool => (
          <Card key={tool.title} className="flex flex-col glass-panel group transition-all duration-500 hover:-translate-y-2 hover:shadow-primary/30 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-start gap-5">
                 <div className="bg-primary/10 p-4 rounded-2xl group-hover:scale-110 transition-transform border border-primary/20">
                  <tool.icon className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl font-black uppercase tracking-tight">{tool.title}</CardTitle>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Node Verified</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow px-8 pb-8">
              <CardDescription className="font-medium italic leading-relaxed text-foreground/70">"{tool.description}"</CardDescription>
            </CardContent>
            <div className="p-8 pt-0">
             {tool.isExternal ? (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="w-full h-14 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl group-hover:bg-primary transition-all">
                            Initialize Node <PlayCircle className="ml-2 h-5 w-5" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[96vw] h-[96vh] p-0 overflow-hidden border-2 border-primary/20 bg-black rounded-[3rem] shadow-2xl flex flex-col">
                        <DialogTitle className="sr-only">{tool.title} Intelligence Node</DialogTitle>
                        <InternalViewer url={tool.href} name={tool.title} />
                    </DialogContent>
                </Dialog>
              ) : (
                <Link href={tool.href}>
                  <Button className="w-full h-14 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl group-hover:bg-primary transition-all">
                    Execute Internal Link <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
