import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

async function importTypeScriptModule(path) {
  const source = readFileSync(path, 'utf8')
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: path,
    reportDiagnostics: true,
  })

  const errors = (result.diagnostics ?? []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
  assert.equal(errors.length, 0, `${path} must transpile without diagnostics`)
  const url = `data:text/javascript;base64,${Buffer.from(result.outputText).toString('base64')}`
  return import(url)
}

const numbering = await importTypeScriptModule('modules/documents/numbering.ts')
assert.equal(numbering.nextInvoiceNumber([], new Date('2027-01-03T00:00:00Z')), 'RE-2027-001')
assert.equal(numbering.nextInvoiceNumber(['RE-2027-001', 'RE-2027-009'], new Date('2027-04-01T00:00:00Z')), 'RE-2027-010')
assert.equal(numbering.nextQuoteNumber(['AN-2026-099'], new Date('2027-01-01T00:00:00Z')), 'AN-2027-001')

const invoice = await importTypeScriptModule('modules/invoices/calculations.ts')
const totals = invoice.calculateInvoiceTotals([
  { quantity: 2, unitPrice: 100, vatRate: 8.1 },
  { quantity: 1.5, unitPrice: 80, vatRate: 8.1 },
])
assert.deepEqual(totals, { subtotal: 320, vatAmount: 25.92, amount: 345.92 })
assert.equal(invoice.roundMoney(10.005), 10.01)

const orderMetrics = await importTypeScriptModule('modules/orders/metrics.ts')
const metrics = orderMetrics.calculateOrderMetrics(
  { id: 'o1', budgetHours: 20, usedHours: 1, salesRate: 200, costRate: 100 },
  [
    { orderId: 'o1', hours: 4, salesRate: 200, internalCostRate: 100 },
    { orderId: 'o1', hours: 6, salesRate: 150, internalCostRate: 90 },
    { orderId: 'other', hours: 50, salesRate: 999, internalCostRate: 999 },
  ],
)
assert.equal(metrics.usedHours, 10)
assert.equal(metrics.remainingHours, 10)
assert.equal(metrics.revenue, 1700)
assert.equal(metrics.cost, 940)
assert.equal(metrics.contributionMargin, 760)
assert.equal(metrics.budgetUsagePercent, 50)

const capabilities = await importTypeScriptModule('lib/auth/capabilities.ts')
assert.equal(capabilities.canManageOperations('owner'), true)
assert.equal(capabilities.canManageOperations('admin'), true)
assert.equal(capabilities.canManageOperations('finance'), false)
assert.equal(capabilities.canWriteTime('finance'), false)
assert.equal(capabilities.canWriteTime('employee'), true)
assert.equal(capabilities.canViewManagementData('employee'), false)
assert.equal(capabilities.canApproveTime('employee', false), false)
assert.equal(capabilities.canApproveTime('employee', true), true)

const sw = readFileSync('public/sw.js', 'utf8')
assert.ok(sw.includes("event.data?.type === 'SKIP_WAITING'"), 'service worker must support user-triggered activation')
assert.ok(!/cache\.add\(OFFLINE_URL\)[\s\S]{0,80}skipWaiting\(\)/.test(sw), 'service worker install must not force activation')
assert.ok(sw.includes('safeAppPath'), 'push navigation must restrict notification targets')

const env = readFileSync('lib/config/env.ts', 'utf8')
assert.ok(!env.includes('ALLOW_LOCAL_AUTH'), 'production local-auth bypass must not exist')

const pushRoute = readFileSync('app/api/push/subscriptions/route.ts', 'utf8')
assert.ok(pushRoute.includes('await upsertPushSubscription'), 'push API must await durable persistence before reporting success')

console.log('Core tests passed.')
