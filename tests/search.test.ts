import { describe, expect, it } from 'vitest'
import { filterAndSortApps } from '@/lib/search'
import type { CatalogApp } from '@/types/catalog'

function app(overrides: Partial<CatalogApp>): CatalogApp {
  return {
    id: '1', slug: 'demo', name: 'Demo', summary: 'Self-hosted demo', description: 'Description', categories: ['Tools'], tags: ['Docker'], aliases: [], websiteUrl: null, repositoryUrl: null, license: 'MIT', runtimes: ['Docker'], architectures: [], githubStars: null, githubForks: null, lastPushedAt: null, iconPath: '/data/icons/demo.webp', compose: null, provenance: [], quality: { completeness: 50, warnings: [], verifiedAt: null }, ...overrides,
  }
}

const apps = [
  app({ id: '1', slug: 'immich', name: 'Immich', summary: 'Photo and video backup', categories: ['Photo Galleries'], githubStars: 50000, compose: { path: 'immich.yml', content: 'services: {}', sourceRepo: 'source' } }),
  app({ id: '2', slug: 'paperless', name: 'Paperless-ngx', summary: 'Document management and OCR', categories: ['Document Management'], githubStars: 20000 }),
  app({ id: '3', slug: 'vaultwarden', name: 'Vaultwarden', summary: 'Password manager', categories: ['Password Managers'], githubStars: 40000 }),
]

describe('catalog search', () => {
  it('finds by description and keeps the relevant result first', () => {
    const result = filterAndSortApps(apps, { query: 'photo backup', category: '', license: '', architecture: '', composeOnly: false, sort: 'relevance' })
    expect(result.map((item) => item.slug)).toEqual(['immich'])
  })

  it('filters Compose entries', () => {
    const result = filterAndSortApps(apps, { query: '', category: '', license: '', architecture: '', composeOnly: true, sort: 'name' })
    expect(result).toHaveLength(1)
    expect(result[0]?.slug).toBe('immich')
  })

  it('sorts missing stars after known values', () => {
    const result = filterAndSortApps([...apps, app({ id: '4', slug: 'unknown', name: 'Unknown' })], { query: '', category: '', license: '', architecture: '', composeOnly: false, sort: 'stars' })
    expect(result.at(-1)?.slug).toBe('unknown')
  })
})
