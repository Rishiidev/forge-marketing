import { defineConfig } from 'vitest/config'

/**
 * Minimal test runner config — this repo had no automated test suite
 * before docs/tools-cost-policy.md's enforcement tests
 * (lib/tools/__tests__/). Vitest is a zero-cost, open-source (MIT) dev
 * dependency — no API key, no paid tier, never shipped to the browser.
 * Tests use plain relative imports rather than the `@/*` path alias, so
 * no extra plugin is needed to resolve it here.
 */
export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.next', 'legacy'],
  },
})
