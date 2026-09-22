import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = process.cwd()
const roots = ['app', 'components', 'hooks', 'lib', 'modules', 'types']
const extensions = ['.ts', '.tsx']
const errors = []

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) out.push(...walk(full))
    else if (extensions.includes(path.extname(full))) out.push(full)
  }
  return out
}

const files = roots.flatMap((dir) => walk(path.join(root, dir)))
const exportsByFile = new Map()

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8')
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )

  for (const diagnostic of sourceFile.parseDiagnostics) {
    errors.push(
      `${path.relative(root, file)}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`,
    )
  }

  const exported = new Set()
  sourceFile.forEachChild((node) => {
    if ((ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0) {
      if (node.name?.text) exported.add(node.name.text)
      if (ts.isVariableStatement(node)) {
        for (const declaration of node.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name)) exported.add(declaration.name.text)
        }
      }
      if (ts.isExportAssignment(node)) exported.add('default')
    }

    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const element of node.exportClause.elements) exported.add(element.name.text)
    }
  })
  exportsByFile.set(file, exported)
}

function resolveLocal(fromFile, specifier) {
  let base
  if (specifier.startsWith('@/')) base = path.join(root, specifier.slice(2))
  else if (specifier.startsWith('.')) base = path.resolve(path.dirname(fromFile), specifier)
  else return null

  const candidates = [
    base,
    ...extensions.map((ext) => `${base}${ext}`),
    ...extensions.map((ext) => path.join(base, `index${ext}`)),
  ]

  // Side-effect imports such as ./globals.css are valid local files too.
  // Keeping them in this check catches accidentally omitted assets before Next.js build.
  if (path.extname(base)) {
    candidates.unshift(base)
  }
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null
}

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8')
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )

  sourceFile.forEachChild((node) => {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) return
    const specifier = node.moduleSpecifier.text
    if (!specifier.startsWith('@/') && !specifier.startsWith('.')) return

    const resolved = resolveLocal(file, specifier)
    if (!resolved) {
      errors.push(`${path.relative(root, file)}: lokaler Import nicht gefunden: ${specifier}`)
      return
    }

    const namedBindings = node.importClause?.namedBindings
    if (!namedBindings || !ts.isNamedImports(namedBindings)) return

    const exported = exportsByFile.get(resolved) ?? new Set()
    for (const element of namedBindings.elements) {
      const importedName = (element.propertyName ?? element.name).text
      if (!exported.has(importedName)) {
        errors.push(
          `${path.relative(root, file)}: Import { ${importedName} } fehlt in ${path.relative(root, resolved)}`,
        )
      }
    }
  })
}

const forbiddenProductionPatterns = [
  { pattern: /from ['"]@\/qa\//, label: 'QA-Import im Produktivcode' },
  { pattern: /from ['"]\.\.\/qa\//, label: 'QA-Import im Produktivcode' },
]

const uiArchitectureChecks = [
  {
    pattern: /<Icon\s+name=["']close["']/, 
    label: 'Direktes Close-Icon gefunden. Verwende CloseButton aus components/ui/close-button.',
    allow: ['components/ui/close-button.tsx'],
  },
]


for (const file of files) {
  const source = fs.readFileSync(file, 'utf8')
  for (const check of forbiddenProductionPatterns) {
    if (check.pattern.test(source)) errors.push(`${path.relative(root, file)}: ${check.label}`)
  }
}


for (const file of files) {
  const source = fs.readFileSync(file, 'utf8')
  const relative = path.relative(root, file).replaceAll('\\', '/') 
  for (const check of uiArchitectureChecks) {
    if (check.allow?.includes(relative)) continue
    if (check.pattern.test(source)) errors.push(`${relative}: ${check.label}`)
  }
}


// v19 UI foundation invariants: keep one stylesheet foundation and one logo image.
const layoutSource = fs.readFileSync(path.join(root, 'app', 'layout.tsx'), 'utf8')
const cssImports = [...layoutSource.matchAll(/import ['"]\.\/([^'"]+\.css)['"]/g)].map((m) => m[1])
const expectedCss = ['globals.css', 'documents.css', 'ui-foundation-v19.css']
if (JSON.stringify(cssImports) !== JSON.stringify(expectedCss)) {
  errors.push(`app/layout.tsx: CSS-Imports muessen exakt ${expectedCss.join(', ')} sein (gefunden: ${cssImports.join(', ')})`)
}

const appCss = fs.readdirSync(path.join(root, 'app')).filter((name) => name.endsWith('.css')).sort()
for (const css of appCss) {
  if (!expectedCss.includes(css)) errors.push(`app/${css}: Legacy-CSS-Datei gefunden; in ui-foundation-v19.css konsolidieren.`)
}

const logoSource = fs.readFileSync(path.join(root, 'components', 'ui', 'binso-logo.tsx'), 'utf8')
const logoImgCount = (logoSource.match(/<img\b/g) ?? []).length
if (logoImgCount !== 1) errors.push(`components/ui/binso-logo.tsx: erwartet genau ein <img>, gefunden ${logoImgCount}.`)
if (/binso-logo-(?:light|dark)/.test(logoSource)) errors.push('components/ui/binso-logo.tsx: Light/Dark-Doppelbild ist nicht erlaubt.')

if (errors.length) {
  console.error(`Release-Check fehlgeschlagen: ${errors.length} Fehler`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Release-Check erfolgreich: ${files.length} TS/TSX-Dateien geprüft.`)
console.log('Syntax, lokale Imports und benannte Exporte sind konsistent.')
