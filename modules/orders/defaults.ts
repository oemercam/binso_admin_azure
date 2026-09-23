import type { BillingModel, CustomerWorkflowPolicy } from '@/types/domain'
import type { OrderPolicy } from '@/modules/orders/types'

export function createDefaultOrderPolicy(orderId: string, billingModel: BillingModel, process?: CustomerWorkflowPolicy): OrderPolicy {
  const workflow: CustomerWorkflowPolicy = process ?? {
    timeTrackingMode: 'internal',
    monthlyReportRequired: false,
    customerSignatureRequired: false,
    customerApprovalRequired: false,
    blockBillingUntilReportApproved: false,
    blockPayoutUntilReportApproved: false,
  }
  return {
    orderId,
    timeTracking: {
      mode: workflow.timeTrackingMode,
      bookingIntervalMinutes: 15,
      minimumBookingMinutes: 15,
      requireDescription: true,
      allowRetroactiveDays: 14,
      lockClosedPeriods: true,
      evidence: {
        required: workflow.monthlyReportRequired,
        frequency: workflow.monthlyReportRequired ? 'monthly' : 'none',
        formats: workflow.monthlyReportRequired ? ['pdf'] : [],
        signatureRequired: workflow.customerSignatureRequired,
        customerApprovalRequired: workflow.customerApprovalRequired,
        blockApprovalWhenMissing: false,
        blockBillingWhenMissing: workflow.blockBillingUntilReportApproved,
        reminderEnabled: workflow.monthlyReportRequired,
      },
    },
    approval: {
      requireTimeApproval: true,
      requireEvidenceBeforeApproval: false,
      requireEvidenceBeforeBilling: false,
      invoiceApprovalThreshold: 5000,
      supplierInvoiceApprovalThreshold: 2000,
    },
    billing: {
      model: billingModel,
      invoiceGrouping: billingModel === 'time' ? 'detail' : 'summary',
      attachTimesheet: billingModel === 'time',
      purchaseOrderRequired: false,
      servicePeriodRequired: true,
    },
    budgetWarnings: [70, 85, 100],
  }
}
