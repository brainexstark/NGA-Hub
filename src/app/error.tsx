'use client';

import { useEffect } from 'react';
import { Button } from '../components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('NGA Hub Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a051a] p-6 text-center">
      <div className="space-y-6 max-w-md">
        <div className="mx-auto h-20 w-20 rounded-full bg-destructive/10 border-2 border-destructive/20 flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Something went wrong</h2>
          <p className="text-sm text-white/40 font-medium">
            {error?.message?.includes('Firebase') || error?.message?.includes('auth')
              ? 'Firebase connection issue. Please check your internet connection and try again.'
              : 'An unexpected error occurred. Please try again.'}
          </p>
        </div>
        <Button
          onClick={reset}
          className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px]"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        <button
          onClick={() => window.location.href = '/'}
          className="block text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}
