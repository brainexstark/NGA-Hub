'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { X, ChevronRight } from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
  position: { top?: string; bottom?: string; left?: string; right?: string };
  arrowDir: 'up' | 'down' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to NGA Hub! 👋',
    description: 'This is your home feed. Scroll down to see trending videos and posts from the community.',
    position: { top: '20%', left: '50%' },
    arrowDir: 'up',
  },
  {
    title: 'Stories Row 📸',
    description: 'Tap any circle at the top to watch stories. Tap YOUR circle to create your own story.',
    position: { top: '35%', left: '50%' },
    arrowDir: 'up',
  },
  {
    title: 'Bottom Navigation 🧭',
    description: 'Use the bottom bar to navigate. Home, Search, the + button to create, Learning Hub, and your Profile.',
    position: { bottom: '25%', left: '50%' },
    arrowDir: 'down',
  },
  {
    title: 'Create Content ➕',
    description: 'Tap the + button to post a video, photo, story, reel, record from camera, or go live!',
    position: { bottom: '28%', left: '50%' },
    arrowDir: 'down',
  },
  {
    title: 'Your Profile 👤',
    description: 'Tap your avatar (bottom right) to go to settings. The small camera badge opens the camera directly.',
    position: { bottom: '28%', right: '5%' },
    arrowDir: 'down',
  },
  {
    title: 'Reels & Shorts 🎬',
    description: 'Go to Reels from the sidebar for full-screen TikTok-style videos. Scroll up/down to switch.',
    position: { top: '50%', left: '50%' },
    arrowDir: 'left',
  },
  {
    title: 'Learning Hub 🎓',
    description: 'Tap the graduation cap to access lessons, subjects, and AI-generated lesson plans.',
    position: { bottom: '28%', left: '35%' },
    arrowDir: 'down',
  },
  {
    title: "You're all set! 🚀",
    description: 'Explore, create, learn, and connect. The sidebar has everything else — chat, live stream, discover, and more!',
    position: { top: '40%', left: '50%' },
    arrowDir: 'up',
  },
];

export function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('nga-tour-done');
    if (!seen) {
      setTimeout(() => setVisible(true), 1500);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem('nga-tour-done', '1');
  };

  const next = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      dismiss();
    }
  };

  if (!visible) return null;

  const current = TOUR_STEPS[step];

  return (
    <div className="fixed inset-0 z-[99999] pointer-events-none">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={dismiss} />

      {/* Animated finger pointer */}
      <div
        className="absolute pointer-events-none z-10 animate-bounce"
        style={{
          top: current.position.top,
          bottom: current.position.bottom,
          left: current.position.left ? `calc(${current.position.left} - 20px)` : undefined,
          right: current.position.right,
          transform: current.position.left === '50%' ? 'translateX(-50%)' : undefined,
        }}
      >
        <div className="text-4xl select-none">👆</div>
      </div>

      {/* Tooltip card */}
      <div
        className="absolute pointer-events-auto z-20 w-72 bg-slate-900 border-2 border-primary/40 rounded-[2rem] p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={{
          top: current.position.top ? `calc(${current.position.top} + 60px)` : undefined,
          bottom: current.position.bottom ? `calc(${current.position.bottom} + 60px)` : undefined,
          left: current.position.left ? `calc(${current.position.left} - 144px)` : undefined,
          right: current.position.right ? '10px' : undefined,
        }}
      >
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className={cn("h-1.5 rounded-full transition-all", i === step ? "w-6 bg-primary" : "w-1.5 bg-white/20")} />
            ))}
          </div>
          <button onClick={dismiss} className="text-white/40 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 className="font-black text-sm uppercase tracking-tight text-white mb-1">{current.title}</h3>
        <p className="text-xs text-white/70 font-medium leading-relaxed mb-4">{current.description}</p>

        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{step + 1} / {TOUR_STEPS.length}</span>
          <Button onClick={next} size="sm" className="h-8 px-4 rounded-xl font-black uppercase text-[10px]">
            {step < TOUR_STEPS.length - 1 ? <><ChevronRight className="h-3 w-3 mr-1" /> Next</> : '🚀 Let\'s Go!'}
          </Button>
        </div>
      </div>
    </div>
  );
}
