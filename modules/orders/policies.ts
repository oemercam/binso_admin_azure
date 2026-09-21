import type { OrderPolicy } from './types'
import type { OrderAssignmentRule } from '@/modules/workforce/types'
import type { TimeTrackingPolicy } from '@/modules/time/types'

export function resolveTimeTrackingPolicy(
  orderPolicy: OrderPolicy,
  assignment?: OrderAssignmentRule,
): TimeTrackingPolicy {
  const override = assignment?.timePolicyOverride
  if (!override) return orderPolicy.timeTracking

  return {
    ...orderPolicy.timeTracking,
    ...override,
    evidence: {
      ...orderPolicy.timeTracking.evidence,
      ...(override.evidence ?? {}),
    },
  }
}

export function canInvoiceTime(args: {
  approved: boolean
  billable: boolean
  alreadyInvoiced: boolean
  evidenceRequired: boolean
  evidenceVerified: boolean
  blockBillingWhenMissing: boolean
}) {
  if (!args.approved || !args.billable || args.alreadyInvoiced) return false
  if (
    args.evidenceRequired &&
    args.blockBillingWhenMissing &&
    !args.evidenceVerified
  ) {
    return false
  }
  return true
}
