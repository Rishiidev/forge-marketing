#!/usr/bin/env node
/**
 * Captures a hero screenshot of every showcase's live site and writes
 * `featuredImage` into its frontmatter. Re-run any time a showcase's
 * site changes or a new showcase is added — existing featuredImage
 * paths are skipped unless --force is passed.
 *
 * Usage: node scripts/capture-showcase-screenshots.mjs [--force] [slug...]
 */
import { chromium } from 'playwright'
import matter from 'gray-matter'
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const CONTENT_DIR = path.join(process.cwd(), 'content/showcases')
const OUTPUT_DIR = path.join(process.cwd(), 'public/showcases')
const VIEWPORT = { width: 1280, height: 600 }

const args = process.argv.slice(2)
const force = args.includes('--force')
const onlySlugs = args.filter((a) => !a.startsWith('--'))

mkdirSync(OUTPUT_DIR, { recursive: true })

const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.mdx'))
const targets = files
  .map((file) => {
    const slug = file.replace(/\.mdx$/, '')
    const filePath = path.join(CONTENT_DIR, file)
    const raw = readFileSync(filePath, 'utf8')
    const parsed = matter(raw)
    return { slug, filePath, raw, parsed }
  })
  .filter((t) => onlySlugs.length === 0 || onlySlugs.includes(t.slug))
  .filter((t) => force || !t.parsed.data.featuredImage)
  .filter((t) => Boolean(t.parsed.data.websiteUrl))

if (targets.length === 0) {
  console.log('Nothing to capture — every showcase already has a featuredImage. Pass --force to recapture.')
  process.exit(0)
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: VIEWPORT })

for (const target of targets) {
  const { slug, filePath, parsed } = target
  const url = parsed.data.websiteUrl
  const outFile = `${slug}.png`
  const outPath = path.join(OUTPUT_DIR, outFile)

  process.stdout.write(`${slug} <- ${url} ... `)
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    await page.screenshot({ path: outPath })
    parsed.data.featuredImage = `/showcases/${outFile}`
    const updated = matter.stringify(parsed.content, parsed.data)
    writeFileSync(filePath, updated)
    console.log('ok')
  } catch (err) {
    console.log(`FAILED (${err.message.split('\n')[0]})`)
  }
}

await browser.close()
