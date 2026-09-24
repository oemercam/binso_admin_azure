export type EvidenceFrequency = 'none' | 'daily' | 'weekly' | 'monthly'
export type EvidenceFormat = 'pdf' | 'xlsx' | 'portal' | 'other'
export type EvidenceStatus = 'not_required' | 'missing' | 'uploaded' | 'verified' | 'rejected'

export type TimeEvidencePolicy = {
  required: boolean
  frequency: EvidenceFrequency
  formats: EvidenceFormat[]
  signatureRequired: boolean
  customerApprovalRequired: boolean
  blockApprovalWhenMissing: boolean
  blockBillingWhenMissing: boolean
  reminderEnabled: boolean
  reminderHour?: number
}

export type TimeTrackingPolicy = {
  mode: 'internal' | 'external_customer_system' | 'both'
  bookingIntervalMinutes: 1 | 5 | 15 | 30
  minimumBookingMinutes?: number
  requireDescription: boolean
  allowRetroactiveDays: number
  lockClosedPeriods: boolean
  evidence: TimeEvidencePolicy
}

export type TimeEvidence = {
  organizationId: string
  id: string
  timeEntryId?: string
  orderId: string
  personId: string
  periodDate: string
  fileName: string
  mimeType: string
  status: EvidenceStatus
  signed: boolean
  customerApproved: boolean
  uploadedAt: string
  verifiedAt?: string
}
