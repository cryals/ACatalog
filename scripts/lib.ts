import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { CatalogApp, SourceRef } from '../src/types/catalog.js'

export const projectRoot = path.resolve(import.meta.dirname, '..')
export const rawRoot = path.join(projectRoot, 'raw')
export const dataRoot = path.join(projectRoot, 'data')

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function stableId(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16)
}

export function readText(filePath: string): string {
  return readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')
}

export function safeGit(repoPath: string, args: string[]): string {
  try {
    return execFileSync('git', ['-C', repoPath, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}

const gitMetadata = new Map<string, { repoUrl: string; commitSha: string }>()

export function getSourceRef(repoName: string, sourcePath: string, importedAt: string): SourceRef {
  const repoPath = path.join(rawRoot, repoName)
  let metadata = gitMetadata.get(repoName)
  if (!metadata) {
    metadata = {
      repoUrl: safeGit(repoPath, ['remote', 'get-url', 'origin']),
      commitSha: safeGit(repoPath, ['rev-parse', 'HEAD']),
    }
    gitMetadata.set(repoName, metadata)
  }
  return {
    repoName,
    repoUrl: metadata.repoUrl,
    commitSha: metadata.commitSha,
    sourcePath: sourcePath.replaceAll('\\', '/'),
    importedAt,
  }
}

export function cleanUrl(value: string | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim().replace(/[),.;]+$/, '')
  try {
    const url = new URL(trimmed)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    url.hash = ''
    return url.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

export function normalizeRepositoryUrl(value: string | null): string | null {
  if (!value) return null
  const url = cleanUrl(value)
  if (!url) return null
  const parsed = new URL(url)
  if (parsed.hostname.toLowerCase() !== 'github.com') return url
  const parts = parsed.pathname.split('/').filter(Boolean).slice(0, 2)
  if (parts.length !== 2) return url
  return `https://github.com/${parts[0]}/${parts[1].replace(/\.git$/i, '')}`
}

export function extractUrls(text: string): string[] {
  return [...text.matchAll(/https?:\/\/[^\s<>"')\]]+/g)]
    .map((match) => cleanUrl(match[0]))
    .filter((url): url is string => Boolean(url))
}

export function guessRepository(urls: string[]): string | null {
  const github = urls.find((url) => {
    try {
      const parsed = new URL(url)
      return parsed.hostname === 'github.com' && parsed.pathname.split('/').filter(Boolean).length >= 2
    } catch { return false }
  })
  return normalizeRepositoryUrl(github ?? null)
}

export function appCompleteness(app: Pick<CatalogApp, 'summary' | 'websiteUrl' | 'repositoryUrl' | 'license' | 'compose' | 'iconPath'>): number {
  const checks = [app.summary.length > 12, Boolean(app.websiteUrl), Boolean(app.repositoryUrl), Boolean(app.license), Boolean(app.compose), !app.iconPath.endsWith('/fallback.webp')]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

export function fileExists(...parts: string[]): boolean {
  return existsSync(path.join(...parts))
}
