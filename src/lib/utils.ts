import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { SourceRef } from '@/types/catalog'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number | null, locale = 'en'): string {
  if (value === null) return '—'
  return new Intl.NumberFormat(locale, { notation: value >= 10_000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value)
}

export function formatDate(value: string | null, locale = 'en', empty = 'No data'): string {
  if (!value) return empty
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value))
}

export function safeExternalUrl(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null
  } catch { return null }
}

export function safeIconPath(value: string): string | null {
  return /^\/data\/icons\/[a-z0-9-]+\.webp$/.test(value) ? value : null
}

export function sourceFileUrl(source: SourceRef): string | null {
  const repository = safeExternalUrl(source.repoUrl)
  if (!repository) return null
  try {
    const url = new URL(repository)
    if (url.hostname.toLowerCase() === 'github.com' && /^[a-f0-9]{40}$/.test(source.commitSha) && source.sourcePath !== '.') {
      const base = repository.replace(/\.git$/, '').replace(/\/$/, '')
      const encodedPath = source.sourcePath.split('/').map(encodeURIComponent).join('/')
      return `${base}/blob/${source.commitSha}/${encodedPath}`
    }
    return repository
  } catch { return null }
}
