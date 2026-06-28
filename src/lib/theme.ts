/**
 * NGA Hub — Instagram-inspired Design Token System
 * ──────────────────────────────────────────────────
 * Single source of truth for all design tokens.
 * All values are also available as CSS custom properties in globals.css.
 * Use this file for any JS/TS logic that needs theme values.
 */

export const nga = {
  // ─── Light Mode ─────────────────────────────────────────────────────────────
  light: {
    bgPrimary:        '#FFFFFF',  // pure white — main canvas
    bgSecondary:      '#FAFAFA',  // feed/input surfaces
    textPrimary:      '#262626',  // off-black — headings, body
    textSecondary:    '#8E8E8E',  // muted text, placeholders
    border:           '#DBDBDB',  // dividers, input borders
  },

  // ─── Dark Mode (AMOLED) ───────────────────────────────────────────────────
  dark: {
    bgPrimary:        '#000000',  // pure black — AMOLED
    bgSecondary:      '#121212',  // cards, sheets
    bgTertiary:       '#262626',  // elevated surfaces
    textPrimary:      '#F5F5F5',  // near-white text
    textSecondary:    '#A8A8A8',  // muted text
    border:           '#262626',  // subtle dividers
  },

  // ─── System Accents ───────────────────────────────────────────────────────
  accent: {
    action:           '#0095F6',  // interactive blue — follow, CTA, links
    destructive:      '#ED4956',  // red — badges, errors, like counts
  },

  // ─── Brand Gradient ───────────────────────────────────────────────────────
  gradient: {
    brand: 'linear-gradient(to top right, #FCCC63, #F77737, #E1306C, #C13584, #405DE6)',
    brandStops: ['#FCCC63', '#F77737', '#E1306C', '#C13584', '#405DE6'],
  },
} as const;

export type NGA = typeof nga;
