/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production'

// 'unsafe-eval' is required in development only — Next.js's webpack dev
// runtime (React Refresh / HMR) evaluates code via eval(). Without this,
// the CSP silently breaks all client-side JS in `next dev` (forms,
// navigation, everything) while looking fine in a static screenshot.
// Production builds don't need it.
const scriptSrc = isDev ? "'self' 'unsafe-inline' 'unsafe-eval'" : "'self' 'unsafe-inline'"

const securityHeaders = [
  // Adapted from legacy/vercel.json. connect-src is intentionally scoped to
  // 'self' only for now — the CRM/analytics providers are pluggable
  // (lib/crm.ts, lib/analytics.ts) and none is wired to a real external
  // vendor yet. Add the vendor's domain here when one is configured.
  {
    key: 'Content-Security-Policy',
    value: `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'`,
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
]

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

export default nextConfig
