'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb, Send, Zap } from "lucide-react";
import * as React from 'react';
import { useToast } from "@/hooks/use-toast";

/**
 * STARK-B Feature Request Node
 * Client-side synchronized developmental matrix.
 */
export default function FeatureRequestPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Mission Node Sync Simulation
    setTimeout(() => {
        toast({
            title: "Idea Localized",
            description: "Feature request synchronized with the STARK-B developmental matrix."
        });
        setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="container mx-auto flex justify-center items-center flex-grow py-10 animate-in fade-in duration-700">
      <Card className="w-full max-w-2xl border-2 border-primary/10 bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-primary animate-pulse" />
        <CardHeader className="text-center p-10">
           <div className="flex justify-center mb-6">
             <div className="bg-primary/10 p-5 rounded-[2rem] border border-primary/20 animate-float-logo">
              <Lightbulb className="h-10 w-10 text-primary" />
             </div>
           </div>
          <CardTitle className="font-headline text-4xl font-black uppercase tracking-tight">Request a Feature</CardTitle>
          <CardDescription className="text-sm font-medium italic opacity-60">
            Synchronize your brilliant ideas with the STARK-B developmental matrix.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-10 pt-0">
          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <Label htmlFor="feature-idea" className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Proposed Feature Node</Label>
              <Textarea 
                id="feature-idea" 
                placeholder="Describe the feature you'd love to see..." 
                rows={6}
                className="bg-black/20 border-white/5 rounded-2xl p-4 font-medium"
                required
              />
            </div>
             <div className="space-y-3">
              <Label htmlFor="feature-benefit" className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Impact Analysis</Label>
              <Textarea 
                id="feature-benefit" 
                placeholder="Explain how this feature would improve your node workability." 
                rows={3}
                className="bg-black/20 border-white/5 rounded-2xl p-4 font-medium"
                required
              />
            </div>
            <Button type="submit" className="w-full h-16 rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-primary/20 text-xs" disabled={isSubmitting}>
              {isSubmitting ? <Zap className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
              EXECUTE SYNCHRONIZATION
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
