import { describe, expect, it } from 'vitest'
import { validateUrlForFetch } from '../security'

/**
 * SSRF-safety tests for docs/tool-security.md / docs/tools-cost-policy.md
 * §H. Deliberately scoped to inputs validateUrlForFetch() can judge
 * without a real network call — literal IPs (checked directly, no DNS)
 * and string-level rejections (scheme/length/hostname). Hostname→DNS
 * resolution (the rebinding-resistant path) is exercised by these same
 * code paths but isn't re-tested against a live resolver here, to keep
 * this suite hermetic and fast — see lib/tools/security.ts for the
 * resolution logic itself.
 */

describe('validateUrlForFetch — protocol and shape', () => {
  it('rejects an unsupported protocol', async () => {
    for (const url of ['file:///etc/passwd', 'ftp://example.com/file', 'gopher://example.com', 'data:text/html,hi']) {
      const result = await validateUrlForFetch(url)
      expect(result.ok, url).toBe(false)
    }
  })

  it('rejects a malformed URL', async () => {
    const result = await validateUrlForFetch('not a url at all')
    expect(result.ok).toBe(false)
  })

  it('rejects an excessively long URL', async () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(3000)
    const result = await validateUrlForFetch(longUrl)
    expect(result.ok).toBe(false)
  })

  it('rejects an empty URL', async () => {
    const result = await validateUrlForFetch('')
    expect(result.ok).toBe(false)
  })
})

describe('validateUrlForFetch — hostname denylist', () => {
  it('rejects localhost', async () => {
    expect((await validateUrlForFetch('http://localhost/')).ok).toBe(false)
    expect((await validateUrlForFetch('http://localhost:3000/')).ok).toBe(false)
  })

  it('rejects internal-looking TLD suffixes', async () => {
    for (const host of ['http://myserver.local/', 'http://api.internal/', 'http://box.lan/', 'http://router.home/']) {
      expect((await validateUrlForFetch(host)).ok, host).toBe(false)
    }
  })

  it('rejects the cloud metadata hostname', async () => {
    expect((await validateUrlForFetch('http://metadata.google.internal/')).ok).toBe(false)
  })

  it('rejects a single-label hostname', async () => {
    expect((await validateUrlForFetch('http://internal-server/')).ok).toBe(false)
  })
})

describe('validateUrlForFetch — IPv4 literal ranges', () => {
  const disallowed = [
    '127.0.0.1', // loopback
    '10.0.0.5', // private
    '172.16.0.1', // private
    '172.31.255.255', // private, upper bound
    '192.168.1.1', // private
    '169.254.169.254', // link-local / cloud metadata
    '169.254.0.1', // link-local
    '0.0.0.0', // "this network"
    '100.64.0.1', // carrier-grade NAT
    '192.0.2.1', // TEST-NET-1
    '198.51.100.1', // TEST-NET-2
    '203.0.113.1', // TEST-NET-3
    '224.0.0.1', // multicast
    '255.255.255.255', // broadcast
  ]

  for (const ip of disallowed) {
    it(`rejects ${ip}`, async () => {
      const result = await validateUrlForFetch(`http://${ip}/`)
      expect(result.ok).toBe(false)
    })
  }

  it('allows a real public IPv4 address', async () => {
    const result = await validateUrlForFetch('http://8.8.8.8/')
    expect(result.ok).toBe(true)
  })

  it('does not false-positive 172.15.x.x or 172.32.x.x (just outside the private /12)', async () => {
    expect((await validateUrlForFetch('http://172.15.0.1/')).ok).toBe(true)
    expect((await validateUrlForFetch('http://172.32.0.1/')).ok).toBe(true)
  })
})

describe('validateUrlForFetch — IPv6 literal ranges', () => {
  it('rejects the IPv6 loopback', async () => {
    expect((await validateUrlForFetch('http://[::1]/')).ok).toBe(false)
  })

  it('rejects IPv6 link-local', async () => {
    expect((await validateUrlForFetch('http://[fe80::1]/')).ok).toBe(false)
  })

  it('rejects IPv6 unique-local ("private")', async () => {
    expect((await validateUrlForFetch('http://[fc00::1]/')).ok).toBe(false)
    expect((await validateUrlForFetch('http://[fd12:3456:789a::1]/')).ok).toBe(false)
  })

  it('rejects an IPv4-mapped IPv6 address whose embedded IPv4 is private', async () => {
    expect((await validateUrlForFetch('http://[::ffff:127.0.0.1]/')).ok).toBe(false)
  })

  it('allows a real public IPv6 address', async () => {
    // Google public DNS, IPv6.
    const result = await validateUrlForFetch('http://[2001:4860:4860::8888]/')
    expect(result.ok).toBe(true)
  })
})
