/**
 * Test-only stand-in for the `server-only` package.
 *
 * `server-only` throws unconditionally unless imported under Next.js's
 * "react-server" webpack condition — Vitest runs plain Node, so it hits
 * that throw on any file that does `import 'server-only'` (lib/tools/
 * security.ts, lib/tools/cache.ts, lib/file-store.ts, lib/crm.ts, etc.).
 * vitest.config.ts aliases the real package to this empty module for
 * tests only — production and `next build` still use the real one
 * unchanged, so a server-only module genuinely imported from a Client
 * Component still fails the real build the way it should.
 */
export {}
