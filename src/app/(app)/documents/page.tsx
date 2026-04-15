'use client';

import * as React from 'react';
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    FileText, 
    FileSpreadsheet, 
    Presentation, 
    Upload, 
    Plus, 
    Search, 
    Loader2, 
    Zap,
    ShieldCheck,
    Trash2,
    Download,
    Share2,
    ExternalLink
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const mockDocs = [
  { id: 'd1', name: 'Mission_Report_Alpha.docx', type: 'word', size: '1.2 MB', date: '2h ago' },
  { id: 'd2', name: 'Orbital_Calculations.xlsx', type: 'excel', size: '4.5 MB', date: 'Yesterday' },
  { id: 'd3', name: 'Legacy_Sync_Briefing.pptx', type: 'powerpoint', size: '12.8 MB', date: '3 days ago' },
];

export default function DocumentsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = () => {
    setIsUpdating(true);
    setTimeout(() => {
        toast({ title: "Node Localized", description: "Document synchronized to the STARK-B superdatabase." });
        setIsUpdating(false);
    }, 1500);
  };

  const getDocIcon = (type: string) => {
    switch (type) {
      case 'word': return <FileText className="h-6 w-6 text-blue-400" />;
      case 'excel': return <FileSpreadsheet className="h-6 w-6 text-green-400" />;
      case 'powerpoint': return <Presentation className="h-6 w-6 text-orange-400" />;
      default: return <FileText className="h-6 w-6 text-primary" />;
    }
  };

  return (
    <div className="container mx-auto space-y-10 pb-32 animate-in fade-in duration-700 pt-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                <ShieldCheck className="h-3.5 w-3.5" /> Productivity Synchronization
            </div>
            <h1 className="font-headline text-5xl font-black uppercase tracking-tighter dynamic-text-mesh">Document Sync</h1>
            <p className="text-muted-foreground text-lg font-medium italic max-w-2xl">
                Access your Microsoft Office legacy nodes and manage localized document assets within the secure matrix.
            </p>
        </div>
        <div className="flex items-center gap-4">
            <Dialog>
                <DialogTrigger asChild>
                    <Button className="h-14 px-8 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 animate-bg-color-sync border-none text-white">
                        <Plus className="mr-2 h-5 w-5" /> New Sync Node
                    </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-primary/20 rounded-[3rem] max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white">Initialize Sync</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-6">
                        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/10 rounded-3xl p-10 text-center cursor-pointer hover:border-primary/50 transition-all bg-black/20 group">
                            <Upload className="h-10 w-10 mx-auto mb-4 opacity-40 group-hover:scale-110 transition-transform text-primary" />
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} />
                            <p className="font-black text-xs uppercase tracking-widest opacity-60">Deposit Hardware File</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-primary/60 ml-1">Remote Node Link (Office.com)</Label>
                            <Input placeholder="Paste document URL..." className="h-12 bg-black/40 border-white/10 rounded-2xl font-bold" />
                        </div>
                        <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs" onClick={handleUpload}>
                            EXECUTE SYNCHRONIZATION
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
      </header>

      <div className="flex items-center gap-4 bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-2 focus-within:border-primary/50 transition-all shadow-2xl max-w-xl mx-auto md:mx-0">
        <Search className="ml-4 h-5 w-5 text-muted-foreground" />
        <Input 
            placeholder="Query document matrix..." 
            className="bg-transparent border-none focus-visible:ring-0 font-medium italic"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card className="border-2 border-primary/10 bg-primary/5 rounded-[2.5rem] p-8 flex flex-col justify-center items-center text-center space-y-6 group cursor-pointer hover:bg-primary/10 transition-all shadow-xl" onClick={() => window.open('https://www.office.com', '_blank')}>
            <div className="h-20 w-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-black uppercase tracking-tight text-white">Office Launcher</h3>
                <p className="text-xs font-medium italic opacity-60">Initialize full Microsoft Office matrix suite.</p>
            </div>
            <ExternalLink className="h-5 w-5 opacity-20 group-hover:opacity-100 transition-opacity" />
        </Card>

        {mockDocs.map((doc) => (
            <Card key={doc.id} className="border-2 border-white/5 bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden hover:border-primary/20 transition-all group shadow-xl">
                <CardHeader className="p-8 pb-4">
                    <div className="flex items-start justify-between">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform">
                            {getDocIcon(doc.type)}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10"><Download className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10"><Share2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                    <div className="mt-6 space-y-1">
                        <CardTitle className="text-lg font-black uppercase tracking-tight text-white truncate">{doc.name}</CardTitle>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Localized {doc.date}</p>
                    </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 flex items-center justify-between">
                    <span className="text-[10px] font-bold opacity-40 uppercase tabular-nums">{doc.size}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-full">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </CardContent>
            </Card>
        ))}
      </div>

      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-6">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-primary/20 p-4 rounded-3xl shadow-2xl flex items-center gap-4">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <p className="text-[9px] font-black uppercase tracking-widest text-white/60 leading-tight">
                  STARK-B Node Status: Document matrix synchronized with Microsoft Hardware Link.
              </p>
          </div>
      </div>
    </div>
  );
}
