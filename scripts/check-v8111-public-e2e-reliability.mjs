import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const help = readFileSync('app/help/page.tsx', 'utf8')
const css = readFileSync('app/styles/marketing-v80.css', 'utf8')

assert.ok(['0.81.11', '0.81.12', '0.81.13', '0.81.14', '0.81.15', '0.81.16'].includes(pkg.version))
assert.match(help, /try \{[\s\S]*listPublishedHelpArticles/)
assert.match(help, /articles = \[\]/)
assert.match(css, /V81\.11 — visual QA reliability fixes/)
assert.match(css, /display:flex!important/)
assert.match(css, /\.v816-feature-copy\{order:1!important/)
console.log('V81.11 public E2E reliability checks passed.')
