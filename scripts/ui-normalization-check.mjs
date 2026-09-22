import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []
const passes = []
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

function expect(value, label) {
  if (value) passes.push(label)
  else failures.push(label)
}

const css = read('app/ui-foundation-v19.css')
const globals = read('app/globals.css')
const sheet = read('components/ui/sheet-system.tsx')
const providers = read('components/providers/app-providers.tsx')
const pagesDir = path.join(root, 'app', '(app)')

function walk(dir) {
  return fs.readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    return fs.statSync(full).isDirectory() ? walk(full) : [full]
  })
}
const pages = walk(pagesDir).filter((file) => file.endsWith('.tsx')).map((file) => fs.readFileSync(file, 'utf8')).join('\n')

expect(/\.action-footer[^}]*grid-template-columns\s*:\s*repeat\(2,minmax\(0,1fr\)\)/s.test(css.replaceAll(' ', '')), 'ActionFooter uses two equal columns')
expect(!/@media\s*\(max-width:\s*420px\)[\s\S]{0,500}\.app-sheet-actions[\s\S]{0,120}grid-template-columns\s*:\s*1fr/.test(css), 'No 420px footer stacking override')
expect(/\.app-sheet-actions>.button\{[^}]*height:42px/s.test(css.replaceAll(' ', '')), 'Mobile sheet action height is 42px')
expect(/\.toggle-control\{[^}]*width:36px[^}]*height:20px/s.test(css.replaceAll(' ', '')), 'Canonical switch is 36x20px')
expect(/\.toggle-thumb\{[^}]*width:14px[^}]*height:14px/s.test(css.replaceAll(' ', '')), 'Canonical switch thumb is 14x14px')
for (const token of ['--switch-track-off', '--switch-track-on', '--switch-track-disabled', '--switch-thumb', '--switch-border', '--switch-focus-ring']) {
  expect(globals.includes(token), `Theme token ${token} exists`)
}
expect(providers.includes('<FeedbackProvider>'), 'FeedbackProvider is wired globally')
expect(read('components/ui/feedback.tsx').includes('toast-viewport'), 'Canonical toast viewport exists')
expect(read('components/ui/confirmation-dialog.tsx').includes('ActionFooter'), 'Confirmation dialog uses ActionFooter')
expect(sheet.includes('Änderungen verwerfen?'), 'StandardFormSheet has central discard confirmation')
expect(sheet.includes('Weiter bearbeiten'), 'Discard confirmation keeps safe action left')
expect(sheet.includes('Verwerfen'), 'Discard confirmation has destructive action right')
expect(!pages.includes('inline-notice'), 'Business pages no longer render inline success notices')
expect(!pages.includes('window.confirm'), 'Business pages no longer use native confirm')
expect(!pages.includes('confirmAction('), 'Business pages no longer use confirmAction')

console.log(`UI normalization check: ${passes.length} Prüfungen erfolgreich.`)
if (failures.length) {
  console.error(`${failures.length} Fehler:`)
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('Keine statisch erkennbaren UI-Normalisierungsfehler gefunden.')
