import type { BillingModel } from '@/types/domain'
import type { OrderPolicy } from '@/modules/orders/types'

export function createDefaultOrderPolicy(orderId: string, billingModel: BillingModel): OrderPolicy {
  return {
    orderId,
    timeTracking: {
      mode: 'internal',
      bookingIntervalMinutes: 15,
      minimumBookingMinutes: 15,
      requireDescription: true,
      allowRetroactiveDays: 14,
      lockClosedPeriods: true,
      evidence: {
        required: false,
        frequency: 'none',
        formats: [],
        signatureRequired: false,
        customerApprovalRequired: false,
        blockApprovalWhenMissing: false,
        blockBillingWhenMissing: false,
        reminderEnabled: false,
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
