import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import type { CatalogPayload } from '../src/types/catalog.js'
import { dataRoot } from './lib.js'

const catalogPath = path.join(dataRoot, 'catalog', 'apps.json')
const historyDirectory = path.join(dataRoot, 'catalog', 'history')
const current = JSON.parse(readFileSync(catalogPath, 'utf8')) as CatalogPayload
mkdirSync(historyDirectory, { recursive: true })

const indexPath = path.join(historyDirectory, 'index.json')
const history = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, 'utf8')) as Array<{ version: string; generatedAt: string; hash: string; total: number; added: number; removed: number }> : []
const hash = createHash('sha256').update(JSON.stringify(current.apps)).digest('hex')
if (history.at(-1)?.hash === hash) {
  console.log('Catalog has not changed; no snapshot created.')
  process.exit(0)
}

const previousFile = history.at(-1)?.version ? path.join(historyDirectory, `${history.at(-1)?.version}.json.gz`) : null
let previousIds = new Set<string>()
if (previousFile && existsSync(previousFile)) {
  const { gunzipSync } = await import('node:zlib')
  const previous = JSON.parse(gunzipSync(readFileSync(previousFile)).toString('utf8')) as CatalogPayload
  previousIds = new Set(previous.apps.map((app) => app.id))
}
const currentIds = new Set(current.apps.map((app) => app.id))
const added = [...currentIds].filter((id) => !previousIds.has(id)).length
const removed = [...previousIds].filter((id) => !currentIds.has(id)).length
const addedIds = [...currentIds].filter((id) => !previousIds.has(id))
const removedIds = [...previousIds].filter((id) => !currentIds.has(id))
const version = current.generatedAt.replace(/[:.]/g, '-').replace('Z', 'Z')
writeFileSync(path.join(historyDirectory, `${version}.json.gz`), gzipSync(JSON.stringify(current), { level: 9 }))
history.push({ version, generatedAt: current.generatedAt, hash, total: current.apps.length, added, removed })
writeFileSync(indexPath, `${JSON.stringify(history, null, 2)}\n`)
const appName = new Map(current.apps.map((app) => [app.id, app.name]))
const diff = [
  '# ACatalog refresh diff', '', `Generated: ${current.generatedAt}`, '',
  `- Total: ${current.apps.length}`, `- Added: ${added}`, `- Removed: ${removed}`, '',
  '## Added', '', ...(addedIds.slice(0, 200).map((id) => `- ${appName.get(id) ?? id} (\`${id}\`)`) || ['- None']), '',
  '## Removed', '', ...(removedIds.slice(0, 200).map((id) => `- \`${id}\``) || ['- None']), '',
].join('\n')
writeFileSync(path.join(dataRoot, 'catalog', 'diff-report.md'), diff)
console.log(`Created catalog snapshot ${version}: +${added} / -${removed}.`)
