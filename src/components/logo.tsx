import * as React from 'react';

/**
 * NGA Hub Realistic Quantum Logo Node
 * Features a high-fidelity inline SVG with triple-ring diffraction and a luminous energy core.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 group cursor-pointer ${className || ""}`}>
      <div className="relative h-12 w-12 sm:h-16 sm:w-16 flex items-center justify-center bg-transparent">
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full animate-float-logo transition-transform duration-1000 group-hover:scale-110 drop-shadow-[0_10px_25px_rgba(64,93,230,0.4)]"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="50%" stopColor="hsl(var(--accent))" />
              <stop offset="100%" stopColor="hsl(var(--primary))" />
            </linearGradient>
            <filter id="neon-blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          <circle cx="50" cy="50" r="30" fill="url(#core-glow)" className="animate-pulse" />
          <ellipse cx="50" cy="50" rx="45" ry="15" stroke="url(#ring-grad)" strokeWidth="2" strokeLinecap="round" transform="rotate(45 50 50)" filter="url(#neon-blur)" className="opacity-80" />
          <ellipse cx="50" cy="50" rx="45" ry="15" stroke="url(#ring-grad)" strokeWidth="2" strokeLinecap="round" transform="rotate(-45 50 50)" filter="url(#neon-blur)" className="opacity-60" />
          <ellipse cx="50" cy="50" rx="45" ry="15" stroke="url(#ring-grad)" strokeWidth="2" strokeLinecap="round" transform="rotate(90 50 50)" filter="url(#neon-blur)" className="opacity-40" />
          <path 
            d="M42 35L65 50L42 65V35Z" 
            fill="white" 
            className="drop-shadow-[0_0_10px_white]"
          />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className={`font-headline text-2xl sm:text-4xl font-black tracking-tighter logo-dynamics leading-none bg-transparent normal-case`}>
          NGA Hub
        </span>
      </div>
    </div>
  );
}

export function LogoIcon({ className }: { className?: string }) {
  return <Logo className={className} />;
}
