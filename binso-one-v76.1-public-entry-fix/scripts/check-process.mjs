import fs from 'node:fs'

const checks = [
  ['lib/data/app-settings.ts', "timeTrackingMode: 'external_customer_system'", 'Default time capture must be customer-system based'],
  ['lib/data/app-settings.ts', 'monthlyReportRequired: true', 'Default process must require a monthly customer report'],
  ['lib/data/app-settings.ts', 'blockBillingUntilReportApproved: true', 'Default process must block billing until report approval'],
  ['lib/data/app-settings.ts', 'blockPayoutUntilReportApproved: true', 'Default process must block payout until report approval'],
  ['modules/time/eligibility.ts', "frequency === 'monthly'", 'Monthly evidence must unlock every time entry in the same month'],
  ['modules/workforce/settlement.ts', 'Monatsrapport fehlt', 'Settlement must check the approved monthly report'],
  ['modules/workforce/settlement.ts', 'Lieferantenrechnung fehlt', 'External settlement must check the supplier invoice'],
  ['app/(app)/customers/page.tsx', 'Eigener Zeit-/Rapportprozess', 'Customer-level workflow override must be editable'],
  ['app/(app)/contracts/page.tsx', 'Eigener Zeit-/Rapportprozess', 'Contract-level workflow override must be editable'],
  ['app/(app)/orders/[id]/page.tsx', 'Kosten / Einkauf CHF/h', 'Assignment must support provider-specific purchase cost'],
  ['app/(app)/orders/[id]/page.tsx', 'Verkaufssatz CHF/h', 'Assignment must support provider-specific customer sales rate'],
  ['app/(app)/orders/[id]/page.tsx', 'Monatsrapport hochladen', 'Order must support monthly report upload'],
  ['types/domain.ts', 'sourceQuoteId?: string', 'Invoice must retain its source quote link'],
  ['components/state/business-store.tsx', "['draft', 'sent'].includes(quote.status)", 'Quote dispatch must be limited to draft/sent'],
  ['components/state/business-store.tsx', "order.sourceQuoteId === quote.id || order.mandateRef === quote.number", 'Quote-to-order must de-duplicate by source identity'],
  ['components/state/business-store.tsx', "item.sourceQuoteId === quote.id || item.reference === quote.number", 'Quote-to-invoice must de-duplicate by source identity'],
  ['components/state/business-store.tsx', "selected.length !== requestedTimeIds.size", 'Invoice creation must reject invalid/mixed time selections'],
  ['components/state/business-store.tsx', "selectedExpenses.length !== requestedExpenseIds.size", 'Invoice creation must reject invalid/mixed expense selections'],
  ['components/state/business-store.tsx', "entry.invoicedInvoiceId === id && !nextTimeIds.has(entry.id)", 'Removed draft invoice time lines must be released'],
  ['components/state/business-store.tsx', "expense.invoicedInvoiceId === id && !nextExpenseIds.has(expense.id)", 'Removed draft invoice expenses must be released'],
  ['components/state/business-store.tsx', "mode === 'reminder' && currentStatus !== 'overdue'", 'Reminder must only be recorded for overdue invoices'],
  ['components/state/business-store.tsx', "['sent', 'partial', 'overdue'].includes(effectiveInvoiceStatus(invoice))", 'Payment/cancellation must require an issued open invoice'],
  ['app/(app)/quotes/page.tsx', 'Direktrechnung erstellen', 'Direct quote invoice must be explicitly labelled as shortcut'],
  ['app/(app)/quotes/page.tsx', "previewExistingOrder ? 'Auftrag öffnen' : 'Auftrag erstellen'", 'Accepted quote must open existing order instead of duplicating it'],
  ['app/(app)/invoices/page.tsx', "['sent', 'partial', 'overdue'].includes(effectiveInvoiceStatus(item))", 'Payment picker must exclude drafts/paid/cancelled invoices'],
  ['app/(app)/contracts/page.tsx', 'ist bereits vorhanden', 'Recurring contract invoicing must surface an existing period invoice'],
]

const failures = []
for (const [file, needle, description] of checks) {
  const source = fs.readFileSync(file, 'utf8')
  if (!source.includes(needle)) failures.push(`${file}: ${description}`)
}

if (failures.length) {
  console.error(`Process checks failed (${failures.length}):`)
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`Process checks passed (${checks.length} workflow invariants verified).`)
