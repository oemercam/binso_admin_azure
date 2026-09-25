import 'server-only'
import { query, withTransaction } from '@/lib/db/client'
import { getPlan } from '@/lib/data/plans'
import { stripePlanForPriceId, stripeGet } from '@/lib/billing/stripe'
import type { SubscriptionPlan, SubscriptionStatus } from '@/types/domain'

type BillingIdentity = {
  subscriptionId: string
  organizationId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  billingCustomerId: string | null
  billingSubscriptionId: string | null
  billingProvider: 'manual' | 'stripe'
  ownerEmail: string
  organizationName: string
}

export async function getBillingIdentity(organizationId: string): Promise<BillingIdentity | null> {
  const result = await query<{
    subscription_id: string
    organization_id: string
    plan: SubscriptionPlan
    status: SubscriptionStatus
    billing_customer_id: string | null
    billing_subscription_id: string | null
    billing_provider: 'manual' | 'stripe'
    owner_email: string
    organization_name: string
  }>(
    `select s.id as subscription_id, s.organization_id, s.plan, s.status,
            s.billing_customer_id, s.billing_subscription_id, s.billing_provider,
            pt.owner_email, o.name as organization_name
       from organization_subscriptions s
       join organizations o on o.id = s.organization_id
       join platform_tenants pt on pt.organization_id = s.organization_id
      where s.organization_id = $1`,
    [organizationId],
  )
  const row = result.rows[0]
  if (!row) return null
  return {
    subscriptionId: row.subscription_id,
    organizationId: row.organization_id,
    plan: row.plan,
    status: row.status,
    billingCustomerId: row.billing_customer_id,
    billingSubscriptionId: row.billing_subscription_id,
    billingProvider: row.billing_provider,
    ownerEmail: row.owner_email,
    organizationName: row.organization_name,
  }
}

export async function saveStripeCustomer(organizationId: string, customerId: string) {
  await query(
    `update organization_subscriptions
        set billing_customer_id = $2, updated_at = now()
      where organization_id = $1`,
    [organizationId, customerId],
  )
}

export async function registerWebhookEvent(input: {
  externalEventId: string
  eventType: string
  payload: unknown
  organizationId?: string | null
}) {
  const result = await query<{ id: string; status: string }>(
    `insert into billing_webhook_events (provider, external_event_id, event_type, organization_id, payload, processing_started_at, attempts)
     values ('stripe', $1, $2, $3, $4::jsonb, now(), 1)
     on conflict (provider, external_event_id) do update
       set status = 'received', processing_started_at = now(), attempts = billing_webhook_events.attempts + 1
       where billing_webhook_events.status = 'failed'
          or (billing_webhook_events.status = 'received' and billing_webhook_events.processing_started_at < now() - interval '5 minutes')
     returning id, status`,
    [input.externalEventId, input.eventType, input.organizationId ?? null, JSON.stringify(input.payload)],
  )
  return result.rows[0] ?? null
}

export async function completeWebhookEvent(externalEventId: string, status: 'processed' | 'failed' | 'ignored', error?: string) {
  await query(
    `update billing_webhook_events
        set status = $2, processed_at = now(), error = $3
      where provider = 'stripe' and external_event_id = $1`,
    [externalEventId, status, error ?? null],
  )
}

function mapStripeStatus(status: string): SubscriptionStatus {
  if (status === 'active' || status === 'trialing') return status === 'trialing' ? 'trial' : 'active'
  if (status === 'canceled') return 'cancelled'
  if (status === 'past_due') return 'past_due'
  return 'expired'
}

function unixDate(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? new Date(value * 1000) : null
}

export async function applyStripeSubscription(input: {
  organizationId: string
  stripeSubscriptionId: string
  stripeCustomerId?: string | null
  stripeStatus: string
  priceId?: string | null
  currentPeriodEnd?: number | null
  cancelAtPeriodEnd?: boolean | null
  eventId: string
}) {
  return withTransaction(async (client) => {
    const currentResult = await client.query<{
      id: string
      plan: SubscriptionPlan
      status: SubscriptionStatus
      billing_last_event_id: string | null
      stripe_subscription_created: string | null
    }>(
      `select id, plan, status, billing_last_event_id, stripe_subscription_created::text from organization_subscriptions where organization_id = $1 for update`,
      [input.organizationId],
    )
    const current = currentResult.rows[0]
    if (!current) throw new Error('Abonnement wurde nicht gefunden.')
    if (current.billing_last_event_id === input.eventId) return
    // Read the authoritative provider state under the subscription lock. Stripe
    // does not guarantee event order, including invoice/subscription events.
    const live = await stripeGet<{ status: string; created: number; trial_end?: number; customer: string; metadata?: { organizationId?: string }; cancel_at_period_end: boolean; current_period_end?: number; items: { data: Array<{ current_period_end?: number; price: { id: string } }> } }>(`/subscriptions/${encodeURIComponent(input.stripeSubscriptionId)}`)
    if (live.metadata?.organizationId !== input.organizationId) throw new Error('Stripe-Mandant stimmt nicht überein.')
    if (current.stripe_subscription_created && live.created < Number(current.stripe_subscription_created)) return
    input = { ...input, stripeStatus: live.status, stripeCustomerId: live.customer, priceId: live.items.data[0]?.price.id,
      currentPeriodEnd: live.items.data[0]?.current_period_end ?? live.current_period_end, cancelAtPeriodEnd: live.cancel_at_period_end }

    const mappedPlan = stripePlanForPriceId(input.priceId)
    if (!mappedPlan) throw new Error('Unbekannte Stripe Price-ID.')
    const plan = getPlan(mappedPlan)
    const nextStatus = mapStripeStatus(input.stripeStatus)
    const periodEnd = unixDate(input.currentPeriodEnd)

    await client.query(
      `update organization_subscriptions
          set plan = $2, status = $3, billing_provider = 'stripe',
              billing_customer_id = coalesce($4, billing_customer_id),
              billing_subscription_id = $5,
              unit_amount_chf = $6,
              current_period_end = coalesce($7, current_period_end),
              next_billing_at = coalesce($7, next_billing_at),
              cancel_at_period_end = coalesce($8, cancel_at_period_end),
              scheduled_plan = null,
              cancelled_at = case when $3 = 'cancelled' then coalesce(cancelled_at, now()) else null end,
              grace_until = case when $3 = 'active' then null else grace_until end,
              stripe_subscription_created = $10, trial_until = coalesce($11, trial_until),
              billing_last_synced_at = now(), billing_last_event_id = $9, updated_at = now()
        where id = $1`,
      [current.id, mappedPlan, nextStatus, input.stripeCustomerId ?? null, input.stripeSubscriptionId,
        plan.monthlyPriceChf ?? 0, periodEnd, input.cancelAtPeriodEnd ?? null, input.eventId, live.created, unixDate(live.trial_end)],
    )

    await client.query(
      `update organization_entitlements
          set features = $2, max_users = $3, max_storage_mb = $4, updated_at = now()
        where organization_id = $1`,
      [input.organizationId, plan.features, plan.includedUsers, plan.maxStorageMb],
    )
    await client.query(
      `update platform_tenants
          set platform_status = case when platform_status = 'suspended' then 'suspended' else $2 end,
              monthly_revenue_chf = case when $2 = 'active' then $3 else 0 end,
              seats = greatest(seats, $4), last_active_at = now()
        where organization_id = $1`,
      [input.organizationId, nextStatus, plan.monthlyPriceChf ?? 0, plan.includedUsers],
    )
    await client.query(
      `update organizations
          set status = case
            when $2 in ('trial','active','past_due') then 'active'
            when $2 = 'cancelled' then 'cancelled'
            else status end,
              updated_at = now()
        where id = $1`,
      [input.organizationId, nextStatus],
    )
    await client.query(
      `insert into subscription_events
        (organization_id, subscription_id, actor_user_id, source, event_type, previous_plan, new_plan, previous_status, new_status, detail)
       values ($1,$2,'stripe','webhook','stripe.subscription.synced',$3,$4,$5,$6,$7)`,
      [input.organizationId, current.id, current.plan, mappedPlan, current.status, nextStatus, `Stripe event ${input.eventId}`],
    )
  })
}

export async function findOrganizationByStripeCustomer(customerId: string) {
  const result = await query<{ organization_id: string }>(
    `select organization_id from organization_subscriptions where billing_customer_id = $1 limit 1`,
    [customerId],
  )
  return result.rows[0]?.organization_id ?? null
}

