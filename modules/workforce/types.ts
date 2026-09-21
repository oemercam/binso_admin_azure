import type { TimeTrackingPolicy } from '@/modules/time/types'

export type ServiceProviderType =
  | 'employee_salary'
  | 'employee_hourly'
  | 'external_individual'
  | 'external_company'

export type OrderAssignmentRule = {
  orderId: string
  personId: string
  providerType: ServiceProviderType
  timePolicyOverride?: Partial<TimeTrackingPolicy>
  salesRate?: number
  internalCostRate?: number
  active: boolean
}
