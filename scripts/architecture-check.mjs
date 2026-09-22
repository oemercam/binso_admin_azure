import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []
const passes = []

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    const stat = fs.statSync(full)
    return stat.isDirectory() ? walk(full) : [full]
  })
}

function rel(file) {
  return path.relative(root, file).replaceAll('\\', '/')
}

function checkNoPattern(files, pattern, label, allow = []) {
  const offenders = []
  for (const file of files) {
    const relative = rel(file)
    if (allow.includes(relative)) continue
    const text = fs.readFileSync(file, 'utf8')
    if (pattern.test(text)) offenders.push(relative)
  }
  if (offenders.length) failures.push(`${label}: ${offenders.join(', ')}`)
  else passes.push(label)
}

const productFiles = [
  ...walk(path.join(root, 'app')),
  ...walk(path.join(root, 'components')),
  ...walk(path.join(root, 'hooks')),
  ...walk(path.join(root, 'lib')),
].filter((file) => /\.(ts|tsx)$/.test(file))

const pageFiles = walk(path.join(root, 'app', '(app)')).filter((file) => /\.(ts|tsx)$/.test(file))

checkNoPattern(pageFiles, /\b(?:localStorage|sessionStorage)\b/, 'Pages greifen nicht direkt auf Browser-Storage zu')
checkNoPattern(pageFiles, /\bmatchMedia\s*\(/, 'Pages enthalten keine eigenen MediaQuery-/Device-Regeln')
checkNoPattern(pageFiles, /\b(?:navigator\.userAgent|visualViewport)\b/, 'Pages enthalten kein UA-/Viewport-Sniffing')
checkNoPattern(pageFiles, /\bfetch\s*\(/, 'Pages verwenden keinen direkten fetch()-Aufruf')
checkNoPattern(pageFiles, /\b(?:document|window)\./, 'Pages greifen nicht direkt auf DOM-/Window-Infrastruktur zu')
checkNoPattern(pageFiles, /overlay-layer sheet-layer/, 'Pages erzeugen keine eigenen Sheet-Backdrops')
checkNoPattern(pageFiles, /<form[^>]+className=["'][^"']*form-sheet/, 'Pages erzeugen keine eigenen Sheet-Form-Container')

checkNoPattern(productFiles, /\blocalStorage\b/, 'localStorage ist zentralisiert', [
  'lib/browser/storage.ts',
  'app/layout.tsx',
])
checkNoPattern(productFiles, /\bsessionStorage\b/, 'sessionStorage ist zentralisiert', ['lib/browser/storage.ts'])
checkNoPattern(productFiles, /\bfetch\s*\(/, 'fetch() ist im zentralen API-Client gekapselt', ['lib/http/api-client.ts'])
checkNoPattern(productFiles, /navigator\.userAgent/, 'Kein User-Agent-Sniffing im Produktivcode')
checkNoPattern(productFiles, /\b100vh\b/, 'Keine statischen 100vh-Layouts')

const cssFiles = ['app/globals.css', 'app/ui-foundation-v19.css', 'app/documents.css']
for (const cssFile of cssFiles) {
  const css = fs.readFileSync(path.join(root, cssFile), 'utf8')
  if (/760px|761px/.test(css)) failures.push(`${cssFile}: Legacy-Breakpoint 760/761px gefunden`)
}
if (!failures.some((item) => item.includes('Legacy-Breakpoint'))) passes.push('Responsive CSS verwendet den zentralen 820/821px Mobile-Grenzwert')

const appShell = fs.readFileSync(path.join(root, 'components/app-shell/app-shell.tsx'), 'utf8')
if (appShell.includes('useHeaderVisibility')) passes.push('Header-Scroll wird zentral über useHeaderVisibility gesteuert')
else failures.push('AppShell verwendet useHeaderVisibility nicht')

const layout = fs.readFileSync(path.join(root, 'app/layout.tsx'), 'utf8')
if (layout.includes('<AppProviders>')) passes.push('Globale Provider besitzen einen zentralen Einstiegspunkt')
else failures.push('AppProviders fehlt im RootLayout')

const sheet = fs.readFileSync(path.join(root, 'components/ui/sheet-system.tsx'), 'utf8')
for (const token of ['aria-modal', 'FOCUSABLE', 'returnFocusRef', "event.key === 'Escape'"]) {
  if (sheet.includes(token)) passes.push(`Sheet-System: ${token}`)
  else failures.push(`Sheet-System fehlt: ${token}`)
}

const sw = fs.readFileSync(path.join(root, 'public/sw.js'), 'utf8')
if (sw.includes('SKIP_WAITING')) passes.push('PWA Update Manager kann einen wartenden Service Worker aktivieren')
else failures.push('Service Worker unterstützt SKIP_WAITING nicht')

console.log(`Architecture check: ${passes.length} Regeln erfüllt.`)
if (failures.length) {
  console.error(`${failures.length} Architekturverletzungen:`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('Keine durch den Architektur-Check erfassten Verletzungen gefunden.')
