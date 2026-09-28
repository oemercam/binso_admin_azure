import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const required = [
  'lib/i18n/config.ts',
  'lib/i18n/messages.ts',
  'lib/i18n/public-copy.ts',
  'components/i18n/language-provider.tsx',
  'components/i18n/language-selector.tsx',
  'components/i18n/dom-localizer.tsx',
  'app/styles/i18n.css',
]
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing i18n file: ${file}`)
}
const config = read('lib/i18n/config.ts')
for (const locale of ['de', 'fr', 'it', 'en', 'tr']) {
  if (!config.includes(`'${locale}'`)) throw new Error(`Missing locale: ${locale}`)
}
const provider = read('components/i18n/language-provider.tsx')
for (const token of ['navigator.languages', 'localStorage', 'document.documentElement.lang']) {
  if (!provider.includes(token)) throw new Error(`Language provider missing ${token}`)
}
if (!config.includes("binso_locale")) throw new Error('Locale cookie missing')
const publicShell = read('components/public/public-shell.tsx')
if (!publicShell.includes('LanguageSelector')) throw new Error('Public language selector missing')
const appShell = read('components/app-shell/app-shell.tsx')
if (!appShell.includes('LanguageSelector')) throw new Error('Authenticated language selector missing')
const messages = read('lib/i18n/messages.ts') + read('lib/i18n/public-copy.ts')
for (const value of ['Fonctionnalités', 'Funzionalità', 'Features', 'Özellikler']) {
  if (!messages.includes(value)) throw new Error(`Missing translated navigation token: ${value}`)
}
console.log('i18n check passed: de/fr/it/en/tr, browser detection, persistence and manual selectors are present.')
