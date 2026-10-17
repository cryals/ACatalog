import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { projectRoot, rawRoot } from './lib.js'

interface LockedSource { name: string; url: string; branch: string; commit: string; priority: number }
interface SourceLock { version: number; updatedAt: string; sources: LockedSource[] }

const lockPath = path.join(projectRoot, 'data', 'sources.lock.json')
const lock = JSON.parse(readFileSync(lockPath, 'utf8')) as SourceLock
const latest = process.argv.includes('--latest')
const git = (args: string[], cwd?: string) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()

mkdirSync(rawRoot, { recursive: true })
for (const source of lock.sources.sort((a, b) => b.priority - a.priority)) {
  const destination = path.join(rawRoot, source.name)
  const isNewClone = !existsSync(path.join(destination, '.git'))
  if (isNewClone) {
    git(['clone', '--filter=blob:none', '--no-checkout', source.url, destination])
  }
  const currentOrigin = git(['remote', 'get-url', 'origin'], destination)
  if (currentOrigin.replace(/\.git$/, '') !== source.url.replace(/\.git$/, '')) throw new Error(`${source.name}: origin differs from sources.lock.json`)
  // A `--no-checkout` clone reports every indexed file as deleted until its
  // first checkout. Only enforce a clean working tree for an existing clone.
  if (!isNewClone && git(['status', '--porcelain'], destination)) throw new Error(`${source.name}: source clone has local changes`)
  git(['fetch', '--prune', 'origin', source.branch], destination)
  const target = latest ? `origin/${source.branch}` : source.commit
  git(['checkout', '--detach', target], destination)
  source.commit = git(['rev-parse', 'HEAD'], destination)
  console.log(`${source.name}: ${source.commit.slice(0, 12)}`)
}

if (latest) {
  lock.updatedAt = new Date().toISOString()
  writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`)
  console.log('Updated data/sources.lock.json to current remote heads.')
}
