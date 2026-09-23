import type { TimeTrackingPolicy } from '@/modules/time/types'
import type { SettlementPolicy } from '@/types/domain'

export type ServiceProviderType =
  | 'employee_salary'
  | 'employee_hourly'
  | 'external_individual'
  | 'external_company'

export type OrderAssignmentRule = {
  organizationId?: string
  orderId: string
  personId: string
  providerType: ServiceProviderType
  timePolicyOverride?: Partial<TimeTrackingPolicy>
  salesRate?: number
  internalCostRate?: number
  settlementOverride?: Partial<SettlementPolicy>
  active: boolean
}
