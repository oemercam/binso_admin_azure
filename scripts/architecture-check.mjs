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

function rel(file) { return path.relative(root, file).replaceAll('\\', '/') }
function read(file) { return fs.readFileSync(file, 'utf8') }

function checkNoPattern(files, pattern, label, allow = []) {
  const offenders = []
  for (const file of files) {
    const relative = rel(file)
    if (allow.includes(relative)) continue
    if (pattern.test(read(file))) offenders.push(relative)
  }
  if (offenders.length) failures.push(`${label}: ${offenders.join(', ')}`)
  else passes.push(label)
}

function expect(text, pattern, label) {
  if (pattern.test(text)) passes.push(label)
  else failures.push(label)
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
checkNoPattern(pageFiles, /\brawContent\b/, 'Business-Seiten verwenden kein rawContent')
checkNoPattern(pageFiles, /<AppSheet\b/, 'Business-Seiten verwenden keine uneinheitlichen Low-Level-AppSheet-Varianten')
checkNoPattern(pageFiles, /className=["'][^"']*\b(?:form-sheet|standard-mobile-sheet|sheet-layer|sheet-heading|sheet-actions|sheet-grabber|mobile-fullscreen-sheet)\b/, 'Business-Seiten enthalten keine Legacy-Sheet-Klassen')
checkNoPattern(pageFiles, /(?:100vh|100dvh|100svh|safe-area-inset|--app-visual-viewport|--app-vh|--visible-viewport)/, 'Business-Seiten berechnen keine Sheet-Viewport-/Safe-Area-Geometrie')

checkNoPattern(pageFiles, /className=["'][^"']*(?:toast|custom-toast|confirmation-dialog|footer-button-grid)[^"']*["']/, 'Business-Seiten definieren keine eigenen Toast-/Confirmation-/Footer-Geometrien')
checkNoPattern(pageFiles, /(?:toggle|switch).{0,160}(?:width|height|min-height)\s*:\s*\d+px|(?:width|height|min-height)\s*:\s*\d+px.{0,160}(?:toggle|switch)/i, 'Business-Seiten definieren keine Toggle-Geometrie')

checkNoPattern(productFiles, /\blocalStorage\b/, 'localStorage ist zentralisiert', ['lib/browser/storage.ts', 'app/layout.tsx'])
checkNoPattern(productFiles, /\bsessionStorage\b/, 'sessionStorage ist zentralisiert', ['lib/browser/storage.ts'])
checkNoPattern(productFiles, /\bfetch\s*\(/, 'fetch() ist im zentralen API-Client gekapselt', ['lib/http/api-client.ts'])
checkNoPattern(productFiles, /navigator\.userAgent/, 'Kein User-Agent-Sniffing im Produktivcode')
checkNoPattern(productFiles, /window\.visualViewport/, 'VisualViewport wird nur im DeviceEnvironmentProvider gelesen', ['components/providers/device-environment-provider.tsx'])
checkNoPattern(productFiles, /document\.body\.style\.overflow/, 'Body-Scroll-Lock hat genau einen Owner', ['components/ui/overlay-manager.ts'])

const cssFiles = ['app/globals.css', 'app/ui-foundation-v19.css', 'app/documents.css']
const allCss = cssFiles.map((file) => read(path.join(root, file))).join('\n')
if (/760px|761px/.test(allCss)) failures.push('Legacy-Breakpoint 760/761px gefunden')
else passes.push('Responsive CSS verwendet keinen Legacy-Breakpoint 760/761px')
if (/\.(?:form-sheet|standard-mobile-sheet|sheet-layer|sheet-heading|sheet-actions|sheet-grabber|mobile-fullscreen-sheet)\b/.test(allCss)) failures.push('Legacy-Sheet-CSS ist noch aktiv')
else passes.push('Legacy-Sheet-CSS wurde entfernt')
if (/--app-vh|--visible-viewport-height/.test(allCss)) failures.push('Legacy-Viewport-Variablen sind noch aktiv')
else passes.push('Legacy-Viewport-Variablen wurden entfernt')

const foundation = read(path.join(root, 'app/ui-foundation-v19.css'))
const appSheetRootCount = (foundation.match(/\.app-sheet\s*\{/g) ?? []).length
if (appSheetRootCount === 1) passes.push('Genau eine aktive .app-sheet Root-Implementierung')
else failures.push(`.app-sheet Root-Implementierungen: ${appSheetRootCount}`)
if (/\.app-sheet-(?:header|footer)[^{]*\{[^}]*position\s*:\s*sticky/s.test(foundation)) failures.push('Header/Footer verwenden position:sticky')
else passes.push('AppSheet Header/Footer sind natürliche Flex-Bereiche, nicht sticky')
if (/\.app-sheet[^\n{]*\{[^}]*!important/s.test(foundation)) failures.push('Canonical AppSheet verwendet !important')
else passes.push('Canonical AppSheet benötigt keine !important-Regeln')


const actionFooter = read(path.join(root, 'components/ui/action-footer.tsx'))
expect(actionFooter, /grid|ActionFooter|SheetFooterActions/, 'Kanonischer ActionFooter ist vorhanden')
const feedback = read(path.join(root, 'components/ui/feedback.tsx'))
expect(feedback, /FeedbackProvider/, 'Zentrales Feedback-System ist vorhanden')
expect(feedback, /toast-viewport/, 'Zentrale Toast-Ausgabe ist vorhanden')
const confirmDialog = read(path.join(root, 'components/ui/confirmation-dialog.tsx'))
expect(confirmDialog, /ResponsiveOverlay/, 'Bestätigungen verwenden ResponsiveOverlay')
expect(confirmDialog, /ActionFooter/, 'Bestätigungen verwenden ActionFooter')
const sheet = read(path.join(root, 'components/ui/sheet-system.tsx'))
for (const [pattern, label] of [
  [/className="app-sheet-content"/, 'AppSheet besitzt genau den zentralen Content-Scrollbereich'],
  [/className="app-sheet-footer"/, 'AppSheet besitzt einen Footer ausserhalb des Contents'],
  [/className="app-sheet-form"/, 'StandardFormSheet rendert ein Formular innerhalb des Contents'],
  [/formId\?/, 'StandardFormSheet unterstützt stabile Form-IDs'],
  [/useModalOverlay/, 'AppSheet verwendet den zentralen Overlay-/Scroll-Lock'],
]) expect(sheet, pattern, label)
if (/rawContent/.test(sheet)) failures.push('sheet-system.tsx enthält noch rawContent')
else passes.push('rawContent wurde aus dem Form-/Sheet-System entfernt')

const preview = read(path.join(root, 'components/documents/responsive-preview.tsx'))
expect(preview, /useModalOverlay/, 'ResponsivePreview verwendet denselben Overlay-/Scroll-Lock')
expect(preview, /document-preview-content/, 'ResponsivePreview besitzt einen eigenen kontrollierten Content-Scrollbereich')

const device = read(path.join(root, 'components/providers/device-environment-provider.tsx'))
for (const token of ['layoutViewportWidth', 'layoutViewportHeight', 'visualViewportWidth', 'visualViewportHeight', 'visualViewportOffsetTop']) {
  expect(device, new RegExp(`\\b${token}\\b`), `DeviceEnvironmentProvider exponiert ${token}`)
}
expect(device, /visual\?\.addEventListener\('resize'/, 'VisualViewport resize wird zentral beobachtet')
expect(device, /visual\?\.addEventListener\('scroll'/, 'VisualViewport scroll wird zentral beobachtet')

const sw = read(path.join(root, 'public/sw.js'))
expect(sw, /SKIP_WAITING/, 'PWA Update Manager kann einen wartenden Service Worker aktivieren')

console.log(`Architecture check: ${passes.length} Regeln erfüllt.`)
if (failures.length) {
  console.error(`${failures.length} Architekturverletzungen:`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('Keine durch den Architektur-Check erfassten Verletzungen gefunden.')
