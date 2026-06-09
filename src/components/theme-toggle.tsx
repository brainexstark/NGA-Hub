'use client';

import * as React from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [isLight, setIsLight] = React.useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem('nga-theme');
    if (saved === 'light') {
      document.documentElement.classList.add('light');
      setIsLight(true);
    }
  }, []);

  const toggle = () => {
    const next = !isLight;
    setIsLight(next);
    if (next) {
      document.documentElement.classList.add('light');
      localStorage.setItem('nga-theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('nga-theme', 'dark');
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      className="relative text-foreground/60 hover:text-primary transition-colors"
    >
      {isLight ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </button>
  );
}
