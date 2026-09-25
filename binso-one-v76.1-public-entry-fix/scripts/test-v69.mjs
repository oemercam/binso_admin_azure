import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

async function module(file) {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
}
const policy = await module('lib/auth/business-state-policy.ts')
const employee = { role: 'employee', email: 'employee@example.test', userId: 'u1' }
const state = {
  invoices: [{ id: 'secret-invoice', amount: 1000 }],
  employees: [{ id: 'e1', email: employee.email, status: 'active', internalCostRate: 100 }, { id: 'e2', email: 'other@example.test', status: 'active' }],
  customers: [{ id: 'c1', notes: 'private' }, { id: 'c2' }],
  orders: [{ id: 'o1', customerId: 'c1', status: 'active', salesRate: 200, costRate: 100 }],
  orderAssignmentRules: [{ id: 'a1', personId: 'e1', orderId: 'o1', active: true }],
  timeEntries: [{ id: 't1', personId: 'e1', orderId: 'o1', date: '2026-09-24', hours: 1, approved: false, salesRate: 200, internalCostRate: 100 }, { id: 't2', personId: 'e2', hours: 5 }],
}
const visible = policy.projectBusinessState(state, employee)
assert.equal(visible.invoices, undefined)
assert.equal(visible.employees.length, 1)
assert.equal(visible.employees[0].internalCostRate, 0)
assert.equal(visible.customers.length, 1)
assert.equal(visible.timeEntries.length, 1)
assert.equal(policy.projectBusinessState(state, { ...employee, email: 'missing@example.test' }).timeEntries.length, 0)
const merged = policy.mergeAuthorizedState(state, { timeEntries: [{ ...visible.timeEntries[0], hours: 2 }] }, employee)
assert.equal(merged.timeEntries.find(row => row.id === 't1').hours, 2)
assert.equal(merged.timeEntries.find(row => row.id === 't1').salesRate, 200)
assert.equal(merged.timeEntries.find(row => row.id === 't2').hours, 5)
assert.deepEqual(merged.invoices, state.invoices)
assert.throws(() => policy.mergeAuthorizedState(state, { invoices: [{ id: 'forged' }] }, employee))
assert.throws(() => policy.mergeAuthorizedState(state, { timeEntries: [{ ...visible.timeEntries[0], approved: true }] }, employee))
assert.throws(() => policy.mergeAuthorizedState(state, { timeEntries: [] }, employee))
assert.throws(() => policy.mergeAuthorizedState(state, { timeEntries: [{ ...visible.timeEntries[0], personId: 'e2' }] }, employee))
assert.throws(() => policy.mergeAuthorizedState(state, { timeEntries: [{ ...visible.timeEntries[0], hours: 25 }] }, employee))
assert.throws(() => policy.mergeAuthorizedState(state, { customers: [{ id: 'modified' }] }, { ...employee, role: 'finance' }))
assert.throws(() => policy.mergeAuthorizedState(state, { invoices: [{ id: 'new' }] }, { ...employee, role: 'owner', features: ['crm'] }))
assert.equal(policy.mergeAuthorizedState(state, { auditEvents: [{ actorUserId: 'forged' }] }, { ...employee, role: 'owner' }).auditEvents, undefined)
const issued = { id: 'i1', number: 'RE-2026-001', status: 'sent', amount: 100, lines: [{ quantity: 1, unitPrice: 100, vatRate: 0 }] }
assert.throws(() => policy.validateFinancialChanges({ invoices: [issued] }, { invoices: [{ ...issued, amount: 1 }] }))
assert.throws(() => policy.validateFinancialChanges({ invoices: [issued] }, { invoices: [] }))
assert.throws(() => policy.validateFinancialChanges({ invoices: [issued] }, { invoices: [issued, { ...issued, id: 'i2', status: 'draft' }] }))
policy.validateFinancialChanges({ invoices: [issued] }, { invoices: [{ ...issued, status: 'paid', paidAmount: 100 }] })

const csv = await module('lib/format/csv.ts')
assert.equal(csv.csvCell('=HYPERLINK("evil")'), '"\'=HYPERLINK(""evil"")"')
assert.equal(csv.csvCell(' +cmd'), '"\' +cmd"')
assert.deepEqual(csv.parseCsv('name;notes\r\n"Firma";"Zeile 1\nZeile 2; \"\"Zitat\"\""'), [{ name: 'Firma', notes: 'Zeile 1\nZeile 2; "Zitat"' }])
assert.throws(() => csv.parseCsv('name;name\na;b'))
assert.throws(() => csv.parseCsv('name;notes\n"offen;abc'))
assert.throws(() => csv.parseCsv('name;notes\nx;y;z'))
assert.throws(() => csv.importNumber('NaN'))
assert.throws(() => csv.importNumber('-5'))
assert.equal(csv.importNumber('', 30), 30)
const calendar = await module('modules/contracts/schedule.ts')
assert.equal(calendar.advanceContractDate('2026-01-31', 'monthly'), '2026-02-28')
assert.equal(calendar.advanceContractDate('2028-01-31', 'monthly'), '2028-02-29')
assert.equal(calendar.advanceContractDate('2028-02-29', 'yearly'), '2029-02-28')
assert.equal(calendar.advanceContractDate('2026-11-30', 'quarterly'), '2027-02-28')
const payment = await module('modules/documents/swiss-payment.ts')
assert.equal(payment.validSwissIban('CH93 0076 2011 6238 5295 7'), true)
assert.equal(payment.validSwissIban('CH00 0000 0000 0000 0000 0'), false)
const address = { name: 'Test', street: 'Strasse', postalCode: '8000', town: 'Zürich', country: 'CH' }
assert.equal(payment.prepareSwissPayment({ iban: 'CH9300762011623852957', creditor: address, debtor: address, amount: 100, currency: 'CHF', message: 'RE-1' }).amount, '100.00')
assert.throws(() => payment.prepareSwissPayment({ iban: 'CH9300762011623852957', creditor: address, debtor: address, amount: 100.001, currency: 'CHF', message: 'RE-1' }))
const documents = await module('modules/documents/email-document.ts')
const company = { ...address, address: 'Strasse 1', zip: '8000', city: 'Zürich', name: '<script>evil</script>' }
const doc = { number: 'RE-1', recipientName: 'Kunde', recipientAddress: 'Strasse 1', recipientZip: '8000', recipientCity: 'Zürich', issueDate: '2026-09-24', due: '2026-10-24', lines: [{ description: '<img src=x onerror=alert(1)>', quantity: 1, unit: 'h', unitPrice: 100, vatRate: 0 }], amount: 100, paidAmount: 0, vatAmount: 0 }
const html = documents.renderEmailDocument('invoice', doc, company)
assert.ok(!html.includes('<script>evil'))
assert.ok(html.includes('&lt;img'))
assert.throws(() => documents.renderEmailDocument('invoice', { ...doc, recipientName: '' }, company))
console.log('V69 behavioral tests passed: role isolation, mutation protection, CSV, billing dates, IBAN and document escaping.')
