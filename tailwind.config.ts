/** @type {import('tailwindcss').Config} */

/**
 * NGA Hub — Tailwind Config with Instagram Design Token System
 * ─────────────────────────────────────────────────────────────
 * All NGA Hub design tokens are available as Tailwind utilities:
 *
 * BACKGROUNDS:   bg-nga-bg / bg-nga-surface / bg-nga-elevated
 * TEXT:          text-nga-primary / text-nga-secondary
 * BORDERS:       border-nga-border
 * ACCENTS:       text-nga-action / bg-nga-action
 * DESTRUCTIVE:   text-nga-red / bg-nga-red
 * GRADIENT:      via nga-grad-* utilities or nga-brand-gradient CSS class
 */
const config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ─── shadcn/radix CSS var bridge (required for components) ─────────────
      colors: {
        background:   'hsl(var(--background))',
        foreground:   'hsl(var(--foreground))',
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border:       'hsl(var(--border))',
        input:        'hsl(var(--input))',
        ring:         'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT:             'hsl(var(--sidebar-background))',
          foreground:          'hsl(var(--sidebar-foreground))',
          primary:             'hsl(var(--sidebar-primary))',
          'primary-foreground':'hsl(var(--sidebar-primary-foreground))',
          accent:              'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border:              'hsl(var(--sidebar-border))',
          ring:                'hsl(var(--sidebar-ring))',
        },

        // ─── NGA Hub Instagram Token Colors ──────────────────────────────────
        nga: {
          // Light mode
          'light-bg':        '#FFFFFF',
          'light-surface':   '#FAFAFA',
          'light-text':      '#262626',
          'light-muted':     '#8E8E8E',
          'light-border':    '#DBDBDB',
          'light-border-sm': '#EFEFEF',

          // Dark mode (AMOLED)
          'dark-bg':         '#000000',
          'dark-surface':    '#121212',
          'dark-elevated':   '#1C1C1C',
          'dark-tertiary':   '#262626',
          'dark-text':       '#F5F5F5',
          'dark-muted':      '#A8A8A8',
          'dark-border':     '#262626',

          // Accents
          'action':          '#0095F6',   // IG interactive blue
          'red':             '#ED4956',   // IG like/notification red
          'success':         '#29B473',   // green

          // Brand gradient stops (for gradientColorStops)
          'grad-yellow':     '#FCCC63',
          'grad-orange':     '#F77737',
          'grad-pink':       '#E1306C',
          'grad-purple':     '#C13584',
          'grad-blue':       '#405DE6',
        },
      },

      // ─── Border radius ────────────────────────────────────────────────────
      borderRadius: {
        none:  '0px',
        sm:    '8px',
        DEFAULT:'12px',
        md:    '12px',
        lg:    '16px',
        xl:    '24px',
        '2xl': '32px',
        '3xl': '40px',
        full:  '9999px',
        // shadcn alias
        'r-lg': 'var(--radius)',
        'r-md': 'calc(var(--radius) - 2px)',
        'r-sm': 'calc(var(--radius) - 4px)',
      },

      // ─── Background images — brand gradient ────────────────────────────────
      backgroundImage: {
        'nga-brand': 'linear-gradient(45deg, #FCCC63, #F77737, #E1306C, #C13584, #405DE6)',
        'nga-brand-text': 'linear-gradient(45deg, #F77737, #E1306C, #C13584, #405DE6)',
        'nga-brand-radial': 'radial-gradient(circle at bottom left, #FCCC63, #F77737, #E1306C, #C13584, #405DE6)',
        'nga-dark-vignette': 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)',
      },

      // ─── Typography ───────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      fontWeight: {
        normal:    '400',
        medium:    '500',
        semibold:  '600',
        bold:      '700',
        extrabold: '800',
      },

      fontSize: {
        // IG-style type scale
        'xs2':  ['10px', { lineHeight: '12px' }],
        'xs':   ['12px', { lineHeight: '16px' }],
        'sm':   ['14px', { lineHeight: '18px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg':   ['18px', { lineHeight: '24px' }],
        'xl':   ['20px', { lineHeight: '28px' }],
        '2xl':  ['24px', { lineHeight: '30px' }],
        '3xl':  ['30px', { lineHeight: '36px' }],
      },

      // ─── Spacing ──────────────────────────────────────────────────────────
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top':    'env(safe-area-inset-top)',
        '15':  '60px',
        '18':  '72px',
        '22':  '88px',
        '26':  '104px',
        '30':  '120px',
      },

      // ─── Transitions ──────────────────────────────────────────────────────
      transitionDuration: {
        fast:   '100ms',
        base:   '200ms',
        slow:   '350ms',
        slower: '500ms',
      },

      transitionTimingFunction: {
        'nga': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      // ─── Box shadows ──────────────────────────────────────────────────────
      boxShadow: {
        'nga-sm':  '0 1px 3px rgba(0,0,0,0.3)',
        'nga-md':  '0 4px 12px rgba(0,0,0,0.4)',
        'nga-lg':  '0 8px 32px rgba(0,0,0,0.5)',
        'nga-action': '0 4px 16px rgba(0,149,246,0.35)',
      },

      // ─── Keyframes & animations ────────────────────────────────────────────
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        'nga-gradient': {
          '0%':   { backgroundPosition: '0% center' },
          '100%': { backgroundPosition: '300% center' },
        },
        'nga-spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        'nga-fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'nga-scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'nga-gradient':   'nga-gradient 4s linear infinite',
        'nga-spin-slow':  'nga-spin-slow 8s linear infinite',
        'nga-fade-up':    'nga-fade-up 0.3s ease-out',
        'nga-scale-in':   'nga-scale-in 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

module.exports = config;
