import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'
import type { CatalogPayload } from '../src/types/catalog.js'
import { dataRoot, projectRoot, slugify } from './lib.js'

interface DeploymentRecord { appId: string; repositoryUrl: string; sourceDir: string; commitSha: string; composePath: string; guideUrl: string }
const catalog = JSON.parse(readFileSync(path.join(dataRoot, 'catalog', 'apps.json'), 'utf8')) as CatalogPayload
const outputPath = path.join(dataRoot, 'overrides', 'deployments.json')
const checkedPath = path.join(dataRoot, 'cache', 'deployment-scan.json')
const existing = existsSync(outputPath) ? JSON.parse(readFileSync(outputPath, 'utf8')) as Record<string, DeploymentRecord> : {}
const checkedIds = new Set<string>(existsSync(checkedPath) ? JSON.parse(readFileSync(checkedPath, 'utf8')) as string[] : Object.keys(existing))
const rawDeployments = path.join(projectRoot, 'raw', 'deployments')
mkdirSync(rawDeployments, { recursive: true })

const limitArg = process.argv.find((value) => value.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=')[1]) : Number.POSITIVE_INFINITY
const candidatePaths = [
  'compose.yaml', 'compose.yml', 'docker-compose.yml', 'docker-compose.yaml',
  'docker-compose.prod.yml', 'docker-compose.production.yml',
  'docker/compose.yaml', 'docker/compose.yml', 'docker/docker-compose.yml', 'docker/docker-compose.yaml',
  'deploy/compose.yaml', 'deploy/docker-compose.yml', 'deployment/docker-compose.yml',
]

function githubParts(url: string): { owner: string; repo: string } | null {
  const match = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/#]+?)(?:\.git)?(?:[#/].*)?$/i)
  return match ? { owner: match[1], repo: match[2] } : null
}

function validCompose(content: string): boolean {
  try {
    const parsed = YAML.parse(content) as { services?: unknown }
    return Boolean(parsed && typeof parsed.services === 'object' && parsed.services && Object.keys(parsed.services as object).length)
  } catch { return false }
}

async function findRemoteCompose(owner: string, repo: string): Promise<string | null> {
  for (const composePath of candidatePaths) {
    try {
      const response = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${composePath}`, { signal: AbortSignal.timeout(6000), headers: { 'User-Agent': 'ACatalog-deployment-discovery' } })
      if (!response.ok) continue
      if (validCompose(await response.text())) return composePath
    } catch { /* A missing or slow candidate is not fatal. */ }
  }
  return null
}

function cloneAndRecord(appId: string, repositoryUrl: string, owner: string, repo: string, composePath: string): DeploymentRecord | null {
  const sourceDir = `${slugify(owner)}--${slugify(repo)}`
  const clonePath = path.join(rawDeployments, sourceDir)
  try {
    if (!existsSync(path.join(clonePath, '.git'))) {
      if (existsSync(clonePath)) rmSync(clonePath, { recursive: true, force: true })
      execFileSync('git', ['clone', '--depth', '1', '--filter=blob:none', '--no-checkout', `${repositoryUrl}.git`, clonePath], { stdio: 'ignore', timeout: 120_000 })
    }
    const content = execFileSync('git', ['-C', clonePath, 'show', `HEAD:${composePath}`], { encoding: 'utf8', timeout: 60_000 })
    if (!validCompose(content)) return null
    const commitSha = execFileSync('git', ['-C', clonePath, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
    return { appId, repositoryUrl, sourceDir, commitSha, composePath, guideUrl: `${repositoryUrl}#readme` }
  } catch { return null }
}

const candidates = catalog.apps.filter((app) => !app.compose && app.repositoryUrl && githubParts(app.repositoryUrl) && !checkedIds.has(app.id)).slice(0, limit)
let checked = 0
let discovered = 0
const batchSize = 12
for (let index = 0; index < candidates.length; index += batchSize) {
  const batch = candidates.slice(index, index + batchSize)
  const found = await Promise.all(batch.map(async (app) => {
    const parts = githubParts(app.repositoryUrl!)!
    const composePath = await findRemoteCompose(parts.owner, parts.repo)
    return composePath ? { app, parts, composePath } : null
  }))
  for (const item of found) {
    if (!item) continue
    const record = cloneAndRecord(item.app.id, item.app.repositoryUrl!, item.parts.owner, item.parts.repo, item.composePath)
    if (!record) continue
    existing[item.app.id] = record
    discovered += 1
    writeFileSync(outputPath, `${JSON.stringify(existing, null, 2)}\n`)
  }
  for (const app of batch) checkedIds.add(app.id)
  writeFileSync(checkedPath, `${JSON.stringify([...checkedIds].sort(), null, 2)}\n`)
  checked += batch.length
  console.log(`Deployment discovery: ${checked}/${candidates.length}, found ${discovered}.`)
}
writeFileSync(outputPath, `${JSON.stringify(existing, null, 2)}\n`)
console.log(`Checked ${checked} repositories; ${Object.keys(existing).length} official deployment sources stored.`)
