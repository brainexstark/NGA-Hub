'use client';

import * as React from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/ui/avatar";
import { Card } from "../../../../components/ui/card";
import { Progress } from "../../../../components/ui/progress";
import { PlaceHolderImages } from "../../../../lib/placeholder-images";
import { ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "../../../../components/ui/dialog";
import { useToast } from "../../../../hooks/use-toast";
import { aiDatabase } from '../../../../lib/ai-database';
import { getEmbedUrl } from '../../../../lib/utils';

const InternalPlayer = ({ url }: { url: string }) => {
    const embedUrl = getEmbedUrl(url);
    return <iframe src={embedUrl} className="w-full h-full border-none" allowFullScreen />;
};

export default function StoriesClient({ ageGroup }: { ageGroup: string }) {
  const { toast } = useToast();
  const [activeIndex, setActiveIndex] = React.useState(0);

  const stories = React.useMemo(() => {
    return aiDatabase.stories[ageGroup as keyof typeof aiDatabase.stories] || aiDatabase.stories['10-16'];
  }, [ageGroup]);

  const activeStory = stories[activeIndex];
  const storyAuthor = PlaceHolderImages.find(img => img.id === 'user-avatar-2');

  const nextStory = () => setActiveIndex((prev) => (prev + 1) % stories.length);
  const prevStory = () => setActiveIndex((prev) => (prev - 1 + stories.length) % stories.length);

  const handleWatchStory = () => {
      window.dispatchEvent(new CustomEvent('stark-b-entertainment-engaged'));
  };

  if (stories.length === 0) {
    return <div className="flex h-full items-center justify-center py-20 opacity-40">Initializing node...</div>;
  }

  return (
    <div className="container mx-auto h-full p-4 flex flex-col items-center animate-in fade-in duration-700">
       <div className="w-full max-w-4xl space-y-6">
            <div className="flex gap-4 p-4 bg-card/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-x-auto no-scrollbar scroll-smooth">
                {stories.map((story, index) => (
                    <button 
                        key={story.id} 
                        onClick={() => { setActiveIndex(index); handleWatchStory(); }}
                        className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0 group transition-all"
                    >
                        <div className={`p-1 rounded-full transition-all duration-300 ${index === activeIndex ? 'bg-gradient-to-tr from-primary to-accent scale-110 shadow-lg' : 'bg-muted/20'}`}>
                            <Avatar className="h-16 w-16 border-2 border-background">
                                <AvatarImage src={story.imageUrl} className="object-cover" />
                                <AvatarFallback>S</AvatarFallback>
                            </Avatar>
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${index === activeIndex ? 'text-primary' : 'text-white/40'}`}>
                            Node {index + 1}
                        </p>
                    </button>
                ))}
            </div>
            
            <div className="relative group">
                <Dialog>
                    <DialogTrigger asChild>
                        <div className="cursor-pointer block relative" onClick={handleWatchStory}>
                            <Card className="w-full aspect-[9/16] max-h-[75vh] relative overflow-hidden rounded-[3rem] border-4 border-primary/10 shadow-2xl">
                                {activeStory && (
                                    <Image
                                        src={activeStory.imageUrl}
                                        alt={activeStory.title}
                                        fill
                                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>

                                <div className="absolute top-0 left-0 right-0 p-8 z-10">
                                    <div className="flex gap-1 mb-6">
                                        {stories.map((_, idx) => (
                                            <Progress 
                                                key={idx} 
                                                value={idx === activeIndex ? 100 : (idx < activeIndex ? 100 : 0)} 
                                                className="h-1 flex-1 bg-white/10" 
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-12 w-12 ring-2 ring-white/50 border-2 border-background">
                                                <AvatarImage src={storyAuthor?.imageUrl} />
                                            </Avatar>
                                            <div>
                                                <p className="text-white font-black text-lg uppercase tracking-tighter">STARK-B LEGACY</p>
                                                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-0.5">Sourced from Archive</p>
                                            </div>
                                        </div>
                                        <div className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse shadow-lg uppercase tracking-widest">Live Node</div>
                                    </div>
                                </div>

                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="rounded-full bg-white/10 p-6 backdrop-blur-xl border-2 border-white/20">
                                        <PlayCircle className="h-16 w-16 text-white" />
                                    </div>
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 p-10 z-10 text-center">
                                    <h3 className="text-white font-black text-2xl mb-3 uppercase tracking-tight">{activeStory?.title}</h3>
                                    <Button className="mt-8 rounded-full px-10 h-14 font-black uppercase tracking-widest shadow-2xl shadow-primary/20 bg-primary text-white border-none">
                                        View Full Feature
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-[96vw] h-[96vh] p-0 overflow-hidden border-2 border-primary/20 bg-black rounded-[3rem] shadow-2xl flex flex-col items-center justify-center">
                        <DialogTitle className="sr-only">Story Player</DialogTitle>
                        <div className="w-full h-full relative aspect-video">
                            <InternalPlayer url={activeStory.url || activeStory.imageUrl} />
                        </div>
                    </DialogContent>
                </Dialog>

                <Button 
                    variant="secondary" 
                    size="icon" 
                    className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all z-20 h-12 w-12 bg-white/10 text-white hover:bg-white/20"
                    onClick={(e) => { e.preventDefault(); prevStory(); }}
                >
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button 
                    variant="secondary" 
                    size="icon" 
                    className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all z-20 h-12 w-12 bg-white/10 text-white hover:bg-white/20"
                    onClick={(e) => { e.preventDefault(); nextStory(); }}
                >
                    <ChevronRight className="h-6 w-6" />
                </Button>
            </div>
       </div>
    </div>
  );
}
