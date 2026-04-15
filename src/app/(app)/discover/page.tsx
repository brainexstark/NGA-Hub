'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Globe, 
    Gamepad2, 
    Video, 
    Lightbulb, 
    PlayCircle, 
    ExternalLink, 
    RefreshCw, 
    Zap,
    ShieldCheck,
    FileText,
    FileSpreadsheet,
    Presentation,
    Mail,
    Cloud
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { getEmbedUrl } from "@/lib/utils";

const discoverLinks = [
  {
    category: 'Productivity Nodes',
    icon: FileText,
    sites: [
      { name: 'Word Online', description: 'Collaborative word processing and high-performance documentation.', url: 'https://www.office.com/launch/word' },
      { name: 'Excel Online', description: 'Data synchronization and analytical logic spreadsheets.', url: 'https://www.office.com/launch/excel' },
      { name: 'PowerPoint Online', description: 'Visual storytelling and mission briefing presentations.', url: 'https://www.office.com/launch/powerpoint' },
      { name: 'Outlook Online', description: 'Legacy communication and network schedule synchronization.', url: 'https://outlook.live.com' },
      { name: 'OneDrive', description: 'Personal cloud superdatabase for file localization.', url: 'https://onedrive.live.com' },
    ],
  },
  {
    category: 'For Everyone',
    icon: Globe,
    sites: [
      { name: 'YouTube Kids', description: 'Explore a world of learning and fun.', url: 'https://www.youtubekids.com' },
      { name: 'PBS Kids', description: 'Play games and watch videos with your favorite characters.', url: 'https://pbskids.org' },
      { name: 'Nat Geo Kids', description: 'Discover amazing facts about animals, science, and history.', url: 'https://kids.nationalgeographic.com' },
      { name: 'Duolingo ABC', description: 'A fun, hands-on way for your child to learn to read.', url: 'https://abc.duolingo.com/' },
    ],
  },
  {
    category: 'Learning & Creating',
    icon: Lightbulb,
    sites: [
      { name: 'Scratch', description: 'Create stories, games, and animations.', url: 'https://scratch.mit.edu' },
      { name: 'Code.org', description: 'Learn computer science. Anybody can learn.', url: 'https://code.org' },
      { name: 'Khan Academy', description: 'Free online courses, lessons & practice.', url: 'https://www.khanacademy.org' },
      { name: 'Canva', description: 'Design presentations, social media graphics, and more.', url: 'https://www.canva.com' },
    ],
  },
  {
    category: 'Gaming',
    icon: Gamepad2,
    sites: [
      { name: 'Google Games', description: 'Find thousands of games to play online via Google.', url: 'https://www.google.com/search?q=games' },
      { name: 'Roblox', description: 'A global platform that brings people together through play.', url: 'https://www.roblox.com' },
      { name: 'Steam', description: 'The ultimate destination for playing, discussing, and creating games.', url: 'https://store.steampowered.com' },
      { name: 'Coolmath Games', description: 'Fun logic and thinking games for all ages.', url: 'https://www.coolmathgames.com' },
    ],
  },
  {
    category: 'Video Conferencing',
    icon: Video,
    sites: [
      { name: 'Google Meet', description: 'Secure video meetings for everyone.', url: 'https://meet.google.com' },
      { name: 'Zoom', description: 'Video conferencing, web conferencing, webinars.', url: 'https://zoom.us' },
    ],
  },
];

export default function DiscoverPage() {
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
                                "Note: If the remote host denies synchronization due to security protocols, use 'Protocol Override' to initialize the external node."
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
    <div className="container mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
            <ShieldCheck className="h-3.5 w-3.5" /> High Performance Discovery
        </div>
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter dynamic-text-mesh">Discovery Node</h1>
        <p className="text-muted-foreground text-lg font-medium italic max-w-3xl">
          Access high-performance learning and entertainment platforms within the secure STARK-B environment. All nodes synchronized via secure bridge protocols.
        </p>
      </header>

      <div className="space-y-16 pb-32">
        {discoverLinks.map((category) => (
          <section key={category.category} className="space-y-8">
            <div className="flex items-center gap-4 px-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/20" />
                <h2 className="font-headline text-2xl font-black flex items-center gap-3 uppercase tracking-widest text-primary">
                    <category.icon className="h-6 w-6" />
                    {category.category}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/20" />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {category.sites.map((site) => (
                <Dialog key={site.name}>
                    <DialogTrigger asChild>
                        <Card className="flex flex-col glass-panel transition-all duration-500 hover:-translate-y-2 hover:shadow-primary/20 cursor-pointer group rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8">
                            <div className="flex items-start gap-5">
                                <div className="bg-primary/10 p-4 rounded-2xl group-hover:scale-110 transition-transform border border-white/5 bg-slate-900/50">
                                    {site.name.includes('Word') && <FileText className="h-7 w-7 text-blue-400" />}
                                    {site.name.includes('Excel') && <FileSpreadsheet className="h-7 w-7 text-green-400" />}
                                    {site.name.includes('PowerPoint') && <Presentation className="h-7 w-7 text-orange-400" />}
                                    {site.name.includes('Outlook') && <Mail className="h-7 w-7 text-blue-500" />}
                                    {site.name.includes('OneDrive') && <Cloud className="h-7 w-7 text-blue-300" />}
                                    {!['Word', 'Excel', 'PowerPoint', 'Outlook', 'OneDrive'].some(n => site.name.includes(n)) && <category.icon className="h-7 w-7 text-primary" />}
                                </div>
                                <div className="space-y-1">
                                    <CardTitle className="text-xl font-black uppercase tracking-tight">{site.name}</CardTitle>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Node Verified</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow px-8 pb-8">
                            <CardDescription className="font-medium italic leading-relaxed text-foreground/70">"{site.description}"</CardDescription>
                        </CardContent>
                        <div className="p-8 pt-0">
                            <Button className="w-full h-14 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl group-hover:bg-primary transition-all">
                                <PlayCircle className="mr-2 h-5 w-5" /> Launch Node
                            </Button>
                        </div>
                        </Card>
                    </DialogTrigger>
                    <DialogContent className="max-w-[96vw] h-[96vh] p-0 overflow-hidden border-2 border-primary/20 bg-black rounded-[3rem] shadow-2xl flex flex-col">
                        <DialogTitle className="sr-only">{site.name} Node</DialogTitle>
                        <InternalViewer url={site.url} name={site.name} />
                    </DialogContent>
                </Dialog>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
