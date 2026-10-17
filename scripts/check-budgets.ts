import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import type { CatalogPayload } from '../src/types/catalog.js'
import { dataRoot, projectRoot } from './lib.js'

const limits = { runtimeJson: 2_500_000, javascript: 350_000, css: 100_000 }
const runtimePath = path.join(projectRoot, 'public', 'data', 'apps.json')
const distAssets = path.join(projectRoot, 'dist', 'assets')
if (!existsSync(runtimePath) || !existsSync(distAssets)) throw new Error('Run npm run build before checking budgets.')
const files = readdirSync(distAssets)
const javascript = files.filter((file) => file.endsWith('.js')).reduce((sum, file) => sum + statSync(path.join(distAssets, file)).size, 0)
const css = files.filter((file) => file.endsWith('.css')).reduce((sum, file) => sum + statSync(path.join(distAssets, file)).size, 0)
const runtimeJson = statSync(runtimePath).size
const catalog = JSON.parse(readFileSync(path.join(dataRoot, 'catalog', 'apps.json'), 'utf8')) as CatalogPayload
const duplicateIconPaths = catalog.apps.length - new Set(catalog.apps.map((app) => app.iconPath)).size
const missingIcons = catalog.apps.filter((app) => !existsSync(path.join(dataRoot, app.iconPath.replace(/^\/data\//, '')))).length
const failures = [
  runtimeJson > limits.runtimeJson && `runtime JSON ${runtimeJson} > ${limits.runtimeJson}`,
  javascript > limits.javascript && `JavaScript ${javascript} > ${limits.javascript}`,
  css > limits.css && `CSS ${css} > ${limits.css}`,
  duplicateIconPaths > 0 && `${duplicateIconPaths} duplicate icon paths`,
  missingIcons > 0 && `${missingIcons} missing icons`,
].filter(Boolean)
console.log(JSON.stringify({ runtimeJson, javascript, css, duplicateIconPaths, missingIcons, limits }, null, 2))
if (failures.length) throw new Error(`Budget check failed: ${failures.join('; ')}`)
