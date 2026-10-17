import { readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { dataRoot, getSourceRef, rawRoot } from './lib.js'

const importedAt = new Date().toISOString()
const sourceNames = readdirSync(rawRoot).filter((name) => statSync(path.join(rawRoot, name)).isDirectory())
const sources = sourceNames.map((repoName) => {
  const repoPath = path.join(rawRoot, repoName)
  const clonedAt = statSync(path.join(repoPath, '.git')).birthtime.toISOString()
  let readmes = 0
  let composeFiles = 0
  let directories = 0
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === '.git') continue
      const fullPath = path.join(directory, entry.name)
      if (entry.isDirectory()) { directories += 1; walk(fullPath) }
      else {
        if (/^readme\.md$/i.test(entry.name)) readmes += 1
        if (/^(docker-)?compose.*\.ya?ml$/i.test(entry.name)) composeFiles += 1
      }
    }
  }
  walk(repoPath)
  return { ...getSourceRef(repoName, '.', importedAt), clonedAt, directories, readmes, composeFiles }
})

const report = { generatedAt: importedAt, sourceCount: sources.length, sources }
mkdirSync(path.join(dataRoot, 'catalog'), { recursive: true })
writeFileSync(path.join(dataRoot, 'catalog', 'sources.json'), `${JSON.stringify(report, null, 2)}\n`)

const markdown = [
  '# ACatalog source inventory',
  '',
  `Generated: ${importedAt}`,
  '',
  '| Source | Commit | Clone date | README | Compose | Directories |',
  '| --- | --- | --- | ---: | ---: | ---: |',
  ...sources.map((source) => `| [${source.repoName}](${source.repoUrl}) | \`${source.commitSha.slice(0, 12)}\` | ${source.clonedAt} | ${source.readmes} | ${source.composeFiles} | ${source.directories} |`),
  '',
].join('\n')
writeFileSync(path.join(dataRoot, 'catalog', 'inventory.md'), markdown)
console.log(`Inventoried ${sources.length} source repositories.`)
