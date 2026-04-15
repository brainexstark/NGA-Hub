
'use client';

import * as React from 'react';
import { Clock, Zap } from 'lucide-react';

interface UsageTimerProps {
    remainingSeconds?: number;
}

/**
 * STARK-B Session Governance Node
 * Displays the remaining high-performance entertainment protocol time.
 */
export function UsageTimer({ remainingSeconds = 0 }: UsageTimerProps) {
  const mins = Math.floor(Math.max(0, remainingSeconds) / 60);
  const secs = Math.max(0, remainingSeconds) % 60;

  const isLow = remainingSeconds < 60; // Final 60 seconds warning

  return (
    <div className={`w-full flex flex-col items-center gap-2 p-4 rounded-[2rem] border transition-all duration-1000 ${
        isLow ? "bg-destructive/10 border-destructive/20 animate-pulse" : "bg-primary/5 border-primary/10 shadow-inner"
    }`}>
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isLow ? "bg-destructive/20" : "bg-primary/20"}`}>
                <Clock className={`h-4 w-4 ${isLow ? "text-destructive" : "text-primary"}`} />
            </div>
            <span className={`font-mono text-2xl font-black tracking-tighter ${isLow ? "text-destructive" : "text-primary"}`}>
                {mins}:{secs.toString().padStart(2, '0')}
            </span>
        </div>
        <div className="flex items-center gap-1.5">
            <Zap className={`h-3 w-3 ${isLow ? "text-destructive" : "text-accent fill-accent"}`} />
            <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">
                Node Activity Protocol
            </span>
        </div>
    </div>
  );
}
