import type { TimeEntry } from '@/types/domain'
import type { TimeEvidence } from '@/modules/time/types'
import type { OrderPolicy } from '@/modules/orders/types'
import type { OrderAssignmentRule } from '@/modules/workforce/types'
import { resolveTimeTrackingPolicy } from '@/modules/orders/policies'

export function getTimeEntryBillingEligibility(
  entry: TimeEntry,
  evidence: TimeEvidence[],
  policies: OrderPolicy[] = [],
  assignmentRules: OrderAssignmentRule[] = [],
) {
  if (!entry.billable) return { eligible: false, reason: 'Nicht verrechenbar' }
  if (!entry.approved) return { eligible: false, reason: 'Nicht freigegeben' }
  if (entry.invoicedInvoiceId) return { eligible: false, reason: 'Bereits verrechnet' }

  const orderPolicy = policies.find((item) => item.orderId === entry.orderId)
  if (!orderPolicy) return { eligible: true, reason: 'Bereit' }
  const assignment = assignmentRules.find(
    (item) => item.orderId === entry.orderId && item.personId === entry.personId,
  )
  const effective = assignment
    ? resolveTimeTrackingPolicy(orderPolicy, assignment)
    : orderPolicy.timeTracking

  if (!effective.evidence.required || !effective.evidence.blockBillingWhenMissing) {
    return { eligible: true, reason: 'Bereit' }
  }

  const proof = findEvidenceForEntry(entry, evidence, effective.evidence.frequency)
  if (!proof) return { eligible: false, reason: 'Nachweis fehlt' }
  if (proof.status === 'rejected') return { eligible: false, reason: 'Nachweis abgelehnt' }
  if (effective.evidence.signatureRequired && !proof.signed) {
    return { eligible: false, reason: 'Unterschrift fehlt' }
  }
  if (effective.evidence.customerApprovalRequired && !proof.customerApproved) {
    return { eligible: false, reason: 'Kundenfreigabe fehlt' }
  }
  if (!['uploaded', 'verified'].includes(proof.status)) {
    return { eligible: false, reason: 'Nachweis unvollständig' }
  }
  return {
    eligible: true,
    reason: proof.status === 'verified' ? 'Nachweis geprüft' : 'Nachweis vorhanden',
  }
}

export function getTimeEntryApprovalEligibility(
  entry: TimeEntry,
  evidence: TimeEvidence[],
  policies: OrderPolicy[] = [],
  assignmentRules: OrderAssignmentRule[] = [],
) {
  const orderPolicy = policies.find((item) => item.orderId === entry.orderId)
  if (!orderPolicy) return { eligible: true, reason: 'Bereit' }
  const assignment = assignmentRules.find((item) => item.orderId === entry.orderId && item.personId === entry.personId)
  const effective = assignment ? resolveTimeTrackingPolicy(orderPolicy, assignment) : orderPolicy.timeTracking
  if (!effective.evidence.required || !effective.evidence.blockApprovalWhenMissing) return { eligible: true, reason: 'Bereit' }
  const proof = findEvidenceForEntry(entry, evidence, effective.evidence.frequency)
  if (!proof) return { eligible: false, reason: 'Nachweis fehlt' }
  if (proof.status === 'rejected') return { eligible: false, reason: 'Nachweis abgelehnt' }
  if (effective.evidence.signatureRequired && !proof.signed) return { eligible: false, reason: 'Unterschrift fehlt' }
  if (effective.evidence.customerApprovalRequired && !proof.customerApproved) return { eligible: false, reason: 'Kundenfreigabe fehlt' }
  if (!['uploaded', 'verified'].includes(proof.status)) return { eligible: false, reason: 'Nachweis unvollständig' }
  return { eligible: true, reason: proof.status === 'verified' ? 'Nachweis geprüft' : 'Nachweis vorhanden' }
}


function findEvidenceForEntry(
  entry: TimeEntry,
  evidence: TimeEvidence[],
  frequency: 'none' | 'daily' | 'weekly' | 'monthly',
) {
  return evidence.find((item) => {
    if (item.orderId !== entry.orderId || item.personId !== entry.personId) return false
    if (item.timeEntryId === entry.id) return true
    if (frequency === 'monthly') return item.periodDate.slice(0, 7) === entry.date.slice(0, 7)
    if (frequency === 'weekly') return sameIsoWeek(item.periodDate, entry.date)
    return item.periodDate === entry.date
  })
}

function sameIsoWeek(a: string, b: string) {
  const weekKey = (value: string) => {
    const date = new Date(`${value}T12:00:00Z`)
    const day = date.getUTCDay() || 7
    date.setUTCDate(date.getUTCDate() + 4 - day)
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
    const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
    return `${date.getUTCFullYear()}-${week}`
  }
  return weekKey(a) === weekKey(b)
}
