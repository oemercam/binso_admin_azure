import type { ApprovalPolicy, ContractChain } from '@/modules/contracts/types'
import type { TimeTrackingPolicy } from '@/modules/time/types'

export type OrderPolicy = {
  organizationId: string
  orderId: string
  contractChain?: ContractChain
  timeTracking: TimeTrackingPolicy
  approval: ApprovalPolicy
  billing: {
    model: 'time' | 'fixed' | 'retainer' | 'milestone' | 'mixed'
    invoiceGrouping: 'detail' | 'person' | 'activity' | 'month' | 'summary'
    attachTimesheet: boolean
    purchaseOrderRequired: boolean
    servicePeriodRequired: boolean
  }
  budgetWarnings: number[]
}
