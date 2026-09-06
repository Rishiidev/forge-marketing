import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'
import { fontSize } from './design-tokens'

/**
 * tailwind-merge doesn't know Forge's custom named type scale
 * (`text-body`, `text-heading-lg`, etc. — lib/design-tokens.ts). Its
 * default config can't tell those apart from a text *color* utility, so
 * without this it silently drops whichever `text-color` class
 * (`text-ground`, `text-ink`, ...) came first in a `cn()` call in favor
 * of the size class — e.g. `cn('text-ground', 'text-body')` collapsed to
 * just `text-body`, leaving text invisible on a dark background. This
 * registers the real type-scale keys under Tailwind's `font-size` group
 * so twMerge stops treating them as a text-color conflict. Found while
 * building the blog's ArticleCTA (Button `variant="onDark"` + `size="lg"`
 * hit exactly this).
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: Object.keys(fontSize) }],
    },
  },
})

/** Merge conditional class names, resolving Tailwind class conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Format a whole-rupee amount the way every legacy page does: ₹9,999. */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
