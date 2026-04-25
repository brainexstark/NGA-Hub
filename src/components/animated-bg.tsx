'use client';

import * as React from 'react';

// Animated background that responds to touch/mouse movement
export function AnimatedBg({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const [mousePos, setMousePos] = React.useState({ x: 50, y: 50 });
  const [colorIndex, setColorIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Colour palettes that fade between each other
  const palettes = [
    { a: '#1a0533', b: '#0d1b4b', c: '#2d0a5e' },  // purple-blue
    { a: '#0a1a3d', b: '#1a0533', c: '#3d0a6e' },  // deep blue-purple
    { a: '#0d2b5e', b: '#2d0a5e', c: '#0a051a' },  // navy-purple
    { a: '#1a0533', b: '#3d0a6e', c: '#0d1b4b' },  // violet
    { a: '#0a051a', b: '#1a0533', c: '#0d2b5e' },  // dark purple
  ];

  // Cycle colours every 3 seconds
  React.useEffect(() => {
    const t = setInterval(() => setColorIndex(p => (p + 1) % palettes.length), 3000);
    return () => clearInterval(t);
  }, []);

  // Track mouse/touch position
  const handleMove = React.useCallback((x: number, y: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMousePos({
      x: ((x - rect.left) / rect.width) * 100,
      y: ((y - rect.top) / rect.height) * 100,
    });
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY);
  const handleTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) handleMove(t.clientX, t.clientY);
  };

  const p = palettes[colorIndex];

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      style={{
        background: p.a,
        transition: 'background 3s ease',
      }}
    >
      {/* Dynamic colour blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Blob 1 — follows mouse */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-60"
          style={{
            background: `radial-gradient(circle, ${p.b}cc, transparent 70%)`,
            left: `${mousePos.x - 30}%`,
            top: `${mousePos.y - 30}%`,
            transform: 'translate(-50%, -50%)',
            transition: 'left 1.2s ease, top 1.2s ease, background 3s ease',
          }}
        />
        {/* Blob 2 — opposite corner */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-50"
          style={{
            background: `radial-gradient(circle, ${p.c}cc, transparent 70%)`,
            left: `${100 - mousePos.x}%`,
            top: `${100 - mousePos.y}%`,
            transform: 'translate(-50%, -50%)',
            transition: 'left 1.8s ease, top 1.8s ease, background 3s ease',
          }}
        />
        {/* Blob 3 — center ambient */}
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[80px] opacity-30"
          style={{
            background: `radial-gradient(circle, ${p.b}99, transparent 70%)`,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            transition: 'background 3s ease',
          }}
        />
      </div>
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
