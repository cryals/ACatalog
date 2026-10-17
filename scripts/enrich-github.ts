import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { CatalogPayload } from '../src/types/catalog.js'
import { dataRoot } from './lib.js'

interface CachedRepository { stars: number; forks: number; pushedAt: string; fetchedAt: string }

const catalog = JSON.parse(readFileSync(path.join(dataRoot, 'catalog', 'apps.json'), 'utf8')) as CatalogPayload
const cacheDirectory = path.join(dataRoot, 'cache')
const cachePath = path.join(cacheDirectory, 'github.json')
mkdirSync(cacheDirectory, { recursive: true })
const cache: Record<string, CachedRepository> = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : {}
const token = process.env.GITHUB_TOKEN
const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'ACatalog-importer' }
if (token) headers.Authorization = `Bearer ${token}`

const repositories = [...new Set(catalog.apps.map((app) => app.repositoryUrl).filter((url): url is string => Boolean(url && url.startsWith('https://github.com/'))))]
let fetched = 0
for (const repositoryUrl of repositories) {
  const key = repositoryUrl.toLowerCase()
  const existing = cache[key]
  if (existing && Date.now() - Date.parse(existing.fetchedAt) < 24 * 60 * 60 * 1000) continue
  const pathname = new URL(repositoryUrl).pathname.replace(/^\//, '')
  const response = await fetch(`https://api.github.com/repos/${pathname}`, { headers })
  if (response.status === 403 || response.status === 429) {
    console.warn('GitHub API rate limit reached; keeping the partial cache.')
    break
  }
  if (!response.ok) continue
  const body = await response.json() as { stargazers_count: number; forks_count: number; pushed_at: string }
  cache[key] = { stars: body.stargazers_count, forks: body.forks_count, pushedAt: body.pushed_at, fetchedAt: new Date().toISOString() }
  fetched += 1
  if (fetched % 10 === 0) writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`)
}
writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`)
console.log(`GitHub metadata cache: ${Object.keys(cache).length} repositories (${fetched} fetched now).`)
