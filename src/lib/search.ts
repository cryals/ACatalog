import type { CatalogApp, SortKey } from '@/types/catalog'

export interface CatalogFilters {
  query: string
  category: string
  license: string
  architecture: string
  composeOnly: boolean
  sort: SortKey
}

function normalize(value: string): string {
  return value.normalize('NFKD').toLocaleLowerCase('ru-RU').replace(/[^a-zа-яё0-9+.-]+/gi, ' ').trim()
}

function distanceWithinTwo(left: string, right: string): boolean {
  if (Math.abs(left.length - right.length) > 2) return false
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i]
    let rowMinimum = i
    for (let j = 1; j <= right.length; j += 1) {
      const value = Math.min(
        (current[j - 1] ?? 0) + 1,
        (previous[j] ?? 0) + 1,
        (previous[j - 1] ?? 0) + (left[i - 1] === right[j - 1] ? 0 : 1),
      )
      current[j] = value
      rowMinimum = Math.min(rowMinimum, value)
    }
    if (rowMinimum > 2) return false
    previous.splice(0, previous.length, ...current)
  }
  return (previous[right.length] ?? 3) <= 2
}

function searchScore(app: CatalogApp, tokens: string[]): number {
  if (!tokens.length) return 0
  const name = normalize(app.name)
  const aliases = normalize(app.aliases.join(' '))
  const categories = normalize(app.categories.join(' '))
  const tags = normalize(app.tags.join(' '))
  const body = normalize(`${app.summary} ${app.description}`)
  const nameWords = name.split(' ')
  let score = 0
  for (const token of tokens) {
    if (name === token) score += 18
    else if (name.startsWith(token)) score += 12
    else if (name.includes(token)) score += 9
    else if (aliases.includes(token)) score += 7
    else if (categories.includes(token)) score += 5
    else if (tags.includes(token)) score += 3
    else if (body.includes(token)) score += 1
    else if (token.length >= 4 && nameWords.some((word) => distanceWithinTwo(token, word))) score += 2
    else return -1
  }
  return score
}

export function filterAndSortApps(apps: CatalogApp[], filters: CatalogFilters): CatalogApp[] {
  const tokens = normalize(filters.query).split(' ').filter(Boolean)
  const candidates = apps.flatMap((app) => {
    if (filters.category && !app.categories.includes(filters.category)) return []
    if (filters.license && app.license !== filters.license) return []
    if (filters.architecture && !app.architectures.includes(filters.architecture)) return []
    if (filters.composeOnly && !app.compose) return []
    const score = searchScore(app, tokens)
    return score >= 0 ? [{ app, score }] : []
  })
  const dateValue = (value: string | null) => value ? Date.parse(value) : 0
  candidates.sort((left, right) => {
    if (filters.sort === 'stars') return (right.app.githubStars ?? -1) - (left.app.githubStars ?? -1) || left.app.name.localeCompare(right.app.name)
    if (filters.sort === 'updated') return dateValue(right.app.lastPushedAt) - dateValue(left.app.lastPushedAt) || left.app.name.localeCompare(right.app.name)
    if (filters.sort === 'name') return left.app.name.localeCompare(right.app.name)
    return right.score - left.score || (right.app.githubStars ?? -1) - (left.app.githubStars ?? -1) || left.app.name.localeCompare(right.app.name)
  })
  return candidates.map(({ app }) => app)
}
