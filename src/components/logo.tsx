import * as React from 'react';

/**
 * NGA Hub Logo — uses the actual app icon
 */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 cursor-pointer ${className || ""}`}>
      <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-lg">
        <img
          src="/icons/icon-192.png"
          alt="NGA Hub"
          className="w-full h-full object-cover"
        />
      </div>
      <span className="font-bold text-xl sm:text-2xl tracking-tight logo-dynamics leading-none">
        NGA Hub
      </span>
    </div>
  );
}

export function LogoIcon({ className }: { className?: string }) {
  return (
    <div className={`h-10 w-10 rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-lg ${className || ""}`}>
      <img src="/icons/icon-192.png" alt="NGA Hub" className="w-full h-full object-cover" />
    </div>
  );
}
