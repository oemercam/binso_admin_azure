import fs from 'node:fs'

const css = fs.readFileSync('app/styles/marketing-v80.css', 'utf8')
const shell = fs.readFileSync('components/public/public-shell.tsx', 'utf8')

const required = [
  'V81.14 — desktop footer balance',
  '@media(min-width:901px)',
  'width:min(980px,calc(100% - (2 * var(--v819-gutter))))!important',
  'grid-template-columns:minmax(250px,300px) repeat(4,minmax(110px,1fr))!important',
  'column-gap:24px!important',
  'max-width:280px!important',
  'font-size:10px!important',
  'text-align:left!important',
]
for (const token of required) {
  if (!css.includes(token)) throw new Error(`V81.14 footer CSS missing: ${token}`)
}
for (const label of ['Produkt','Hilfe','Zugang','Rechtliches']) {
  if (!shell.includes(`aria-label="${label}"`)) throw new Error(`Footer group missing: ${label}`)
}
console.log('V81.14 desktop footer layout checks passed')
