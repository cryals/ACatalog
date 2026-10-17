import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { CatalogApp, CatalogPayload, ComposeRef } from '../src/types/catalog.js'
import { appCompleteness, cleanUrl, dataRoot, extractUrls, getSourceRef, guessRepository, normalizeRepositoryUrl, projectRoot, rawRoot, readText, slugify, stableId } from './lib.js'

const importedAt = process.env.SOURCE_DATE_EPOCH ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString() : new Date().toISOString()
const apps = new Map<string, CatalogApp>()
const previousCatalogPath = path.join(dataRoot, 'catalog', 'apps.json')
const previousCatalog = existsSync(previousCatalogPath)
  ? JSON.parse(readFileSync(previousCatalogPath, 'utf8')) as CatalogPayload
  : null
const previousAppsById = new Map(previousCatalog?.apps.map((app) => [app.id, app]) ?? [])
const composeMappingsPath = path.join(dataRoot, 'overrides', 'compose-mappings.json')
const composeMappings = existsSync(composeMappingsPath) ? JSON.parse(readFileSync(composeMappingsPath, 'utf8')) as Record<string, string> : {}

function repositoryKey(repositoryUrl: string | null, slug: string): string {
  return repositoryUrl?.toLowerCase() ?? slug
}

function inferRuntime(tokens: string[]): string[] {
  const joined = ` ${tokens.join(' ').toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ')} `
  const patterns: Array<[string, RegExp]> = [
    ['Docker', /\bdocker\b/], ['K8S', /\b(?:k8s|kubernetes)\b/], ['Nodejs', /\bnode(?:\.?js)?\b/],
    ['Python', /\bpython\b/], ['Go', /\b(?:go|golang)\b/], ['Rust', /\brust\b/], ['PHP', /\bphp\b/],
    ['Java', /\bjava\b/], ['Ruby', /\bruby\b/], ['Elixir', /\belixir\b/], ['C++', /(?:^|\s)c\+\+(?:\s|$)/],
    ['C', /(?:^|\s)c(?:\s|$)/], ['deb', /\bdeb(?:ian)?\b/],
  ]
  return patterns.filter(([, pattern]) => pattern.test(joined)).map(([name]) => name)
}

function inferArchitectures(tokens: string[]): string[] {
  const joined = tokens.join(' ').toLowerCase()
  const architectures: string[] = []
  if (/\b(?:linux\/)?(?:amd64|x86[_-]?64)\b/.test(joined)) architectures.push('amd64')
  if (/\b(?:linux\/)?(?:arm64|aarch64)\b/.test(joined)) architectures.push('arm64')
  if (/\b(?:linux\/)?(?:armv7|armhf|arm\/v7)\b/.test(joined)) architectures.push('arm/v7')
  if (/\b(?:386|i[3-6]86)\b/.test(joined)) architectures.push('386')
  return architectures
}

function addOrMerge(app: CatalogApp) {
  const key = repositoryKey(app.repositoryUrl, app.slug)
  const existing = apps.get(key)
  if (!existing) { apps.set(key, app); return }
  existing.categories = [...new Set([...existing.categories, ...app.categories])]
  existing.tags = [...new Set([...existing.tags, ...app.tags])]
  existing.aliases = [...new Set([...existing.aliases, ...app.aliases])]
  existing.runtimes = [...new Set([...existing.runtimes, ...app.runtimes])]
  existing.architectures = [...new Set([...existing.architectures, ...app.architectures])]
  existing.websiteUrl ||= app.websiteUrl
  existing.repositoryUrl ||= app.repositoryUrl
  existing.installGuideUrl ||= app.installGuideUrl
  existing.license ||= app.license
  existing.compose ||= app.compose
  existing.provenance.push(...app.provenance)
  existing.quality.warnings = [...new Set([...existing.quality.warnings, ...app.quality.warnings])]
}

function parseAwesomeSelfhosted() {
  const repoName = 'awesome-selfhosted'
  const sourcePath = 'README.md'
  const lines = readText(path.join(rawRoot, repoName, sourcePath)).split(/\r?\n/)
  let category = 'Другое'
  for (const line of lines) {
    const heading = line.match(/^###\s+(.+)$/)
    if (heading) { category = heading[1].replace(/\s*\([^)]*\)\s*$/, '').trim(); continue }
    if (!line.startsWith('- [')) continue
    const firstLink = line.match(/^- \[([^\]]+)]\((https?:\/\/[^)]+)\)/)
    if (!firstLink) continue
    const name = firstLink[1].replace(/\s+⚠$/, '').trim()
    const primaryUrl = cleanUrl(firstLink[2])
    const sourceMatch = line.match(/\(\[Source Code]\((https?:\/\/[^)]+)\)\)/i)
    const documentationMatch = line.match(/\[Documentation]\((https?:\/\/[^)]+)\)/i)
    const allUrls = extractUrls(line)
    const repositoryUrl = normalizeRepositoryUrl(sourceMatch?.[1] ?? guessRepository(allUrls))
    const descriptionPart = line.replace(/^- \[[^\]]+\]\([^)]+\)\s*(?:`⚠`)?\s*-\s*/, '')
    const summary = descriptionPart.split(/\s+\(\[(?:Source Code|Demo|Clients|Documentation|App Store|Google Play)[^\n]*$/i)[0]?.replace(/\s+`[^`]+`\s*$/, '').trim() || `${name} — self-hosted приложение.`
    const metadata = [...line.matchAll(/`([^`]+)`/g)].flatMap((match) => match[1].split('/')).map((item) => item.trim())
    const license = metadata.find((item) => /^(?:AGPL|GPL|MIT|Apache|BSD|MPL|EUPL|ISC|LGPL|CC|Unlicense|Zlib)/i.test(item)) ?? null
    const slug = slugify(name)
    const warnings: string[] = []
    if (!repositoryUrl) warnings.push('repository_missing')
    addOrMerge({
      id: stableId(repositoryUrl ?? `awesome-selfhosted:${slug}`), slug, name,
      summary, description: summary, categories: [category], tags: metadata.filter((item) => item !== license), aliases: [],
      websiteUrl: primaryUrl, repositoryUrl, installGuideUrl: cleanUrl(documentationMatch?.[1]) ?? (repositoryUrl ? `${repositoryUrl}#readme` : primaryUrl), license, runtimes: inferRuntime(metadata), architectures: inferArchitectures([line, ...metadata]),
      githubStars: null, githubForks: null, lastPushedAt: null,
      iconPath: `/data/icons/${slug}.webp`, compose: null,
      provenance: [getSourceRef(repoName, sourcePath, importedAt)],
      quality: { completeness: 0, warnings, verifiedAt: null },
    })
  }
}

function parseComposeExamples() {
  const repoName = 'Compose-Examples'
  const examplesRoot = path.join(rawRoot, repoName, 'examples')
  for (const entry of readdirSync(examplesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const sourceDirectory = path.join(examplesRoot, entry.name)
    const composeName = readdirSync(sourceDirectory).find((name) => /^(?:docker-)?compose(?:-[\w.-]+)?\.ya?ml$/i.test(name))
    if (!composeName) continue
    const readmePath = path.join(sourceDirectory, 'README.md')
    const readme = existsSync(readmePath) ? readText(readmePath) : ''
    const urls = extractUrls(readme)
    const repositoryUrl = guessRepository(urls)
    const slug = slugify(entry.name)
    const composeRelative = path.posix.join('examples', entry.name, composeName)
    const compose: ComposeRef = { path: composeRelative, content: readText(path.join(sourceDirectory, composeName)), sourceRepo: repoName }
    const candidate = [...apps.values()].find((item) => item.slug === slug || (repositoryUrl && item.repositoryUrl?.toLowerCase() === repositoryUrl.toLowerCase()))
    if (candidate) {
      candidate.compose = compose
      candidate.provenance.push(getSourceRef(repoName, composeRelative, importedAt))
      if (!candidate.repositoryUrl) candidate.repositoryUrl = repositoryUrl
      if (!candidate.websiteUrl) candidate.websiteUrl = urls.find((url) => url !== repositoryUrl) ?? repositoryUrl
      continue
    }
    const name = entry.name.split('-').map((part) => part.length <= 3 ? part.toUpperCase() : part[0]?.toUpperCase() + part.slice(1)).join(' ')
    addOrMerge({
      id: stableId(repositoryUrl ?? `compose-examples:${slug}`), slug, name,
      summary: `Готовый Docker Compose для самостоятельного запуска ${name}.`,
      description: `Проверяемый пример конфигурации Docker Compose из коллекции ${repoName}.`,
      categories: ['Docker Compose'], tags: ['Docker', 'Compose'], aliases: [entry.name],
      websiteUrl: urls.find((url) => url !== repositoryUrl) ?? repositoryUrl, repositoryUrl, installGuideUrl: repositoryUrl ? `${repositoryUrl}#readme` : null, license: null,
      runtimes: ['Docker'], architectures: [], githubStars: null, githubForks: null, lastPushedAt: null,
      iconPath: `/data/icons/${slug}.webp`, compose,
      provenance: [getSourceRef(repoName, composeRelative, importedAt)],
      quality: { completeness: 0, warnings: repositoryUrl ? [] : ['repository_missing'], verifiedAt: null },
    })
  }
}

function parseMarkdownTables(repoName: string) {
  const sourcePath = 'README.md'
  const lines = readText(path.join(rawRoot, repoName, sourcePath)).split(/\r?\n/)
  let category = 'Docker'
  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)$/)
    if (heading) { category = heading[1].replace(/<!--.*?-->/g, '').trim(); continue }
    const row = line.match(/^\|\s*\[([^\]]+)]\((https?:\/\/[^)]+)\)\s*\|\s*([^|]+)\|/)
    if (!row || /^Project$/i.test(row[1])) continue
    const name = row[1].trim()
    const repositoryUrl = normalizeRepositoryUrl(row[2])
    const summary = row[3].trim().replace(/\s+/g, ' ').replace(/[.]$/, '')
    const slug = slugify(name)
    addOrMerge({
      id: stableId(repositoryUrl ?? `${repoName}:${slug}`), slug, name,
      summary: summary || `${name} — Docker-совместимый self-hosted проект.`, description: summary,
      categories: [category], tags: ['Docker'], aliases: [], websiteUrl: repositoryUrl, repositoryUrl, installGuideUrl: repositoryUrl ? `${repositoryUrl}#readme` : null,
      license: null, runtimes: ['Docker'], architectures: [], githubStars: null, githubForks: null, lastPushedAt: null,
      iconPath: `/data/icons/${slug}.webp`, compose: null,
      provenance: [getSourceRef(repoName, sourcePath, importedAt)],
      quality: { completeness: 0, warnings: repositoryUrl ? [] : ['repository_missing'], verifiedAt: null },
    })
  }
}

function parseAwesomeDocker() {
  const repoName = 'awesome-docker'
  const sourcePath = 'README.md'
  const lines = readText(path.join(rawRoot, repoName, sourcePath)).split(/\r?\n/)
  let category = 'Docker'
  let inProjects = false
  for (const line of lines) {
    if (/^# Projects\b/.test(line)) { inProjects = true; continue }
    if (/^# Learning Resources\b/.test(line)) break
    if (!inProjects) continue
    const heading = line.match(/^#{2,3}\s+(.+)$/)
    if (heading) { category = heading[1].replace(/<!--.*?-->/g, '').trim(); continue }
    const item = line.match(/^- \[([^\]]+)]\((https?:\/\/[^)]+)\)(?:\s*-?\s*(.*))?$/)
    if (!item) continue
    const name = item[1].trim()
    const repositoryUrl = normalizeRepositoryUrl(item[2])
    const summary = item[3]?.trim().replace(/[.]$/, '') || `${name} — инструмент экосистемы Docker.`
    const slug = slugify(name)
    addOrMerge({
      id: stableId(repositoryUrl ?? `${repoName}:${slug}`), slug, name,
      summary, description: summary, categories: [`Docker · ${category}`], tags: ['Docker'], aliases: [],
      websiteUrl: repositoryUrl, repositoryUrl, installGuideUrl: repositoryUrl ? `${repositoryUrl}#readme` : null, license: null, runtimes: ['Docker'], architectures: [],
      githubStars: null, githubForks: null, lastPushedAt: null, iconPath: `/data/icons/${slug}.webp`, compose: null,
      provenance: [getSourceRef(repoName, sourcePath, importedAt)],
      quality: { completeness: 0, warnings: repositoryUrl ? [] : ['repository_missing'], verifiedAt: null },
    })
  }
}

function attachAwesomeCompose() {
  for (const repoName of ['awesome-compose', 'awesome-compose1']) {
    const repoPath = path.join(rawRoot, repoName)
    for (const entry of readdirSync(repoPath, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue
      const directory = path.join(repoPath, entry.name)
      const composeName = readdirSync(directory).find((name) => /^(?:docker-)?compose\.ya?ml$/i.test(name))
      if (!composeName) continue
      const tokens = slugify(entry.name).split('-')
      const mappedId = composeMappings[`${repoName}/${entry.name}`]
      const mappedCandidate = mappedId
        ? [...apps.values()].find((item) => item.id === mappedId)
        : [...apps.values()].find((item) => tokens.includes(item.slug) || item.aliases.some((alias) => slugify(alias) === slugify(entry.name)))
      const composeRelative = path.posix.join(entry.name, composeName)
      const compose: ComposeRef = { path: composeRelative, content: readText(path.join(directory, composeName)), sourceRepo: repoName }
      const readmeName = readdirSync(directory).find((name) => /^readme\.md$/i.test(name))
      const readmeRelative = readmeName ? path.posix.join(entry.name, readmeName) : composeRelative
      const readme = readmeName ? readText(path.join(directory, readmeName)) : ''
      const urls = extractUrls(readme)
      const repositoryUrl = normalizeRepositoryUrl(guessRepository(urls))
      const source = getSourceRef(repoName, composeRelative, importedAt)
      const installGuideUrl = `${source.repoUrl}/blob/${source.commitSha}/${readmeRelative}`
      if (mappedCandidate) {
        if (!mappedCandidate.compose) mappedCandidate.compose = compose
        mappedCandidate.installGuideUrl ||= installGuideUrl
        mappedCandidate.provenance.push(source)
        continue
      }
      const slug = slugify(entry.name)
      const name = entry.name.split('-').map((part) => part.length <= 3 ? part.toUpperCase() : `${part[0]?.toUpperCase()}${part.slice(1)}`).join(' ')
      const summaryLine = readme.split(/\r?\n/).map((line) => line.replace(/^#+\s*/, '').replace(/\[([^\]]+)]\([^)]+\)/g, '$1').trim()).find((line) => line.length > 30 && !line.startsWith('!['))
      const summary = summaryLine?.slice(0, 280) ?? `Готовая Docker Compose-конфигурация для самостоятельного запуска ${name}.`
      addOrMerge({
        id: stableId(repositoryUrl ?? `${repoName}:${slug}`), slug, name, summary, description: summary,
        categories: ['Docker Compose'], tags: ['Docker', 'Compose'], aliases: [entry.name],
        websiteUrl: urls.find((url) => url !== repositoryUrl) ?? repositoryUrl, repositoryUrl,
        installGuideUrl, license: null, runtimes: ['Docker'], architectures: [],
        githubStars: null, githubForks: null, lastPushedAt: null, iconPath: `/data/icons/${slug}.webp`, compose,
        provenance: [source], quality: { completeness: 0, warnings: repositoryUrl ? [] : ['repository_missing'], verifiedAt: null },
      })
    }
  }
}

function attachDeploymentSources() {
  const manifestPath = path.join(dataRoot, 'overrides', 'deployments.json')
  if (!existsSync(manifestPath)) return
  const deployments = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, { repositoryUrl: string; sourceDir: string; commitSha: string; composePath: string; guideUrl: string }>
  for (const [appId, deployment] of Object.entries(deployments)) {
    const app = [...apps.values()].find((item) => item.id === appId)
    if (!app) continue
    const clonePath = path.join(rawRoot, 'deployments', deployment.sourceDir)
    let content = ''
    if (existsSync(path.join(clonePath, '.git'))) {
      try { content = execFileSync('git', ['-C', clonePath, 'show', `${deployment.commitSha}:${deployment.composePath}`], { encoding: 'utf8' }) } catch { content = '' }
    }
    if (!content) {
      const previous = previousAppsById.get(appId)
      const previousCompose = previous?.compose
      const expectedRepoName = deployment.repositoryUrl.replace('https://github.com/', '')
      const verifiedSnapshot = previousCompose?.path === deployment.composePath
        && previousCompose.sourceRepo === expectedRepoName
        && previousCompose.content.length > 0
        && Boolean(previous?.provenance.some((source) => source.repoUrl === deployment.repositoryUrl && source.commitSha === deployment.commitSha && source.sourcePath === deployment.composePath))
      if (!verifiedSnapshot || !previousCompose) continue
      content = previousCompose.content
    }
    app.compose = { path: deployment.composePath, content, sourceRepo: deployment.repositoryUrl.replace('https://github.com/', '') }
    app.installGuideUrl = deployment.guideUrl
    app.provenance.push({ repoName: deployment.repositoryUrl.replace('https://github.com/', ''), repoUrl: deployment.repositoryUrl, commitSha: deployment.commitSha, sourcePath: deployment.composePath, importedAt })
  }
}

function applyCache(records: CatalogApp[]) {
  const cachePath = path.join(dataRoot, 'cache', 'github.json')
  if (!existsSync(cachePath)) return
  const cache = JSON.parse(readFileSync(cachePath, 'utf8')) as Record<string, { stars: number; forks: number; pushedAt: string; fetchedAt: string }>
  for (const app of records) {
    if (!app.repositoryUrl) continue
    const cached = cache[app.repositoryUrl.toLowerCase()]
    if (!cached) continue
    app.githubStars = cached.stars
    app.githubForks = cached.forks
    app.lastPushedAt = cached.pushedAt
    app.quality.verifiedAt = cached.fetchedAt
  }
}

parseAwesomeSelfhosted()
parseMarkdownTables('awesome-selfhost-docker')
parseAwesomeDocker()
parseComposeExamples()
attachAwesomeCompose()
attachDeploymentSources()

const records = [...apps.values()]
const seenSlugs = new Set<string>()
for (const app of records) {
  app.installGuideUrl ||= app.repositoryUrl ? `${app.repositoryUrl}#readme` : app.websiteUrl
  if (seenSlugs.has(app.slug)) app.slug = `${app.slug}-${app.id.slice(0, 6)}`
  seenSlugs.add(app.slug)
  app.iconPath = `/data/icons/${app.slug}.webp`
}
applyCache(records)
const appOverridesPath = path.join(dataRoot, 'overrides', 'apps.json')
if (existsSync(appOverridesPath)) {
  const overrides = JSON.parse(readFileSync(appOverridesPath, 'utf8')) as Record<string, Partial<Pick<CatalogApp, 'summary' | 'description' | 'websiteUrl' | 'repositoryUrl' | 'license' | 'categories' | 'tags' | 'aliases' | 'runtimes' | 'architectures'>> & { reason: string }>
  for (const [id, override] of Object.entries(overrides)) {
    if (!override.reason?.trim()) throw new Error(`Override ${id} must include a reason`)
    const app = records.find((item) => item.id === id)
    if (!app) throw new Error(`Override target ${id} does not exist`)
    const fields = Object.fromEntries(Object.entries(override).filter(([key]) => key !== 'reason')) as Partial<CatalogApp>
    Object.assign(app, fields)
  }
}
for (const app of records) {
  app.architectures = [...new Set([...app.architectures, ...inferArchitectures([app.summary, app.description, ...app.tags, app.compose?.content ?? ''])])]
  app.quality.completeness = appCompleteness(app)
  const localIcon = path.join(dataRoot, app.iconPath.replace(/^\/data\//, '').replaceAll('/', path.sep))
  if (!existsSync(localIcon)) app.quality.warnings.push('icon_pending')
}
records.sort((a, b) => a.name.localeCompare(b.name, 'en'))

const payload: CatalogPayload = { version: 1, generatedAt: importedAt, sourceCount: 6, apps: records }
const catalogDirectory = path.join(dataRoot, 'catalog')
const publicData = path.join(projectRoot, 'public', 'data')
const publicCompose = path.join(publicData, 'compose')
mkdirSync(catalogDirectory, { recursive: true })
mkdirSync(publicData, { recursive: true })
mkdirSync(publicCompose, { recursive: true })
mkdirSync(path.join(projectRoot, 'public', 'data', 'icons'), { recursive: true })
writeFileSync(path.join(catalogDirectory, 'apps.json'), `${JSON.stringify(payload, null, 2)}\n`)
const runtimeApps = records.map((app) => {
  if (!app.compose) return app
  const contentUrl = `/data/compose/${app.id}.yaml`
  writeFileSync(path.join(publicCompose, `${app.id}.yaml`), app.compose.content)
  return { ...app, compose: { ...app.compose, content: '', contentUrl } }
})
writeFileSync(path.join(publicData, 'apps.json'), `${JSON.stringify({ ...payload, apps: runtimeApps })}\n`)
if (existsSync(path.join(dataRoot, 'icons'))) cpSync(path.join(dataRoot, 'icons'), path.join(publicData, 'icons'), { recursive: true })
if (existsSync(path.join(dataRoot, 'icons', 'icon.png'))) cpSync(path.join(dataRoot, 'icons', 'icon.png'), path.join(projectRoot, 'public', 'acatalog-icon.png'))
if (existsSync(path.join(catalogDirectory, 'sources.json'))) cpSync(path.join(catalogDirectory, 'sources.json'), path.join(publicData, 'sources.json'))

const quality = {
  generatedAt: importedAt,
  total: records.length,
  withRepository: records.filter((app) => app.repositoryUrl).length,
  withCompose: records.filter((app) => app.compose).length,
  withStars: records.filter((app) => app.githubStars !== null).length,
  pendingIcons: records.filter((app) => app.quality.warnings.includes('icon_pending')).length,
  averageCompleteness: Math.round(records.reduce((sum, app) => sum + app.quality.completeness, 0) / Math.max(records.length, 1)),
  uniqueCategories: new Set(records.flatMap((app) => app.categories)).size,
  duplicateIconPaths: records.length - new Set(records.map((app) => app.iconPath)).size,
  duplicateWebsiteUrls: [...new Set(records.map((app) => app.websiteUrl).filter((url): url is string => Boolean(url)))].filter((url) => records.filter((app) => app.websiteUrl === url).length > 1).length,
}
writeFileSync(path.join(catalogDirectory, 'quality-report.json'), `${JSON.stringify(quality, null, 2)}\n`)
console.log(`Built ${records.length} catalog entries (${quality.withCompose} with Compose).`)
