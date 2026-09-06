import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'
import { colors, fontSize, borderRadius, boxShadow, maxWidth, transitionTimingFunction } from './lib/design-tokens'

/**
 * Forge design tokens.
 *
 * The actual values live in lib/design-tokens.ts (imported below) so that
 * app/design-system/page.tsx can render the real tokens without importing
 * this file (and its Tailwind plugin machinery). This file's job is only
 * to wire those values into Tailwind's theme.
 *
 * Colors are carried forward from legacy/index.html's :root custom
 * properties (the most complete of several slightly-divergent legacy
 * palettes — see docs/forge-business-rules.md) — a starting design token
 * set, not a confirmed final brand decision. Everything else (type scale,
 * radius, shadow, motion) is new for this rebuild, designed to read as
 * premium/confident/technical rather than a generic SaaS template — see
 * docs/decisions.md ADR-005.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx,mdx}', './components/**/*.{ts,tsx}', './content/**/*.{mdx,md}'],
  theme: {
    // Deliberately not using `extend` for colors/radius/shadow/fontSize —
    // Forge's palette and type scale are specific enough that inheriting
    // Tailwind's generic defaults (blue-500, rounded-md, shadow-md, the
    // default text-* scale) invites exactly the "looks AI-generated"
    // sameness the brief warns against. `spacing` and `screens` DO stay
    // at Tailwind's defaults — those scales are genuinely generic and fine.
    colors,
    fontFamily: {
      // var(--font-sans) etc. come from next/font/google in app/layout.tsx
      // (Inter/Fraunces/JetBrains Mono, self-hosted at build time) — the
      // literal family names alone never worked since nothing actually
      // loaded them; see the note in layout.tsx. Fallbacks unchanged.
      sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      serif: ['var(--font-serif)', 'ui-serif', 'Georgia', 'serif'],
      mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
    },
    fontSize,
    borderRadius,
    boxShadow,
    extend: {
      maxWidth,
      transitionTimingFunction,
      // screens (breakpoints) intentionally left at Tailwind's defaults —
      // sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536. Documented in
      // lib/design-tokens.ts `screens`, not overridden here.
    },
  },
  plugins: [typography],
}

export default config
