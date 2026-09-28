import 'server-only'
import { query } from '@/lib/db/client'

export async function recordCheckoutLegalAcceptance(input: {
  organizationId: string
  subscriptionId: string
  actorUserId: string
  termsVersion: string
  dpaVersion: string
}) {
  const detail = `terms=${input.termsVersion}; dpa=${input.dpaVersion}`
  await query(
    `insert into subscription_events
      (organization_id, subscription_id, actor_user_id, source, event_type, detail)
     values ($1, $2, $3, 'customer', 'legal.accepted', $4)`,
    [input.organizationId, input.subscriptionId, input.actorUserId, detail],
  )
}
