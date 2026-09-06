import path from 'node:path'
import { defineConfig } from 'vitest/config'

/**
 * Minimal test runner config — this repo had no automated test suite
 * before docs/tools-cost-policy.md's enforcement tests
 * (lib/tools/__tests__/). Vitest is a zero-cost, open-source (MIT) dev
 * dependency — no API key, no paid tier, never shipped to the browser.
 *
 * Two aliases, test-only (production/`next build` use the real
 * resolution, tsconfig.json's own `paths` and the real `server-only`
 * package — this file has no effect there):
 * - `@/*` — mirrors tsconfig.json's path alias so a test can import the
 *   same way app code does, without a per-test relative-path dance.
 * - `server-only` — Next's `server-only` package throws unconditionally
 *   outside Next's own "react-server" webpack condition, which Vitest's
 *   plain-Node runner never sets. Aliased here to an empty module (see
 *   lib/tools/__tests__/server-only-stub.ts) purely so a server-only
 *   module's *logic* can be unit tested; it does not weaken the real
 *   guard `next build` still enforces.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'server-only': path.resolve(__dirname, 'lib/tools/__tests__/server-only-stub.ts'),
    },
  },
  test: {
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.next', 'legacy'],
  },
})
