'use client';

import { useEffect } from 'react';
import { RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function HomeTonError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('HomeTon Error:', error?.message);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a051a] p-6 text-center space-y-6">
      <div className="h-16 w-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
        <span className="text-3xl">⚡</span>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Loading issue</h2>
        <p className="text-sm text-white/40 max-w-xs mx-auto">
          The page had trouble loading. Tap retry — it usually fixes itself.
        </p>
      </div>
      <div className="flex gap-3">
        <button onClick={reset}
          className="flex items-center gap-2 h-11 px-6 bg-primary rounded-2xl font-black text-white text-xs uppercase tracking-widest">
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
        <Link href="/"
          className="flex items-center gap-2 h-11 px-6 bg-white/10 rounded-2xl font-black text-white text-xs uppercase tracking-widest">
          <Home className="h-4 w-4" /> Home
        </Link>
      </div>
    </div>
  );
}
