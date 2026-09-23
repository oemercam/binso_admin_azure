import 'server-only'
import { withTransaction } from '@/lib/db/client'

export async function expireTrials() {
  return withTransaction(async (client) => {
    const result = await client.query<{ organization_id: string; subscription_id: string; previous_status: string }>(
      `select s.organization_id, s.id as subscription_id, s.status as previous_status
         from organization_subscriptions s
         join platform_tenants pt on pt.organization_id = s.organization_id
        where pt.platform_status = 'trial'
          and s.trial_until is not null
          and s.trial_until <= now()
        for update of s, pt`,
    )

    for (const row of result.rows) {
      await client.query(
        `update organization_subscriptions
            set status = 'cancelled', cancelled_at = coalesce(cancelled_at, now()), updated_at = now()
          where id = $1`,
        [row.subscription_id],
      )
      await client.query(
        `update platform_tenants
            set platform_status = 'expired', monthly_revenue_chf = 0
          where organization_id = $1 and platform_status = 'trial'`,
        [row.organization_id],
      )
      await client.query(
        `insert into subscription_events
          (organization_id, subscription_id, actor_user_id, source, event_type, previous_status, new_status, detail)
         values ($1,$2,'system','system','trial.expired',$3,'cancelled','14-day trial expired')`,
        [row.organization_id, row.subscription_id, row.previous_status],
      )
    }

    return { expiredTrials: result.rows.length }
  })
}
