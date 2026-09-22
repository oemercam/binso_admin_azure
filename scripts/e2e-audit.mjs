import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []
const passes = []

function read(rel) {
  const file = path.join(root, rel)
  if (!fs.existsSync(file)) {
    failures.push(`Fehlende Datei: ${rel}`)
    return ''
  }
  return fs.readFileSync(file, 'utf8')
}
function expect(rel, pattern, label) {
  const text = read(rel)
  const ok = typeof pattern === 'string' ? text.includes(pattern) : pattern.test(text)
  if (ok) passes.push(label)
  else failures.push(`${label} (${rel})`)
}

const required = [
  'app/(app)/customers/page.tsx',
  'app/(app)/quotes/page.tsx',
  'app/(app)/orders/page.tsx',
  'app/(app)/orders/[id]/page.tsx',
  'app/(app)/time/page.tsx',
  'app/(app)/invoices/page.tsx',
  'app/(app)/finance/page.tsx',
  'app/(app)/accounting/page.tsx',
  'app/(app)/employees/page.tsx',
  'app/(app)/settings/page.tsx',
  'components/state/business-store.tsx',
  'components/shared/app-overlays.tsx',
  'modules/time/eligibility.ts',
  'modules/invoices/status.ts',
  'components/documents/business-document.tsx',
]
for (const rel of required) read(rel)

// Quick-create query actions must work even when the current route is already open.
for (const [rel, query] of [
  ['app/(app)/customers/page.tsx', "params.get('new') === '1'"],
  ['app/(app)/quotes/page.tsx', "params.get('new') === '1'"],
  ['app/(app)/orders/page.tsx', "searchParams.get('new') !== '1'"],
  ['app/(app)/time/page.tsx', "searchParams.get('new') !== '1'"],
  ['app/(app)/invoices/page.tsx', "params.get('new') === '1'"],
]) {
  expect(rel, 'useSearchParams', `Query-Navigation aktiv: ${rel}`)
  expect(rel, query, `Quick Create konsumiert Query: ${rel}`)
  expect(rel, 'router.replace', `Query wird nach Öffnen bereinigt: ${rel}`)
}
expect('app/(app)/customers/page.tsx', "params.get('edit')", 'Kundensuche öffnet konkreten Kunden')
expect('app/(app)/quotes/page.tsx', "params.get('view')", 'Angebot-Deep-Link öffnet Vorschau')
expect('app/(app)/invoices/page.tsx', "params.get('view')", 'Rechnung-Deep-Link öffnet Vorschau')
expect('app/(app)/invoices/page.tsx', "params.get('payment')", 'Zahlungs-Quick-Action öffnet Auswahl')

// End-to-end business chain.
expect('components/state/business-store.tsx', 'addCustomer(customer)', 'Kunde speichern')
expect('components/state/business-store.tsx', 'createQuote(input)', 'Angebot erstellen')
expect('components/state/business-store.tsx', 'createQuoteRevision(quoteId)', 'Angebotsrevision erstellen')
expect('components/state/business-store.tsx', 'sendQuote(id, to)', 'Angebotsversandstatus speichern')
expect('components/state/business-store.tsx', 'createOrderFromQuote(quoteId)', 'Angebot in Auftrag überführen')
expect('components/state/business-store.tsx', 'createOrder(input)', 'Auftrag direkt erstellen')
expect('components/state/business-store.tsx', 'addTimeEntry(entry)', 'Zeit erfassen')
expect('components/state/business-store.tsx', 'addEvidence(evidence)', 'Zeitnachweis erfassen')
expect('modules/time/eligibility.ts', 'blockBillingWhenMissing', 'Nachweis kann Fakturierung blockieren')
expect('components/state/business-store.tsx', 'createInvoiceFromTimes(input)', 'Rechnung aus Zeiten erstellen')
expect('components/state/business-store.tsx', 'updateInvoiceDraft(id, changes)', 'Rechnungsentwurf bearbeiten')
expect('components/state/business-store.tsx', 'cancelInvoice(id)', 'Rechnung stornieren und Zeiten freigeben')
expect('components/state/business-store.tsx', 'recordPayment(invoiceId', 'Zahlung verbuchen')
expect('components/state/business-store.tsx', 'addSupplierInvoice(invoice)', 'Lieferantenrechnung erfassen')
expect('components/state/business-store.tsx', 'updateSupplierInvoice(id, changes)', 'Lieferantenrechnung freigeben/bezahlen')
expect('components/state/business-store.tsx', 'updateOrderPolicy(orderId, policy)', 'Auftragsregeln speichern')
expect('components/state/business-store.tsx', 'updateOrderAssignmentRule(rule)', 'Mitarbeiter-Regel pro Auftrag speichern')

// Document and settings wiring.
expect('app/(app)/invoices/page.tsx', '<BusinessDocument type="invoice"', 'Rechnung nutzt A4-Vorschau')
expect('app/(app)/quotes/page.tsx', '<BusinessDocument type="quote"', 'Angebot nutzt A4-Vorschau')
expect('app/(app)/settings/page.tsx', 'invoiceSender', 'Rechnungs-Absender konfigurierbar')
expect('app/(app)/settings/page.tsx', 'reminderSender', 'Mahnungs-Absender konfigurierbar')
expect('app/(app)/settings/page.tsx', 'payrollSender', 'Lohn-Absender konfigurierbar')
expect('app/(app)/settings/page.tsx', 'SettingsToggleRow', 'Enterprise-Toggles werden verwendet')
expect('app/layout.tsx', "import './documents.css'", 'Dokument-CSS eingebunden')
expect('app/layout.tsx', "import './ui-foundation-v19.css'", 'v19 UI Foundation eingebunden')

// Global search/quick create must target specific actions/records.
const overlay = read('components/shared/app-overlays.tsx')
for (const href of ['/customers?new=1', '/quotes?new=1', '/orders?new=1', '/time?new=1', '/invoices?new=1', '/invoices?payment=1']) {
  if (overlay.includes(href)) passes.push(`Quick Action vorhanden: ${href}`)
  else failures.push(`Quick Action fehlt: ${href}`)
}
expect('components/shared/app-overlays.tsx', '/customers?edit=${item.id}', 'Globale Suche verlinkt Kunden konkret')
expect('components/shared/app-overlays.tsx', '/quotes?view=${item.id}', 'Globale Suche verlinkt Angebote konkret')
expect('components/shared/app-overlays.tsx', '/invoices?view=${item.id}', 'Globale Suche verlinkt Rechnungen konkret')


// Persistent demo-data safeguards remain required.
expect('components/state/business-store.tsx', "binso-admin-demo-v12-responsive", 'Versionierter Demo-Speicher aktiv')
expect('components/state/business-store.tsx', 'customers: parsed.customers?.length ? parsed.customers : seeded.customers', 'Leere Legacy-Kundendaten werden mit Seeds repariert')
expect('components/state/business-store.tsx', 'quotes: parsed.quotes?.length ? parsed.quotes : seeded.quotes', 'Leere Legacy-Angebote werden mit Seeds repariert')
expect('components/state/business-store.tsx', 'invoices: parsed.invoices?.length ? parsed.invoices : seeded.invoices', 'Leere Legacy-Rechnungen werden mit Seeds repariert')
expect('components/state/business-store.tsx', 'employees: parsed.employees?.length ? parsed.employees : seeded.employees', 'Leere Legacy-Mitarbeitende werden mit Seeds repariert')

// v19 canonical UI foundation: exactly one responsive CSS foundation and one logo image.
expect('app/layout.tsx', "import './globals.css'", 'Globals CSS eingebunden')
expect('app/layout.tsx', "import './documents.css'", 'Dokument CSS eingebunden')
expect('app/layout.tsx', "import './ui-foundation-v19.css'", 'UI Foundation v19 eingebunden')
expect('app/ui-foundation-v19.css', '--app-mobile-gutter: 16px', 'Mobiler Seitenrand zentral definiert')
expect('app/ui-foundation-v19.css', /\.toggle-control\s*\{/, 'Toggle-Geometrie zentral definiert')
expect('app/ui-foundation-v19.css', /\.app-sheet-backdrop\s*\{/, 'Sheet-System zentral definiert')
expect('app/ui-foundation-v19.css', /\.mobile-menu-nav\s*\{/, 'Mobile Navigation zentral definiert')
expect('components/ui/binso-logo.tsx', 'binso-logo-image', 'Logo verwendet kanonisches Einzelbild')
expect('components/navigation/mobile-pill-nav.tsx', '<ResponsiveOverlay', 'Mobile Navigation verwendet zentrales ResponsiveOverlay')

expect('components/ui/action-footer.tsx', 'ActionFooter', 'Kanonischer ActionFooter vorhanden')
expect('components/ui/feedback.tsx', 'FeedbackProvider', 'Zentrales Feedback-System vorhanden')
expect('components/ui/confirmation-dialog.tsx', 'ConfirmationDialog', 'Kanonische Bestätigung vorhanden')
expect('app/globals.css', '--switch-track-off', 'Semantischer OFF-Switch-Token vorhanden')
expect('app/globals.css', '--switch-track-on', 'Semantischer ON-Switch-Token vorhanden')
expect('app/ui-foundation-v19.css', 'width:36px', 'Kompakte Switch-Breite definiert')
expect('app/ui-foundation-v19.css', 'height:20px', 'Kompakte Switch-Höhe definiert')

console.log(`E2E static audit: ${passes.length} Prüfungen erfolgreich.`)
if (failures.length) {
  console.error(`\n${failures.length} Fehler:`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('Keine statisch erkennbaren Verdrahtungsfehler gefunden.')
