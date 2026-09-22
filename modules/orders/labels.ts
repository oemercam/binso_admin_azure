import type { BillingModel, WorkerType } from '@/types/domain'
import type { EvidenceFrequency, TimeTrackingPolicy } from '@/modules/time/types'
import type { ServiceProviderType } from '@/modules/workforce/types'

export function billingModelLabel(value: BillingModel) {
  if (value === 'fixed') return 'Pauschal'
  if (value === 'mixed') return 'Gemischt'
  return 'Nach Aufwand'
}

export function evidenceFrequencyLabel(value: EvidenceFrequency) {
  if (value === 'daily') return 'Täglich'
  if (value === 'weekly') return 'Wöchentlich'
  if (value === 'monthly') return 'Monatlich'
  return 'Keiner'
}

export function timeTrackingModeLabel(value: TimeTrackingPolicy['mode']) {
  if (value === 'both') return 'Binso + Kundensystem'
  if (value === 'external_customer_system') return 'Kundensystem'
  return 'Binso Admin'
}

export function serviceProviderLabel(value: ServiceProviderType) {
  const labels: Record<ServiceProviderType, string> = {
    employee_salary: 'Festlohn',
    employee_hourly: 'Stundenlohn',
    external_individual: 'Externe Person',
    external_company: 'Externe Firma',
  }
  return labels[value]
}

export function workerTypeLabel(value: WorkerType) {
  if (value === 'hourly_employee') return 'Stundenlohn'
  if (value === 'external') return 'Externe Firma'
  return 'Intern'
}
