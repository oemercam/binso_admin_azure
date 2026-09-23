import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const roots = ['app', 'components']
const files = []

function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(tsx|jsx)$/.test(entry.name)) files.push(full)
  }
}

function readOpeningTag(source, start) {
  let quote = null
  let braces = 0
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i]
    const prev = source[i - 1]
    if (quote) {
      if (ch === quote && prev !== '\\') quote = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue }
    if (ch === '{') { braces += 1; continue }
    if (ch === '}') { braces = Math.max(0, braces - 1); continue }
    if (ch === '>' && braces === 0) return source.slice(start, i + 1)
  }
  return source.slice(start)
}

for (const root of roots) walk(path.join(ROOT, root))
const failures = []

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8')
  let offset = 0
  while (true) {
    const start = source.indexOf('<button', offset)
    if (start < 0) break
    const tag = readOpeningTag(source, start)
    const actionable = /\bonClick\s*=/.test(tag) || /\btype\s*=\s*["']submit["']/.test(tag) || /\bform\s*=/.test(tag)
    if (!actionable) {
      const line = source.slice(0, start).split('\n').length
      failures.push(`${path.relative(ROOT, file)}:${line}: button has no click/submit action`)
    }
    offset = start + Math.max(tag.length, 7)
  }
}

if (failures.length) {
  console.error(`Action checks failed (${failures.length}):`)
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`Action checks passed (${files.length} TSX/JSX files scanned).`)
