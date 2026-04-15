'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Star, X } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const RATE_KEY = 'stark-b-rated';
const RATE_SHOWN_KEY = 'stark-b-rate-shown';

export function RateAppDialog() {
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [hovered, setHovered] = React.useState(0);
  const { toast } = useToast();

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(RATE_KEY)) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (!localStorage.getItem(RATE_SHOWN_KEY)) {
          setOpen(true);
          localStorage.setItem(RATE_SHOWN_KEY, 'true');
        }
      }
    };

    const handleBeforeUnload = () => {
      if (!localStorage.getItem(RATE_KEY)) {
        localStorage.setItem(RATE_SHOWN_KEY, 'true');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleRate = () => {
    if (rating === 0) return;
    localStorage.setItem(RATE_KEY, String(rating));
    setOpen(false);
    toast({
      title: rating >= 4 ? '🌟 Thanks for the love!' : '🙏 Thanks for your feedback!',
      description: rating >= 4
        ? 'Your rating means a lot to the NGA Hub community.'
        : 'We\'ll use your feedback to improve the experience.',
    });
  };

  const handleSkip = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[#0f0535] border border-primary/20 rounded-[3rem] max-w-sm p-8 text-center shadow-2xl">
        <DialogTitle className="sr-only">Rate NGA Hub</DialogTitle>

        <button
          onClick={handleSkip}
          className="absolute top-5 right-5 text-white/20 hover:text-white/60 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-6">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
            <Star className="h-8 w-8 text-primary fill-primary" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white font-headline">
              Enjoying NGA Hub?
            </h2>
            <p className="text-sm text-white/50 font-medium">
              Tap a star to rate your experience
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-125 active:scale-110"
              >
                <Star
                  className={`h-10 w-10 transition-colors duration-150 ${
                    star <= (hovered || rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-white/20'
                  }`}
                />
              </button>
            ))}
          </div>

          {rating > 0 && (
            <p className="text-xs font-black uppercase tracking-widest text-primary animate-in fade-in duration-300">
              {rating === 1 && 'We\'ll do better 💪'}
              {rating === 2 && 'Thanks, we\'re improving 🔧'}
              {rating === 3 && 'Good to know! 👍'}
              {rating === 4 && 'Awesome! 🚀'}
              {rating === 5 && 'You\'re a legend! 🌟'}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="flex-1 h-12 rounded-2xl text-white/40 hover:text-white/60 font-black uppercase text-[10px] tracking-widest"
            >
              Later
            </Button>
            <Button
              onClick={handleRate}
              disabled={rating === 0}
              className="flex-1 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest animate-bg-color-sync border-none text-white disabled:opacity-30 disabled:animate-none disabled:bg-white/10"
            >
              Submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
