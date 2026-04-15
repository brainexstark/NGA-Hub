'use client';

import * as React from 'react';
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    FileText, FileSpreadsheet, Presentation, Upload, Plus,
    Search, Loader2, Zap, ShieldCheck, Trash2, Download,
    Share2, ExternalLink, Mail, Calendar, Video, Clipboard,
    Database, Globe, MessageSquare, BookOpen, BarChart2, Layers
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const officeApps = [
  { name: 'Word', icon: FileText, color: 'bg-blue-600', url: 'https://word.new', desc: 'Create & edit documents' },
  { name: 'Excel', icon: FileSpreadsheet, color: 'bg-green-600', url: 'https://excel.new', desc: 'Spreadsheets & data' },
  { name: 'PowerPoint', icon: Presentation, color: 'bg-orange-600', url: 'https://powerpoint.new', desc: 'Slides & presentations' },
  { name: 'Outlook', icon: Mail, color: 'bg-blue-500', url: 'https://outlook.live.com', desc: 'Email & calendar' },
  { name: 'Teams', icon: MessageSquare, color: 'bg-purple-600', url: 'https://teams.microsoft.com', desc: 'Chat & video meetings' },
  { name: 'OneDrive', icon: Database, color: 'bg-sky-500', url: 'https://onedrive.live.com', desc: 'Cloud file storage' },
  { name: 'OneNote', icon: BookOpen, color: 'bg-purple-500', url: 'https://onenote.new', desc: 'Notes & notebooks' },
  { name: 'Forms', icon: Clipboard, color: 'bg-teal-500', url: 'https://forms.office.com', desc: 'Surveys & quizzes' },
  { name: 'Sway', icon: Layers, color: 'bg-cyan-600', url: 'https://sway.office.com', desc: 'Interactive reports' },
  { name: 'Visio', icon: BarChart2, color: 'bg-indigo-600', url: 'https://visio.new', desc: 'Diagrams & flowcharts' },
  { name: 'Calendar', icon: Calendar, color: 'bg-red-500', url: 'https://calendar.live.com', desc: 'Schedule & events' },
  { name: 'Office.com', icon: Globe, color: 'bg-primary', url: 'https://www.office.com', desc: 'Full Office suite' },
];

const mockDocs = [
  { id: 'd1', name: 'Mission_Report_Alpha.docx', type: 'word', size: '1.2 MB', date: '2h ago', url: 'https://word.new' },
  { id: 'd2', name: 'Orbital_Calculations.xlsx', type: 'excel', size: '4.5 MB', date: 'Yesterday', url: 'https://excel.new' },
  { id: 'd3', name: 'Legacy_Sync_Briefing.pptx', type: 'powerpoint', size: '12.8 MB', date: '3 days ago', url: 'https://powerpoint.new' },
];

export default function DocumentsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [docs, setDocs] = useState(mockDocs);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setTimeout(() => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const type = ext === 'docx' || ext === 'doc' ? 'word' : ext === 'xlsx' || ext === 'xls' ? 'excel' : ext === 'pptx' || ext === 'ppt' ? 'powerpoint' : 'word';
      setDocs(prev => [{ id: `d${Date.now()}`, name: file.name, type, size: `${(file.size / 1024 / 1024).toFixed(1)} MB`, date: 'Just now', url: 'https://www.office.com' }, ...prev]);
      toast({ title: "Document Synced", description: `${file.name} added to your matrix.` });
      setIsUploading(false);
      setDialogOpen(false);
    }, 1200);
  };

  const handleRemoteSync = () => {
    if (!remoteUrl.trim()) return;
    setIsUploading(true);
    setTimeout(() => {
      toast({ title: "Remote Node Synced", description: "Document link added." });
      setIsUploading(false);
      setRemoteUrl('');
      setDialogOpen(false);
    }, 1000);
  };

  const handleDelete = (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    toast({ title: "Document Removed" });
  };

  const getDocIcon = (type: string) => {
    if (type === 'word') return <FileText className="h-6 w-6 text-blue-400" />;
    if (type === 'excel') return <FileSpreadsheet className="h-6 w-6 text-green-400" />;
    if (type === 'powerpoint') return <Presentation className="h-6 w-6 text-orange-400" />;
    return <FileText className="h-6 w-6 text-primary" />;
  };

  const filtered = docs.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="container mx-auto space-y-10 pb-32 animate-in fade-in duration-700 pt-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
            <ShieldCheck className="h-3.5 w-3.5" /> Microsoft Office Suite
          </div>
          <h1 className="font-headline text-5xl font-black uppercase tracking-tighter dynamic-text-mesh">Document Sync</h1>
          <p className="text-muted-foreground text-lg font-medium italic max-w-2xl">
            Access all Microsoft Office 365 apps and manage your documents in one place.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-14 px-8 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 animate-bg-color-sync border-none text-white">
              <Plus className="mr-2 h-5 w-5" /> New Document
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-primary/20 rounded-[3rem] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white">Add Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-3xl p-10 text-center cursor-pointer hover:border-primary/50 transition-all bg-black/20 group"
              >
                <Upload className="h-10 w-10 mx-auto mb-4 opacity-40 group-hover:scale-110 transition-transform text-primary" />
                <input type="file" ref={fileInputRef} className="hidden" accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf" onChange={handleFileUpload} />
                <p className="font-black text-xs uppercase tracking-widest opacity-60">Upload from device</p>
                <p className="text-[10px] opacity-30 mt-1">Word, Excel, PowerPoint, PDF</p>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-primary/60 ml-1">Office.com Document URL</Label>
                <Input
                  placeholder="Paste Office 365 link..."
                  className="h-12 bg-black/40 border-white/10 rounded-2xl font-bold text-white"
                  value={remoteUrl}
                  onChange={e => setRemoteUrl(e.target.value)}
                />
              </div>
              <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs" onClick={handleRemoteSync} disabled={isUploading || !remoteUrl.trim()}>
                {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'SYNC DOCUMENT'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Microsoft Office Apps Grid */}
      <section className="space-y-4">
        <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary/60 ml-1">Microsoft Office 365 Apps</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {officeApps.map((app) => (
            <button
              key={app.name}
              onClick={() => window.open(app.url, '_blank')}
              className="flex flex-col items-center gap-3 p-4 rounded-[2rem] bg-card/40 border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all group active:scale-95"
            >
              <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform", app.color)}>
                <app.icon className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tight text-center leading-tight">{app.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Search */}
      <div className="flex items-center gap-4 bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-2 focus-within:border-primary/50 transition-all shadow-2xl max-w-xl">
        <Search className="ml-4 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          className="bg-transparent border-none focus-visible:ring-0 font-medium italic"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Recent Documents */}
      <section className="space-y-4">
        <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary/60 ml-1">Recent Documents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((doc) => (
            <Card key={doc.id} className="border-2 border-white/5 bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden hover:border-primary/20 transition-all group shadow-xl">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-start justify-between">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform">
                    {getDocIcon(doc.type)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10" onClick={() => { window.open(doc.url, '_blank'); toast({ title: "Opening document..." }); }}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10" onClick={() => { navigator.clipboard.writeText(doc.url); toast({ title: "Link copied!" }); }}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-6 space-y-1">
                  <CardTitle className="text-lg font-black uppercase tracking-tight text-white truncate">{doc.name}</CardTitle>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Synced {doc.date}</p>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8 flex items-center justify-between">
                <span className="text-[10px] font-bold opacity-40 uppercase tabular-nums">{doc.size}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-full" onClick={() => handleDelete(doc.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 py-20 text-center opacity-30">
              <FileText className="h-12 w-12 mx-auto mb-4" />
              <p className="font-black uppercase tracking-widest text-sm">No documents found</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
