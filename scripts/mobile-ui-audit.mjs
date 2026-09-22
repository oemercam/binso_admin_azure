import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')
const walk = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
  const rel = path.join(dir, entry.name)
  return entry.isDirectory() ? walk(rel) : [rel]
})

const errors = []
const layout = read('app/layout.tsx')
const foundation = read('app/ui-foundation-v20.css')
const logo = read('components/ui/binso-logo.tsx')

if (!layout.includes("ui-foundation-v20.css")) errors.push('v20 foundation is not loaded')
if (layout.includes("ui-foundation-v19.css")) errors.push('legacy v19 foundation is still loaded')
if ((logo.match(/<img/g) || []).length !== 1) errors.push('BinsoLogo must render exactly one img')
if (!foundation.includes('.form-sheet.mobile-fullscreen-sheet')) errors.push('fullscreen legacy bridge missing')
if (!foundation.includes('.document-overlay')) errors.push('document viewer foundation missing')
if (!foundation.includes('.operational-mobile-list')) errors.push('mobile operational list foundation missing')
if (!foundation.includes('--app-content-bottom')) errors.push('bottom pill content reserve missing')

const appCss = walk('app').filter((p) => p.endsWith('.css'))
if (appCss.length !== 3) errors.push(`expected exactly 3 app CSS files, found ${appCss.length}: ${appCss.join(', ')}`)

for (const file of appCss) {
  if (/responsive-v|mobile-final|ui-polish|ux-system|platform-hardening|sheet-system-v17|compact-rows/i.test(file)) {
    errors.push(`legacy stylesheet remains: ${file}`)
  }
}

if (errors.length) {
  console.error(errors.map((x) => `- ${x}`).join('\n'))
  process.exit(1)
}
console.log('Mobile UI audit: OK')
