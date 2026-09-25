import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const roots = ['app', 'components']
const files = []
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    const stat = statSync(path)
    if (stat.isDirectory()) walk(path)
    else if (/\.(ts|tsx)$/.test(name)) files.push(path)
  }
}
for (const root of roots) walk(root)

const forbidden = [
  [/ß/g, 'Schweizer Rechtschreibung verwendet kein ß'],
  [/\bOfferten?\b/g, 'Produktbegriff ist Angebot/Angebote'],
  [/\bWorkspace\b/gi, 'Workspace ist kein Benutzerbegriff'],
  [/\bJourney\b/gi, 'Journey ist kein Benutzerbegriff'],
  [/\bSubmission\b/gi, 'Submission ist kein Benutzerbegriff'],
  [/Entity hinzufügen/gi, 'Entity ist kein Benutzerbegriff'],
]

const failures = []
for (const file of files) {
  const source = readFileSync(file, 'utf8')
  for (const [pattern, reason] of forbidden) {
    pattern.lastIndex = 0
    if (pattern.test(source)) failures.push(`${file}: ${reason}`)
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`Language check failed: ${failure}`)
  process.exit(1)
}
console.log(`Product language check passed (${files.length} UI source files scanned).`)
