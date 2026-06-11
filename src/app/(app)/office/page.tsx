'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { ExternalLink, Lock, RefreshCw, Zap } from 'lucide-react';
import { cn } from '../../../lib/utils';

const OFFICE_APPS = [
  { name: 'Word Online', icon: '📝', url: 'https://office.live.com/start/Word.aspx', color: 'bg-blue-600', accent: 'border-blue-500/30' },
  { name: 'Excel Online', icon: '📊', url: 'https://office.live.com/start/Excel.aspx', color: 'bg-green-600', accent: 'border-green-500/30' },
  { name: 'PowerPoint Online', icon: '🎨', url: 'https://office.live.com/start/PowerPoint.aspx', color: 'bg-orange-600', accent: 'border-orange-500/30' },
  { name: 'OneNote Online', icon: '📓', url: 'https://office.live.com/start/OneNote.aspx', color: 'bg-purple-600', accent: 'border-purple-500/30' },
];

function OfficeViewer({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  const [isLoading, setIsLoading] = React.useState(true);

  return (
    <div className="w-full h-full flex flex-col bg-black">
      <div className="bg-slate-900 p-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">{name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-[9px] font-black uppercase text-white/40 hover:text-white hover:bg-white/5"
            onClick={() => window.open(url, '_blank')}
          >
            <ExternalLink className="mr-1.5 h-3 w-3" /> Open in Browser
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
              <p className="font-headline text-2xl font-bold uppercase tracking-tight text-white">Loading {name}...</p>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Initializing Office Node</p>
            </div>
          </div>
        )}
        <iframe
          src={url}
          className="w-full h-full border-none bg-white"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}

export default function OfficePage() {
  const [activeApp, setActiveApp] = React.useState<typeof OFFICE_APPS[0] | null>(null);

  return (
    <div className="min-h-screen p-4 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
          📋 Microsoft Office Online
        </div>
        <h1 className="font-headline text-4xl font-black uppercase tracking-tighter">Office Suite</h1>
        <p className="text-white/50 text-sm font-medium">
          Access Word, Excel, PowerPoint and OneNote directly within NGA Hub.
        </p>
      </div>

      {/* Paywall Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/20 p-5 flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
          <Lock className="h-5 w-5 text-blue-400" />
        </div>
        <div className="space-y-1">
          <p className="font-black text-sm text-white uppercase tracking-tight">Full Office Suite Access</p>
          <p className="text-white/50 text-xs leading-relaxed">
            Unlock premium Office integration for just <span className="text-blue-400 font-black">$0.007/day</span> — coming soon with M-Pesa &amp; Stripe integration.
          </p>
        </div>
      </div>

      {/* App Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {OFFICE_APPS.map(app => (
          <button
            key={app.name}
            onClick={() => setActiveApp(app)}
            className={cn(
              'flex flex-col items-center gap-4 p-6 rounded-3xl bg-white/5 border hover:bg-white/10 active:scale-[0.97] transition-all duration-200 group text-center',
              app.accent
            )}
          >
            <div className={cn('h-16 w-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform', app.color)}>
              {app.icon}
            </div>
            <div className="space-y-1">
              <p className="font-black text-sm uppercase tracking-tight text-white">{app.name}</p>
              <p className="text-[10px] text-white/40 font-medium">Click to open</p>
            </div>
          </button>
        ))}
      </div>

      <p className="text-center text-[10px] text-white/20 font-medium uppercase tracking-widest pb-8">
        Microsoft Office Online · Requires Microsoft account for full features
      </p>

      {/* Full-screen Dialog */}
      <Dialog open={!!activeApp} onOpenChange={open => !open && setActiveApp(null)}>
        <DialogContent className="max-w-[96vw] h-[96vh] p-0 overflow-hidden border-2 border-primary/20 bg-black rounded-[3rem] shadow-2xl flex flex-col">
          <DialogTitle className="sr-only">{activeApp?.name}</DialogTitle>
          {activeApp && (
            <OfficeViewer
              url={activeApp.url}
              name={activeApp.name}
              onClose={() => setActiveApp(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
