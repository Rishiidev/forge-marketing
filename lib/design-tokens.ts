/**
 * Raw design token data. tailwind.config.ts imports this to build the
 * actual theme; app/design-system/page.tsx imports the same object to
 * render token swatches. One data source, two consumers — the preview
 * page can never drift from the real tokens, and doesn't need to import
 * tailwind.config.ts itself (which also pulls in the Tailwind plugin
 * machinery — unnecessary weight for an app route to depend on).
 */

export const colors = {
  transparent: 'transparent',
  current: 'currentColor',
  white: '#FFFFFF',
  black: '#000000',
  ground: {
    DEFAULT: '#3A3B1F',
    2: '#2A2B16',
    3: '#4A4B2A',
  },
  mark: {
    DEFAULT: '#D6DDA0',
    2: '#B7C074',
  },
  paper: {
    DEFAULT: '#F5F3EC',
    2: '#EDEAE0',
    3: '#E2DFD3',
  },
  ink: {
    DEFAULT: '#1B1B12',
    2: '#2C2C1B',
    3: '#4A4A36',
  },
  muted: {
    DEFAULT: '#6B6A55',
    2: '#8E8D74',
  },
  warm: '#B85A2E',
  success: '#4A7C2A',
  border: {
    DEFAULT: 'rgba(27, 27, 18, 0.10)',
    strong: 'rgba(27, 27, 18, 0.22)',
  },
} as const

// Not `as const` — Tailwind's FontSize type wants mutable [string, object]
// tuples; a readonly tuple (from `as const`) doesn't satisfy it. The
// string literal keys still give good autocomplete without it.
export const fontSize: Record<string, [string, Record<string, string>]> = {
  display: ['clamp(2.9rem, 6.6vw, 6.4rem)', { lineHeight: '1', letterSpacing: '-0.04em', fontWeight: '600' }],
  'heading-xl': ['clamp(2.6rem, 5.4vw, 4.8rem)', { lineHeight: '1', letterSpacing: '-0.04em', fontWeight: '600' }],
  'heading-lg': ['clamp(2.2rem, 4.6vw, 4.3rem)', { lineHeight: '1', letterSpacing: '-0.035em', fontWeight: '600' }],
  'heading-md': ['clamp(1.6rem, 2.6vw, 2.4rem)', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '600' }],
  'heading-sm': ['clamp(1.2rem, 1.8vw, 1.6rem)', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
  'body-lg': ['19px', { lineHeight: '1.5' }],
  body: ['16px', { lineHeight: '1.55' }],
  'body-sm': ['14px', { lineHeight: '1.5' }],
  caption: ['12px', { lineHeight: '1.4', letterSpacing: '0.02em' }],
}

export const borderRadius = {
  none: '0px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '28px',
  full: '999px',
} as const

export const boxShadow = {
  sm: '0 2px 8px rgba(58, 59, 31, 0.06)',
  md: '0 12px 24px rgba(58, 59, 31, 0.10)',
  lg: '0 24px 48px rgba(58, 59, 31, 0.16)',
  none: 'none',
} as const

export const maxWidth = {
  wrap: '1200px',
  content: '720px',
} as const

export const transitionTimingFunction = {
  forge: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const

/** Documented, not overridden — Tailwind's own default breakpoints. */
export const screens = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const
