import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { CatalogPayload } from '../src/types/catalog.js'
import { dataRoot, projectRoot } from './lib.js'

const catalogPath = path.join(dataRoot, 'catalog', 'apps.json')
if (!existsSync(catalogPath)) throw new Error('Missing data/catalog/apps.json; run npm run data:build first.')
const payload = JSON.parse(readFileSync(catalogPath, 'utf8')) as CatalogPayload
const publicData = path.join(projectRoot, 'public', 'data')
const publicCompose = path.join(publicData, 'compose')
mkdirSync(publicCompose, { recursive: true })
mkdirSync(path.join(publicData, 'icons'), { recursive: true })

const runtimeApps = payload.apps.map((app) => {
  if (!app.compose) return app
  const contentUrl = `/data/compose/${app.id}.yaml`
  writeFileSync(path.join(publicCompose, `${app.id}.yaml`), app.compose.content)
  return { ...app, compose: { ...app.compose, content: '', contentUrl } }
})
writeFileSync(path.join(publicData, 'apps.json'), `${JSON.stringify({ ...payload, apps: runtimeApps })}\n`)
if (existsSync(path.join(dataRoot, 'icons'))) cpSync(path.join(dataRoot, 'icons'), path.join(publicData, 'icons'), { recursive: true })
if (existsSync(path.join(dataRoot, 'icons', 'icon.png'))) cpSync(path.join(dataRoot, 'icons', 'icon.png'), path.join(projectRoot, 'public', 'acatalog-icon.png'))
if (existsSync(path.join(dataRoot, 'catalog', 'sources.json'))) cpSync(path.join(dataRoot, 'catalog', 'sources.json'), path.join(publicData, 'sources.json'))
console.log(`Staged ${runtimeApps.length} records and ${runtimeApps.filter((app) => app.compose).length} Compose files.`)
