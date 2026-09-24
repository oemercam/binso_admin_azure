import 'server-only'
import { query, withTransaction } from '@/lib/db/client'
import { getPlan } from '@/lib/data/plans'
import type { PlatformTenant, SignupRequest, SubscriptionPlan, SubscriptionStatus } from '@/types/domain'

type TenantRow = {
  tenant_id: string
  organization_id: string
  company_name: string
  owner_name: string
  owner_email: string
  plan: SubscriptionPlan
  subscription_status: SubscriptionStatus
  platform_status: PlatformTenant['status']
  seats: number
  users: string
  monthly_revenue_chf: string
  created_at: Date
  last_active_at: Date | null
  storage_mb: number
  trial_until: Date | null
  current_period_end: Date | null
  cancel_at_period_end: boolean
  scheduled_plan: SubscriptionPlan | null
  billing_provider: 'manual' | 'stripe'
}

type SignupRow = {
  id: string
  company_name: string
  owner_name: string
  email: string
  plan: SubscriptionPlan
  status: SignupRequest['status']
  created_at: Date
}

export async function listPlatformTenants(): Promise<PlatformTenant[]> {
  const result = await query<TenantRow>(
    `select pt.id as tenant_id, o.id as organization_id, o.name as company_name,
            pt.owner_name, pt.owner_email, s.plan, s.status as subscription_status,
            pt.platform_status, s.seats,
            count(m.id) filter (where m.status = 'active')::text as users,
            case when s.status = 'active' then s.unit_amount_chf else 0 end::text as monthly_revenue_chf,
            pt.created_at, pt.last_active_at, pt.storage_mb,
            s.trial_until, s.current_period_end, s.cancel_at_period_end,
            s.scheduled_plan, s.billing_provider
       from platform_tenants pt
       join organizations o on o.id = pt.organization_id
       join organization_subscriptions s on s.organization_id = o.id
       left join organization_memberships m on m.organization_id = o.id
      group by pt.id, o.id, o.name, pt.owner_name, pt.owner_email, s.plan, s.status,
               pt.platform_status, s.seats, pt.created_at, pt.last_active_at, pt.storage_mb,
               s.unit_amount_chf, s.trial_until, s.current_period_end, s.cancel_at_period_end,
               s.scheduled_plan, s.billing_provider
      order by pt.created_at desc`,
  )
  return result.rows.map((row) => ({
    id: row.tenant_id,
    organizationId: row.organization_id,
    companyName: row.company_name,
    ownerName: row.owner_name,
    ownerEmail: row.owner_email,
    plan: row.plan,
    status: row.platform_status,
    subscriptionStatus: row.subscription_status,
    seats: row.seats,
    users: Number(row.users),
    monthlyRevenueChf: Number(row.monthly_revenue_chf),
    createdAt: row.created_at.toISOString(),
    lastActiveAt: (row.last_active_at ?? row.created_at).toISOString(),
    storageMb: row.storage_mb,
    trialUntil: row.trial_until?.toISOString(),
    currentPeriodEnd: row.current_period_end?.toISOString(),
    cancelAtPeriodEnd: row.cancel_at_period_end,
    scheduledPlan: row.scheduled_plan ?? undefined,
    billingProvider: row.billing_provider,
  }))
}

export async function listPlatformSignups(): Promise<SignupRequest[]> {
  const result = await query<SignupRow>(
    `select id, company_name, owner_name, email, plan, status, created_at
       from signup_requests
      order by created_at desc
      limit 100`,
  )
  return result.rows.map((row) => ({
    id: row.id,
    companyName: row.company_name,
    ownerName: row.owner_name,
    email: row.email,
    plan: row.plan,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  }))
}

export async function updatePlatformSubscription(input: {
  tenantId: string
  actorUserId: string
  actorEmail: string
  plan: SubscriptionPlan
  status: PlatformTenant['status']
  reason: string
}) {
  return withTransaction(async (client) => {
    const currentResult = await client.query<{
      organization_id: string
      subscription_id: string
      plan: SubscriptionPlan
      subscription_status: SubscriptionStatus
      platform_status: PlatformTenant['status']
      billing_provider: 'manual' | 'stripe'
    }>(
      `select pt.organization_id, s.id as subscription_id, s.plan,
              s.status as subscription_status, pt.platform_status, s.billing_provider
         from platform_tenants pt
         join organization_subscriptions s on s.organization_id = pt.organization_id
        where pt.id = $1
        for update`,
      [input.tenantId],
    )
    const current = currentResult.rows[0]
    if (!current) throw new Error('Mandant wurde nicht gefunden.')

    if (current.billing_provider === 'stripe') {
      if (input.plan !== current.plan) throw new Error('Stripe verwaltet den Plan. Planwechsel über Stripe durchführen.')
      if (input.status !== 'active' && input.status !== 'suspended') throw new Error('Der Zahlungsstatus wird durch Stripe synchronisiert.')
      await client.query(
        `update platform_tenants set platform_status = $2, last_active_at = coalesce(last_active_at, now()) where id = $1`,
        [input.tenantId, input.status === 'active' ? current.subscription_status : input.status],
      )
      await client.query(
        `insert into platform_audit_events (actor_user_id, actor_email, action, tenant_id, detail)
         values ($1, $2, 'tenant.platform_status.updated', $3, $4)`,
        [input.actorUserId, input.actorEmail, input.tenantId, `${current.platform_status} -> ${input.status}; reason=${input.reason}`],
      )
      return { organizationId: current.organization_id }
    }

    const plan = getPlan(input.plan)
    const activeUsers = await client.query<{ count: string }>(
      `select count(*)::text as count from organization_memberships where organization_id = $1 and status = 'active'`,
      [current.organization_id],
    )
    const seats = Math.max(Number(activeUsers.rows[0]?.count ?? 0), plan.includedUsers)
    const subscriptionStatus: SubscriptionStatus = input.status === 'archived'
      ? current.subscription_status
      : input.status
    const amount = plan.monthlyPriceChf ?? 0

    await client.query(
      `update organization_subscriptions
          set plan = $2, status = $3, seats = $4, unit_amount_chf = $5,
              scheduled_plan = null,
              cancel_at_period_end = case when $3 = 'cancelled' then false else cancel_at_period_end end,
              cancelled_at = case when $3 = 'cancelled' then coalesce(cancelled_at, now()) else null end,
              updated_at = now()
        where organization_id = $1`,
      [current.organization_id, input.plan, subscriptionStatus, seats, amount],
    )
    await client.query(
      `update organization_entitlements
          set features = $2, max_users = $3, max_storage_mb = $4, updated_at = now()
        where organization_id = $1`,
      [current.organization_id, plan.features, seats, plan.maxStorageMb],
    )
    await client.query(
      `update platform_tenants
          set platform_status = $2, seats = $3,
              monthly_revenue_chf = case when $2 = 'active' then $4 else 0 end,
              last_active_at = coalesce(last_active_at, now())
        where id = $1`,
      [input.tenantId, input.status, seats, amount],
    )
    await client.query(
      `update organizations
          set status = case
            when $2 in ('trial','active','past_due') then 'active'
            when $2 = 'grace_period' then 'grace_period'
            when $2 in ('read_only','expired') then 'read_only'
            when $2 = 'suspended' then 'suspended'
            when $2 = 'cancelled' then 'cancelled'
            when $2 = 'archived' then 'archived'
            else status end,
              updated_at = now()
        where id = $1`,
      [current.organization_id, input.status],
    )
    await client.query(
      `insert into subscription_events
        (organization_id, subscription_id, actor_user_id, source, event_type, previous_plan, new_plan, previous_status, new_status, detail)
       values ($1, $2, $3, 'platform_admin', 'subscription.updated', $4, $5, $6, $7, $8)`,
      [current.organization_id, current.subscription_id, input.actorUserId, current.plan, input.plan, current.platform_status, input.status, 'Plan or subscription status changed by platform administration'],
    )
    await client.query(
      `insert into platform_audit_events (actor_user_id, actor_email, action, tenant_id, detail)
       values ($1, $2, 'subscription.updated', $3, $4)`,
      [input.actorUserId, input.actorEmail, input.tenantId, `${current.plan}/${current.platform_status} -> ${input.plan}/${input.status}; reason=${input.reason}`],
    )
    return { organizationId: current.organization_id }
  })
}

export async function getOrganizationSubscription(organizationId: string) {
  const result = await query<{
    id: string
    organization_id: string
    plan: SubscriptionPlan
    status: SubscriptionStatus
    seats: number
    trial_until: Date | null
    current_period_end: Date | null
    billing_provider: 'manual' | 'stripe'
    billing_interval: 'monthly' | 'yearly'
    unit_amount_chf: string
    cancel_at_period_end: boolean
    scheduled_plan: SubscriptionPlan | null
  }>(
    `select id, organization_id, plan, status, seats, trial_until, current_period_end,
            billing_provider, billing_interval, unit_amount_chf::text,
            cancel_at_period_end, scheduled_plan
       from organization_subscriptions
      where organization_id = $1`,
    [organizationId],
  )
  const row = result.rows[0]
  if (!row) return null
  return {
    id: row.id,
    organizationId: row.organization_id,
    plan: row.plan,
    status: row.status,
    seats: row.seats,
    trialUntil: row.trial_until?.toISOString(),
    currentPeriodEnd: row.current_period_end?.toISOString(),
    billingProvider: row.billing_provider,
    billingInterval: row.billing_interval,
    unitAmountChf: Number(row.unit_amount_chf),
    cancelAtPeriodEnd: row.cancel_at_period_end,
    scheduledPlan: row.scheduled_plan ?? undefined,
  }
}

export async function requestSubscriptionChange(input: {
  organizationId: string
  actorUserId: string
  action: 'change_plan' | 'cancel' | 'reactivate'
  plan?: SubscriptionPlan
}) {
  return withTransaction(async (client) => {
    const result = await client.query<{
      id: string
      plan: SubscriptionPlan
      status: SubscriptionStatus
      seats: number
      billing_provider: 'manual' | 'stripe'
    }>(
      `select id, plan, status, seats, billing_provider
         from organization_subscriptions
        where organization_id = $1
        for update`,
      [input.organizationId],
    )
    const current = result.rows[0]
    if (!current) throw new Error('Abonnement wurde nicht gefunden.')
    if (current.billing_provider === 'stripe') {
      throw new Error('Dieses Abonnement wird durch Stripe verwaltet. Bitte das Abrechnungsportal verwenden.')
    }

    if (input.action === 'cancel') {
      await client.query(
        `update organization_subscriptions set cancel_at_period_end = true, updated_at = now() where id = $1`,
        [current.id],
      )
      await insertSubscriptionEvent(client, input.organizationId, current.id, input.actorUserId, 'customer', 'subscription.cancellation_requested', current.plan, current.plan, current.status, current.status, 'Cancellation requested for period end')
      return { mode: 'scheduled' as const }
    }

    if (input.action === 'reactivate') {
      await client.query(
        `update organization_subscriptions set cancel_at_period_end = false, cancelled_at = null, updated_at = now() where id = $1`,
        [current.id],
      )
      await insertSubscriptionEvent(client, input.organizationId, current.id, input.actorUserId, 'customer', 'subscription.cancellation_revoked', current.plan, current.plan, current.status, current.status, 'Cancellation request revoked')
      return { mode: 'active' as const }
    }

    if (!input.plan) throw new Error('Plan fehlt.')
    const nextPlan = getPlan(input.plan)
    if (current.status === 'trial') {
      const activeUsers = await client.query<{ count: string }>(
        `select count(*)::text as count from organization_memberships where organization_id = $1 and status = 'active'`,
        [input.organizationId],
      )
      const seats = Math.max(Number(activeUsers.rows[0]?.count ?? 0), nextPlan.includedUsers)
      await client.query(
        `update organization_subscriptions
            set plan = $2, seats = $3, unit_amount_chf = $4, scheduled_plan = null, updated_at = now()
          where id = $1`,
        [current.id, input.plan, seats, nextPlan.monthlyPriceChf ?? 0],
      )
      await client.query(
        `update organization_entitlements
            set features = $2, max_users = $3, max_storage_mb = $4, updated_at = now()
          where organization_id = $1`,
        [input.organizationId, nextPlan.features, seats, nextPlan.maxStorageMb],
      )
      await client.query(
        `update platform_tenants set seats = $2 where organization_id = $1`,
        [input.organizationId, seats],
      )
      await insertSubscriptionEvent(client, input.organizationId, current.id, input.actorUserId, 'customer', 'subscription.plan_changed', current.plan, input.plan, current.status, current.status, 'Plan changed during trial')
      return { mode: 'immediate' as const }
    }

    await client.query(
      `update organization_subscriptions set scheduled_plan = $2, updated_at = now() where id = $1`,
      [current.id, input.plan],
    )
    await insertSubscriptionEvent(client, input.organizationId, current.id, input.actorUserId, 'customer', 'subscription.plan_change_requested', current.plan, input.plan, current.status, current.status, 'Plan change scheduled; payment provider processing pending')
    return { mode: 'scheduled' as const }
  })
}

async function insertSubscriptionEvent(
  client: import('pg').PoolClient,
  organizationId: string,
  subscriptionId: string,
  actorUserId: string,
  source: 'platform_admin' | 'customer' | 'system' | 'webhook',
  eventType: string,
  previousPlan: SubscriptionPlan,
  newPlan: SubscriptionPlan,
  previousStatus: string,
  newStatus: string,
  detail: string,
) {
  await client.query(
    `insert into subscription_events
      (organization_id, subscription_id, actor_user_id, source, event_type, previous_plan, new_plan, previous_status, new_status, detail)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [organizationId, subscriptionId, actorUserId, source, eventType, previousPlan, newPlan, previousStatus, newStatus, detail],
  )
}
