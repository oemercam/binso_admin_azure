import fs from 'node:fs'

const menu = fs.readFileSync('components/public/public-mobile-menu.tsx', 'utf8')

const checks = [
  ['client readiness does not use effect-driven setMounted', !menu.includes('setMounted')],
  ['client readiness uses hydration-safe external store', menu.includes('useSyncExternalStore') && menu.includes('getServerSnapshot')],
  ['route changes close menu without effect-driven setOpen', menu.includes('openOnPathname === pathname') && !menu.includes('useEffect(() => setOpen')],
  ['mobile menu still portals to document.body', menu.includes('createPortal(panel, document.body)')],
  ['escape closes menu', menu.includes("event.key === 'Escape'")],
  ['body scroll is restored', menu.includes('previousOverflow')],
]

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  for (const [name] of failed) console.error(`FAIL: ${name}`)
  process.exit(1)
}
console.log('V81.16.2 mobile menu lint-safe state checks passed')
