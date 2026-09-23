import type { AppSettings, Employee, SettlementPolicy, Supplier, SupplierInvoice } from '@/types/domain'
import type { OrderAssignmentRule } from '@/modules/workforce/types'
import type { TimeEvidence } from '@/modules/time/types'

export function resolveSettlementPolicy(args: {
  assignment: OrderAssignmentRule
  settings: AppSettings
  employee?: Employee
  supplier?: Supplier
}): SettlementPolicy {
  const { assignment, settings, employee, supplier } = args
  const base: SettlementPolicy =
    assignment.providerType === 'external_company' || assignment.providerType === 'external_individual'
      ? { ...settings.workflow.supplierSettlement, ...(supplier?.settlementOverride ?? {}) }
      : assignment.providerType === 'employee_hourly'
        ? { ...settings.workflow.employeeSettlement, ...(employee?.settlementOverride ?? {}) }
        : { mode: 'salary', requireApprovedMonthlyReport: false, requireSupplierInvoice: false, requireFinanceApproval: true }

  return { ...base, ...(assignment.settlementOverride ?? {}) }
}

export function getSettlementEligibility(args: {
  assignment: OrderAssignmentRule
  month: string
  settings: AppSettings
  evidence: TimeEvidence[]
  supplierInvoices: SupplierInvoice[]
  employee?: Employee
  supplier?: Supplier
}) {
  const policy = resolveSettlementPolicy(args)
  const report = args.evidence.find((item) =>
    item.orderId === args.assignment.orderId &&
    item.personId === args.assignment.personId &&
    item.periodDate.slice(0, 7) === args.month
  )

  if (policy.requireApprovedMonthlyReport) {
    if (!report) return { eligible: false, reason: 'Monatsrapport fehlt', policy }
    if (report.status !== 'verified') return { eligible: false, reason: 'Monatsrapport nicht geprüft', policy }
    if (!report.signed) return { eligible: false, reason: 'Unterschrift fehlt', policy }
    if (!report.customerApproved) return { eligible: false, reason: 'Kundenfreigabe fehlt', policy }
  }

  if (policy.requireSupplierInvoice) {
    const invoice = args.supplierInvoices.find((item) =>
      item.orderId === args.assignment.orderId &&
      item.supplierId === args.assignment.personId &&
      (item.period?.slice(0, 7) === args.month || item.invoiceDate.slice(0, 7) === args.month)
    )
    if (!invoice) return { eligible: false, reason: 'Lieferantenrechnung fehlt', policy }
    if (invoice.status === 'review') return { eligible: false, reason: 'Lieferantenrechnung in Prüfung', policy }
  }

  return {
    eligible: true,
    reason: policy.requireFinanceApproval ? 'Bereit für Buchhaltungsfreigabe' : 'Bereit zur Auszahlung',
    policy,
  }
}
