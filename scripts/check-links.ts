import { isIP } from 'node:net'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { CatalogPayload } from '../src/types/catalog.js'
import { dataRoot } from './lib.js'

const catalog = JSON.parse(readFileSync(path.join(dataRoot, 'catalog', 'apps.json'), 'utf8')) as CatalogPayload
const urls = [...new Set(catalog.apps.flatMap((app) => [app.websiteUrl, app.repositoryUrl]).filter((value): value is string => Boolean(value)))]
const limit = Number(process.env.LINK_CHECK_LIMIT ?? 0)
const queue = limit > 0 ? urls.slice(0, limit) : urls
const results: Array<{ url: string; ok: boolean; status: number | null; error?: string }> = []

function allowed(value: string): boolean {
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    if (!['http:', 'https:'].includes(url.protocol) || host === 'localhost' || host.endsWith('.local')) return false
    if (isIP(host) === 4 && /^(?:10\.|127\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(host)) return false
    if (isIP(host) === 6 && /^(?:::1|fe80:|fc|fd)/i.test(host)) return false
    return true
  } catch { return false }
}

async function check(url: string) {
  if (!allowed(url)) { results.push({ url, ok: false, status: null, error: 'URL is not public HTTP(S)' }); return }
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(10_000), headers: { 'User-Agent': 'ACatalog-link-checker/1.0' } })
    const ok = response.status >= 200 && response.status < 400
    results.push({ url, ok, status: response.status })
  } catch (error) {
    results.push({ url, ok: false, status: null, error: error instanceof Error ? error.message : 'Unknown error' })
  }
}

const workers = Array.from({ length: 12 }, async () => {
  while (queue.length) {
    const url = queue.shift()
    if (url) await check(url)
  }
})
await Promise.all(workers)
const report = { generatedAt: new Date().toISOString(), checked: results.length, passed: results.filter((item) => item.ok).length, failed: results.filter((item) => !item.ok).length, results }
mkdirSync(path.join(dataRoot, 'catalog'), { recursive: true })
writeFileSync(path.join(dataRoot, 'catalog', 'link-report.json'), `${JSON.stringify(report, null, 2)}\n`)
console.log(`Checked ${report.checked} links: ${report.passed} passed, ${report.failed} require review.`)
