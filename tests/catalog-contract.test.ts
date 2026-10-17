import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { CatalogPayload } from '@/types/catalog'

const payload = JSON.parse(readFileSync(path.resolve('data/catalog/apps.json'), 'utf8')) as CatalogPayload

describe('catalog contract', () => {
  it('contains unique stable routes and provenance for every record', () => {
    expect(payload.apps.length).toBeGreaterThan(1_000)
    expect(new Set(payload.apps.map((app) => app.slug)).size).toBe(payload.apps.length)
    for (const app of payload.apps) {
      expect(app.id).toMatch(/^[a-f0-9]{16}$/)
      expect(app.slug).toMatch(/^[a-z0-9-]+$/)
      expect(app.name.length).toBeGreaterThan(0)
      expect(app.provenance.length).toBeGreaterThan(0)
      expect(app.provenance[0]?.repoName).toBeTruthy()
      expect(app.provenance[0]?.commitSha).toMatch(/^[a-f0-9]{40}$/)
      expect(app.iconPath).toMatch(/^\/data\/icons\/[a-z0-9-]+\.webp$/)
    }
  })

  it('never represents unknown stars as zero', () => {
    expect(payload.apps.some((app) => app.githubStars === null)).toBe(true)
    expect(payload.apps.filter((app) => app.githubStars !== null).every((app) => (app.githubStars ?? -1) >= 0)).toBe(true)
  })

  it('only attaches Compose content with a source path', () => {
    for (const app of payload.apps.filter((item) => item.compose)) {
      expect(app.compose?.content).toContain('services')
      expect(app.compose?.path).toMatch(/\.ya?ml$/)
      expect(app.compose?.sourceRepo).toBeTruthy()
    }
  })
})
