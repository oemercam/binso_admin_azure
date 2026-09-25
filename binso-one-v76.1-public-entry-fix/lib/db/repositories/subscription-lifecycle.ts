import 'server-only'
import { withTransaction } from '@/lib/db/client'
import { getPlan } from '@/lib/data/plans'
import type { SubscriptionPlan } from '@/types/domain'

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
            set status = 'expired', updated_at = now()
          where id = $1`,
        [row.subscription_id],
      )
      await client.query(
        `update platform_tenants
            set platform_status = 'read_only', monthly_revenue_chf = 0
          where organization_id = $1 and platform_status = 'trial'`,
        [row.organization_id],
      )
      await client.query(
        `update organizations
            set status = 'read_only', updated_at = now()
          where id = $1 and status = 'trial'`,
        [row.organization_id],
      )
      await client.query(
        `insert into subscription_events
          (organization_id, subscription_id, actor_user_id, source, event_type, previous_status, new_status, detail)
         values ($1,$2,'system','system','trial.expired',$3,'expired','14-day trial expired')`,
        [row.organization_id, row.subscription_id, row.previous_status],
      )
    }

    const grace = await client.query<{ id: string; organization_id: string; status: string }>(`select s.id,s.organization_id,s.status
      from organization_subscriptions s join platform_tenants pt on pt.organization_id=s.organization_id
      where s.status='past_due' and s.grace_until is null
      for update of s,pt`)
    for (const subscription of grace.rows) {
      await client.query("update organization_subscriptions set status='grace_period',grace_until=now()+interval '7 days',updated_at=now() where id=$1", [subscription.id])
      await client.query("update platform_tenants set platform_status='grace_period' where organization_id=$1 and platform_status<>'suspended'", [subscription.organization_id])
      await client.query("update organizations set status='grace_period',updated_at=now() where id=$1 and status not in ('suspended','cancelled','archived')", [subscription.organization_id])
      await client.query(`insert into subscription_events (organization_id,subscription_id,actor_user_id,source,event_type,previous_status,new_status,detail)
        values ($1,$2,'system','system','payment.grace_started',$3,'grace_period','Default 7-day payment grace period started')`, [subscription.organization_id, subscription.id, subscription.status])
    }

    const readOnly = await client.query<{ id: string; organization_id: string; status: string }>(`select s.id,s.organization_id,s.status
      from organization_subscriptions s join platform_tenants pt on pt.organization_id=s.organization_id
      where s.status='grace_period' and s.grace_until is not null and s.grace_until<=now()
      for update of s,pt`)
    for (const subscription of readOnly.rows) {
      await client.query("update organization_subscriptions set status='read_only',updated_at=now() where id=$1", [subscription.id])
      await client.query("update platform_tenants set platform_status='read_only',monthly_revenue_chf=0 where organization_id=$1 and platform_status<>'suspended'", [subscription.organization_id])
      await client.query("update organizations set status='read_only',updated_at=now() where id=$1 and status not in ('suspended','cancelled','archived')", [subscription.organization_id])
      await client.query(`insert into subscription_events (organization_id,subscription_id,actor_user_id,source,event_type,previous_status,new_status,detail)
        values ($1,$2,'system','system','payment.read_only',$3,'read_only','Payment grace period ended; tenant switched to read-only')`, [subscription.organization_id, subscription.id, subscription.status])
    }

    const manual = await client.query<{ id: string; organization_id: string; plan: SubscriptionPlan; scheduled_plan: SubscriptionPlan | null; cancel_at_period_end: boolean; status: string }>(`select s.id,s.organization_id,s.plan,s.scheduled_plan,s.cancel_at_period_end,s.status
      from organization_subscriptions s join platform_tenants pt on pt.organization_id=s.organization_id
      where s.billing_provider='manual' and s.current_period_end<=now() and s.status in ('active','past_due')
        and (s.cancel_at_period_end or s.scheduled_plan is not null) for update of s,pt`)
    for (const subscription of manual.rows) {
      const plan = getPlan(subscription.scheduled_plan ?? subscription.plan)
      if (subscription.cancel_at_period_end) {
        await client.query("update organization_subscriptions set status='cancelled',cancel_at_period_end=false,cancelled_at=now(),scheduled_plan=null,updated_at=now() where id=$1", [subscription.id])
        await client.query("update platform_tenants set platform_status=case when platform_status='suspended' then 'suspended' else 'cancelled' end,monthly_revenue_chf=0 where organization_id=$1", [subscription.organization_id])
      } else {
        await client.query('update organization_subscriptions set plan=$2,scheduled_plan=null,unit_amount_chf=$3,updated_at=now() where id=$1', [subscription.id, plan.id, plan.monthlyPriceChf ?? 0])
        await client.query('update organization_entitlements set features=$2,max_users=$3,max_storage_mb=$4,updated_at=now() where organization_id=$1', [subscription.organization_id, plan.features, plan.includedUsers, plan.maxStorageMb])
      }
      await client.query(`insert into subscription_events (organization_id,subscription_id,actor_user_id,source,event_type,previous_plan,new_plan,previous_status,new_status,detail)
        values ($1,$2,'system','system','manual.period_transition',$3,$4,$5,$6,'Scheduled manual subscription transition')`, [subscription.organization_id, subscription.id, subscription.plan, plan.id, subscription.status, subscription.cancel_at_period_end ? 'cancelled' : subscription.status])
    }
    return { expiredTrials: result.rows.length, graceStarted: grace.rows.length, readOnlyTransitions: readOnly.rows.length, manualTransitions: manual.rows.length }
  })
}
