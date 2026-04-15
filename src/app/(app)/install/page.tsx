'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Download, Monitor, Smartphone, Zap, CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";
import { useToast } from "../../../hooks/use-toast";

export default function InstallPage() {
  const { toast } = useToast();
  const [canInstall, setCanInstall] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    // Detect existing installation
    if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
    }

    // Check if prompt was already captured by the registry
    if ((window as any).deferredInstallPrompt) {
        setCanInstall(true);
    }

    // Listen for the custom signal from PwaInstaller
    const handleReady = () => {
        setCanInstall(true);
    };
    
    window.addEventListener('stark-b-install-ready', handleReady);
    return () => window.removeEventListener('stark-b-install-ready', handleReady);
  }, []);

  const handleInstall = async () => {
    const promptEvent = (window as any).deferredInstallPrompt;
    if (!promptEvent) {
      toast({ 
        title: "Installation Node Unavailable", 
        description: "Your browser hasn't authorized the prompt. Try a hard refresh (Ctrl+F5) and wait 5 seconds for the STARK-B handshake." 
      });
      return;
    }

    // Trigger the native Chrome dropdown
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    
    if (outcome === 'accepted') {
      toast({ title: "Node Synchronized", description: "NGA Hub installation initiated." });
      (window as any).deferredInstallPrompt = null;
      setCanInstall(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-12 space-y-8 animate-in fade-in duration-700">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest border border-primary/20">
            <Zap className="h-4 w-4" /> Native Node Synchronization
        </div>
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter">Install Hub</h1>
        <p className="text-muted-foreground text-lg font-medium italic">Synchronize the platform directly to your hardware for high-performance access.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-2 border-primary/10 bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
            <CardHeader className="p-10 text-center">
                <div 
                    onClick={handleInstall}
                    className={`mx-auto mb-6 h-20 w-20 rounded-[2rem] bg-primary/10 flex items-center justify-center border-2 border-primary/20 transition-all ${
                        canInstall ? "cursor-pointer hover:scale-110 active:scale-95 shadow-lg shadow-primary/20 bg-primary/20" : "opacity-50"
                    }`}
                >
                    <Download className={`h-10 w-10 text-primary ${canInstall ? "animate-bounce" : ""}`} />
                </div>
                <CardTitle className="text-2xl font-black uppercase tracking-tight text-foreground">Direct Installation</CardTitle>
                <CardDescription>Install as a secure standalone application.</CardDescription>
            </CardHeader>
            <CardContent className="px-10 pb-10 space-y-6">
                <ul className="space-y-4">
                    {[
                        "Faster launch synchronization",
                        "High-performance offline cache",
                        "Direct hardware integration",
                        "Custom desktop identity node"
                    ].map((benefit, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-medium italic text-foreground/80">
                            <CheckCircle2 className="h-4 w-4 text-green-500" /> {benefit}
                        </li>
                    ))}
                </ul>
                {isInstalled ? (
                    <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-green-500 flex items-center justify-center gap-2">
                            <ShieldCheck className="h-4 w-4" /> System Fully Synchronized
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Button 
                            onClick={handleInstall}
                            disabled={!canInstall}
                            className="w-full h-16 rounded-3xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20"
                        >
                            {canInstall ? "Execute Installation" : "Awaiting Authorization..."}
                        </Button>
                        {!canInstall && (
                            <p className="text-[9px] text-center font-bold uppercase opacity-40 animate-pulse text-foreground">
                                Initializing Browser compatibility node...
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>

        <Card className="border-2 border-white/5 bg-black/20 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-10">
                <CardTitle className="text-xl font-black uppercase flex items-center gap-2 text-foreground">
                    <Monitor className="h-5 w-5 text-accent" /> Desktop Protocol
                </CardTitle>
            </CardHeader>
            <CardContent className="px-10 pb-10 space-y-8">
                <div className="space-y-4">
                    <p className="text-xs font-black uppercase opacity-40 text-foreground">Browser Dropdown Node</p>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-sm italic text-foreground/80">
                        Click the <span className="font-bold text-primary">Install</span> icon in your address bar (right side) to initialize the high-performance dropdown manually.
                    </div>
                </div>
                <div className="space-y-4">
                    <p className="text-xs font-black uppercase opacity-40 text-foreground">Identity Synchronization</p>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-sm italic text-foreground/80">
                        To use your own logo, place your image in the <span className="font-bold text-primary">public/</span> folder and update the <span className="font-bold text-primary">manifest.json</span> node.
                    </div>
                </div>
                <Button variant="ghost" className="w-full text-[10px] font-black uppercase text-foreground/60 hover:text-foreground" onClick={() => window.location.reload()}>
                    <RefreshCw className="mr-2 h-3 w-3" /> Re-Initialize Node
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}