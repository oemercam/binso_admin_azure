import fs from 'node:fs'

const css = fs.readFileSync('app/styles/public-responsive-system.css', 'utf8')
const shell = fs.readFileSync('components/public/public-shell.tsx', 'utf8')

const required = [
  'Footer: three useful groups',
  'grid-template-columns:minmax(250px,300px) repeat(3,minmax(120px,1fr))!important',
  'column-gap:24px!important',
  'text-transform:uppercase',
  'v80-footer-bottom',
]
for (const token of required) {
  if (!css.includes(token)) throw new Error(`V81.14/V82.0.9 footer CSS missing: ${token}`)
}
for (const label of ['Produkt','Hilfe','Rechtliches']) {
  if (!shell.includes(`aria-label="${label}"`)) throw new Error(`Footer group missing: ${label}`)
}
if (!shell.includes('publicSite.accessNavigation') || !shell.includes('publicSite.adminNavigation')) throw new Error('Secondary access links must remain available in footer utility navigation')
console.log('V81.14/V82.0.9 compact footer layout checks passed')
