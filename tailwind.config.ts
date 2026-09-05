import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

// Palette carried forward from legacy/index.html's :root custom properties
// (the most complete of the several slightly-divergent palettes found in
// the baseline — see docs/forge-business-rules.md). Treat this as a
// starting design token set, not a final brand decision.
const config: Config = {
  content: ['./app/**/*.{ts,tsx,mdx}', './components/**/*.{ts,tsx}', './content/**/*.{mdx,md}'],
  theme: {
    extend: {
      colors: {
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
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        wrap: '1200px',
      },
    },
  },
  plugins: [typography],
}

export default config
