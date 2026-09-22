import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []
const passes = []

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    return fs.statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const pages = walk(path.join(root, 'app', '(app)')).filter((file) => file.endsWith('.tsx'))
const pageText = pages.map((file) => [file, fs.readFileSync(file, 'utf8')])

const forbidden = ['form-sheet', 'standard-mobile-sheet', 'sheet-layer', 'sheet-heading', 'sheet-actions', 'sheet-grabber', 'mobile-fullscreen-sheet']
for (const token of forbidden) {
  const offenders = pageText.filter(([, text]) => new RegExp(`className=["'][^"']*\\b${token}\\b`).test(text)).map(([file]) => path.relative(root, file))
  if (offenders.length) failures.push(`${token}: ${offenders.join(', ')}`)
  else passes.push(`Keine page-level ${token}-Klasse`)
}

const rawOffenders = pageText.filter(([, text]) => /\brawContent\b/.test(text)).map(([file]) => path.relative(root, file))
if (rawOffenders.length) failures.push(`rawContent: ${rawOffenders.join(', ')}`)
else passes.push('Kein rawContent in Business-Seiten')

function openingTags(text, componentName) {
  const tags = []
  let cursor = 0
  const needle = `<${componentName}`
  while (true) {
    const start = text.indexOf(needle, cursor)
    if (start < 0) break
    let braces = 0
    let quote = null
    let escaped = false
    let end = start + needle.length
    for (; end < text.length; end += 1) {
      const char = text[end]
      if (quote) {
        if (escaped) escaped = false
        else if (char === '\\') escaped = true
        else if (char === quote) quote = null
        continue
      }
      if (char === '"' || char === "'" || char === '`') quote = char
      else if (char === '{') braces += 1
      else if (char === '}') braces = Math.max(0, braces - 1)
      else if (char === '>' && braces === 0) break
    }
    tags.push(text.slice(start, end + 1))
    cursor = end + 1
  }
  return tags
}

let standardForms = 0
for (const [file, text] of pageText) {
  const matches = openingTags(text, 'StandardFormSheet')
  standardForms += matches.length
  for (const props of matches) {
    for (const prop of ['open', 'title=', 'onClose=', 'onSubmit=', 'formId=', 'footer=']) {
      if (!props.includes(prop)) failures.push(`${path.relative(root, file)}: StandardFormSheet ohne ${prop}`)
    }
  }
}
if (standardForms >= 17) passes.push(`${standardForms} StandardFormSheet-Verwendungen mit kanonischer API gefunden`)
else failures.push(`Nur ${standardForms} StandardFormSheet-Verwendungen gefunden`)

const sheet = fs.readFileSync(path.join(root, 'components/ui/sheet-system.tsx'), 'utf8')
for (const token of ['app-sheet-header', 'app-sheet-content', 'app-sheet-footer', 'app-sheet-form', 'useModalOverlay']) {
  if (sheet.includes(token)) passes.push(`Sheet-System enthält ${token}`)
  else failures.push(`Sheet-System fehlt ${token}`)
}
if (/rawContent/.test(sheet)) failures.push('StandardFormSheet/AppSheet enthält rawContent')
else passes.push('Sheet-System enthält kein rawContent')

const css = fs.readFileSync(path.join(root, 'app/ui-foundation-v19.css'), 'utf8')
if ((css.match(/\.app-sheet\s*\{/g) ?? []).length === 1) passes.push('Eine .app-sheet Root-Regel aktiv')
else failures.push('Mehrere .app-sheet Root-Regeln aktiv')
if (/\.app-sheet-(?:header|footer)[^{]*\{[^}]*position\s*:\s*sticky/s.test(css)) failures.push('Sheet Header/Footer sind sticky')
else passes.push('Sheet Header/Footer sind nicht sticky')
if (/\.app-sheet-content\s*\{[^}]*overflow-y\s*:\s*auto/s.test(css)) passes.push('AppSheetContent ist der vertikale Scroll-Owner')
else failures.push('AppSheetContent hat kein overflow-y:auto')
if (/\.app-sheet\s*\{[^}]*overflow\s*:\s*hidden/s.test(css)) passes.push('AppSheet Root verwendet overflow:hidden')
else failures.push('AppSheet Root verwendet nicht overflow:hidden')
if (/\.app-sheet-content\s*\{[^}]*min-height\s*:\s*0/s.test(css)) passes.push('AppSheetContent hat min-height:0')
else failures.push('AppSheetContent hat kein min-height:0')

const overlayManager = fs.readFileSync(path.join(root, 'components/ui/overlay-manager.ts'), 'utf8')
if (/scrollLockDepth/.test(overlayManager)) passes.push('Scroll-Lock unterstützt verschachtelte Overlays')
else failures.push('Scroll-Lock besitzt keinen zentralen Depth-Mechanismus')

console.log(`Sheet migration check: ${passes.length} Prüfungen erfolgreich.`)
if (failures.length) {
  console.error(`${failures.length} Fehler:`)
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('Canonical Sheet-Migration vollständig statisch bestätigt.')
