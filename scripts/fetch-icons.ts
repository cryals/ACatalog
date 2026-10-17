import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { isIP } from 'node:net'
import path from 'node:path'
import sharp from 'sharp'
import type { CatalogPayload } from '../src/types/catalog.js'
import { dataRoot, slugify } from './lib.js'

interface IconManifestEntry { file: string; sourceUrl: string; sourceType: 'favicon' | 'github-avatar' | 'generated' | 'manual'; fetchedAt: string; licenseNote: string }

const catalog = JSON.parse(readFileSync(path.join(dataRoot, 'catalog', 'apps.json'), 'utf8')) as CatalogPayload
const iconDirectory = path.join(dataRoot, 'icons')
const manifestPath = path.join(iconDirectory, 'manifest.json')
mkdirSync(iconDirectory, { recursive: true })
const manifest: Record<string, IconManifestEntry> = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {}
const manualDirectory = path.join(dataRoot, 'overrides', 'icons')
const manualNotesPath = path.join(dataRoot, 'overrides', 'icons.json')
const manualNotes = existsSync(manualNotesPath) ? JSON.parse(readFileSync(manualNotesPath, 'utf8')) as Record<string, { sourceUrl?: string; licenseNote: string }> : {}
for (const entry of Object.values(manifest)) entry.licenseNote ||= 'Upstream icon or generated fallback; verify trademark terms before redistribution.'

function isPublicHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) return false
    const host = url.hostname.toLowerCase()
    if (host === 'localhost' || host.endsWith('.local')) return false
    if (isIP(host) === 4 && /^(?:10\.|127\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(host)) return false
    if (isIP(host) === 6 && /^(?:::1|fe80:|fc|fd)/i.test(host)) return false
    return true
  } catch { return false }
}

async function safeFetch(url: string): Promise<Response | null> {
  let current = url
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    if (!isPublicHttpUrl(current)) return null
    const response = await fetch(current, { signal: AbortSignal.timeout(8_000), headers: { 'User-Agent': 'ACatalog-icon-fetcher/1.0' }, redirect: 'manual' })
    if (response.status < 300 || response.status >= 400) return response
    const location = response.headers.get('location')
    if (!location) return null
    current = new URL(location, current).toString()
  }
  return null
}

async function fetchBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await safeFetch(url)
    if (!response) return null
    if (!response.ok) return null
    const type = response.headers.get('content-type') ?? ''
    if (!type.startsWith('image/') && !url.endsWith('.ico')) return null
    const buffer = Buffer.from(await response.arrayBuffer())
    return buffer.length <= 5_000_000 ? buffer : null
  } catch { return null }
}

async function discoverFavicon(websiteUrl: string): Promise<string | null> {
  try {
    const response = await safeFetch(websiteUrl)
    if (!response?.ok || !(response.headers.get('content-type') ?? '').includes('text/html')) return null
    const html = (await response.text()).slice(0, 500_000)
    for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
      const rel = tag.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1] ?? ''
      const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1]
      if (href && /(?:^|\s)(?:shortcut\s+)?icon(?:\s|$)/i.test(rel)) return new URL(href, websiteUrl).toString()
    }
  } catch { /* use conventional favicon fallback */ }
  return null
}

function monogramSvg(name: string): Buffer {
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'A'
  const hue = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360
  return Buffer.from(`<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" rx="112" fill="hsl(${hue} 42% 28%)"/><text x="256" y="286" text-anchor="middle" font-family="Arial, sans-serif" font-size="176" font-weight="700" fill="#fff">${initials.replace(/[&<>]/g, '')}</text></svg>`)
}

async function processApp(app: CatalogPayload['apps'][number]) {
  const slug = slugify(app.slug)
  const target = path.join(iconDirectory, `${slug}.webp`)
  const manual = path.join(manualDirectory, `${slug}.webp`)
  if (existsSync(manual)) {
    const metadata = await sharp(manual).metadata()
    if (metadata.format !== 'webp' || metadata.width !== 512 || metadata.height !== 512) throw new Error(`${slug}: manual icon must be WebP 512x512`)
    copyFileSync(manual, target)
    manifest[slug] = { file: `data/icons/${slug}.webp`, sourceUrl: manualNotes[slug]?.sourceUrl ?? 'manual:override', sourceType: 'manual', fetchedAt: new Date().toISOString(), licenseNote: manualNotes[slug]?.licenseNote ?? 'Manual override; license review required.' }
    return
  }
  if (existsSync(target) && manifest[slug]) return
  const candidates: Array<{ url: string; type: IconManifestEntry['sourceType'] }> = []
  if (app.websiteUrl) {
    const origin = new URL(app.websiteUrl).origin
    const discovered = await discoverFavicon(app.websiteUrl)
    if (discovered) candidates.push({ url: discovered, type: 'favicon' })
    candidates.push({ url: `${origin}/favicon.ico`, type: 'favicon' })
  }
  if (app.repositoryUrl?.startsWith('https://github.com/')) {
    const owner = new URL(app.repositoryUrl).pathname.split('/').filter(Boolean)[0]
    if (owner) candidates.push({ url: `https://github.com/${owner}.png?size=512`, type: 'github-avatar' })
  }
  for (const candidate of candidates) {
    const buffer = await fetchBuffer(candidate.url)
    if (!buffer) continue
    try {
      const metadata = await sharp(buffer, { animated: false }).metadata()
      if ((metadata.width ?? 0) < 32 || (metadata.height ?? 0) < 32) continue
      await sharp(buffer, { animated: false }).resize(512, 512, { fit: 'contain', background: { r: 244, g: 246, b: 248, alpha: 1 } }).webp({ quality: 88 }).toFile(target)
      manifest[slug] = { file: `data/icons/${slug}.webp`, sourceUrl: candidate.url, sourceType: candidate.type, fetchedAt: new Date().toISOString(), licenseNote: 'Upstream project icon; verify trademark and redistribution terms.' }
      return
    } catch { /* try next source */ }
  }
  await sharp(monogramSvg(app.name)).webp({ quality: 88 }).toFile(target)
  manifest[slug] = { file: `data/icons/${slug}.webp`, sourceUrl: 'generated:monogram', sourceType: 'generated', fetchedAt: new Date().toISOString(), licenseNote: 'Generated by ACatalog from the application name.' }
}

const pending = [...catalog.apps]
const workers = Array.from({ length: 8 }, async () => {
  while (pending.length) {
    const app = pending.shift()
    if (app) await processApp(app)
  }
})
await Promise.all(workers)
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`Prepared ${Object.keys(manifest).length} WebP icons.`)
