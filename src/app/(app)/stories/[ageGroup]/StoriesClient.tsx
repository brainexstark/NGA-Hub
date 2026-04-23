'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/ui/avatar";
import { Progress } from "../../../../components/ui/progress";
import { ChevronLeft, ChevronRight, PlayCircle, Loader2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "../../../../components/ui/dialog";
import { getEmbedUrl } from '../../../../lib/utils';
import { supabase } from '../../../../lib/supabase';

function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.includes('youtube') || lower.includes('youtu.be') ||
    lower.includes('tiktok') || lower.endsWith('.mp4') ||
    lower.endsWith('.webm') || lower.endsWith('.mov') || lower.startsWith('data:video');
}

function StoryPlayer({ url }: { url: string }) {
  if (isVideoUrl(url)) {
    const isExternal = url.includes('youtube') || url.includes('youtu.be') || url.includes('tiktok');
    if (isExternal) {
      return <iframe src={getEmbedUrl(url)} className="w-full h-full border-none" allowFullScreen />;
    }
    return <video src={url} className="w-full h-full object-cover" autoPlay muted loop playsInline />;
  }
  // Static image
  return <img src={url} alt="story" className="w-full h-full object-cover" />;
}

export default function StoriesClient({ ageGroup }: { ageGroup: string }) {
  const [stories, setStories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    supabase.from('stories').select('*')
      .eq('age_group', ageGroup)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => { if (data) setStories(data); setLoading(false); });

    const channel = supabase.channel(`stories-page-${ageGroup}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stories', filter: `age_group=eq.${ageGroup}` },
        (payload) => setStories(prev => [payload.new, ...prev]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ageGroup]);

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (stories.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 opacity-30">
        <PlayCircle className="h-12 w-12" />
        <p className="font-black text-sm uppercase tracking-widest">No stories yet</p>
        <p className="text-xs opacity-60">Be the first to post a story</p>
      </div>
    );
  }

  const active = stories[activeIndex];

  return (
    <div className="container mx-auto max-w-lg p-4 space-y-4 animate-in fade-in duration-700">
      {/* Story thumbnails row */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {stories.map((story, i) => (
          <button key={story.id} onClick={() => { setActiveIndex(i); setOpen(true); window.dispatchEvent(new CustomEvent('stark-b-entertainment-engaged')); }}
            className="flex flex-col items-center gap-1.5 shrink-0">
            <div className={`p-0.5 rounded-full ${i === activeIndex ? 'bg-gradient-to-tr from-primary to-accent' : 'bg-white/20'}`}>
              <Avatar className="h-14 w-14 border-2 border-background">
                <AvatarImage src={story.user_avatar || story.media_url} className="object-cover" />
                <AvatarFallback className="bg-primary/20 text-primary font-black">
                  {story.user_name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-white/60 truncate max-w-[56px]">
              @{story.user_name?.replace(/\s/g,'_').toLowerCase() || 'user'}
            </span>
          </button>
        ))}
      </div>

      {/* Active story card */}
      <div className="relative group cursor-pointer" onClick={() => setOpen(true)}>
        <div className="w-full aspect-[9/16] max-h-[75vh] rounded-[2.5rem] overflow-hidden border-2 border-primary/20 shadow-2xl bg-black relative">
          {isVideoUrl(active.media_url) ? (
            <video src={active.media_url} className="w-full h-full object-cover" muted playsInline />
          ) : (
            <img src={active.media_url} alt="story" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />

          {/* Progress bars */}
          <div className="absolute top-4 left-4 right-4 flex gap-1">
            {stories.map((_, idx) => (
              <Progress key={idx} value={idx <= activeIndex ? 100 : 0} className="h-0.5 flex-1 bg-white/20" />
            ))}
          </div>

          {/* Author */}
          <div className="absolute top-8 left-4 right-4 flex items-center gap-3">
            <Avatar className="h-9 w-9 border-2 border-white/30">
              <AvatarImage src={active.user_avatar} />
              <AvatarFallback>{active.user_name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-black text-sm uppercase tracking-tight">@{active.user_name?.replace(/\s/g,'_').toLowerCase()}</p>
              <p className="text-white/40 text-[9px] uppercase font-bold">
                {new Date(active.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Caption */}
          {active.caption && (
            <div className="absolute bottom-8 left-4 right-4 text-center">
              <p className="text-white font-medium text-sm italic">"{active.caption}"</p>
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white/10 backdrop-blur-md rounded-full p-5 border border-white/20">
              <PlayCircle className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>

        {/* Nav buttons */}
        {activeIndex > 0 && (
          <Button variant="secondary" size="icon" onClick={(e) => { e.stopPropagation(); setActiveIndex(p => p - 1); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 bg-black/40 text-white border-none z-10">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        {activeIndex < stories.length - 1 && (
          <Button variant="secondary" size="icon" onClick={(e) => { e.stopPropagation(); setActiveIndex(p => p + 1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 bg-black/40 text-white border-none z-10">
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Full screen dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[96vw] h-[96vh] p-0 overflow-hidden border-2 border-primary/20 bg-black rounded-[3rem] shadow-2xl">
          <DialogTitle className="sr-only">Story</DialogTitle>
          <div className="w-full h-full">
            <StoryPlayer url={active.media_url} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
