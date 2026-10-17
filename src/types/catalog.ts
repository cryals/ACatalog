export interface SourceRef {
  repoName: string
  repoUrl: string
  commitSha: string
  sourcePath: string
  importedAt: string
}

export interface ComposeRef {
  path: string
  content: string
  contentUrl?: string
  sourceRepo: string
}

export interface QualityInfo {
  completeness: number
  warnings: string[]
  verifiedAt: string | null
}

export interface CatalogApp {
  id: string
  slug: string
  name: string
  summary: string
  description: string
  categories: string[]
  tags: string[]
  aliases: string[]
  websiteUrl: string | null
  repositoryUrl: string | null
  installGuideUrl?: string | null
  license: string | null
  runtimes: string[]
  architectures: string[]
  githubStars: number | null
  githubForks: number | null
  lastPushedAt: string | null
  iconPath: string
  compose: ComposeRef | null
  provenance: SourceRef[]
  quality: QualityInfo
}

export interface CatalogPayload {
  version: number
  generatedAt: string
  sourceCount: number
  apps: CatalogApp[]
}

export type SortKey = 'relevance' | 'stars' | 'updated' | 'name'
