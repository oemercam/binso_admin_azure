import 'server-only'
import type { PoolClient } from 'pg'
import { withTransaction } from '@/lib/db/client'
import { getPlan } from '@/lib/data/plans'
import type { SubscriptionPlan } from '@/types/domain'

function safeSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'organisation'
}

async function uniqueSlug(client: PoolClient, name: string) {
  const base = safeSlug(name)
  for (let i = 0; i < 20; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`
    const existing = await client.query('select 1 from organizations where slug = $1 limit 1', [candidate])
    if (!existing.rowCount) return candidate
  }
  return `${base}-${Date.now()}`
}

export async function createTrialOrganization(input: {
  userId: string
  userEmail: string
  userName: string
  companyName: string
  ownerName: string
  plan: SubscriptionPlan
}) {
  return withTransaction(async (client) => {
    const existing = await client.query<{ organization_id: string }>(
      `select organization_id
         from organization_memberships
        where user_id = $1 and status = 'active'
        order by created_at asc
        limit 1`,
      [input.userId],
    )
    if (existing.rows[0]) {
      return { organizationId: existing.rows[0].organization_id, created: false }
    }

    const plan = getPlan(input.plan)
    const slug = await uniqueSlug(client, input.companyName)
    const organization = await client.query<{ id: string }>(
      `insert into organizations (name, slug, status, country, currency, locale)
       values ($1, $2, 'active', 'Schweiz', 'CHF', 'de-CH')
       returning id`,
      [input.companyName.trim(), slug],
    )
    const organizationId = organization.rows[0].id
    const trialUntil = new Date(Date.now() + 14 * 86_400_000)
    const maxStorageMb = input.plan === 'starter' ? 2048 : input.plan === 'business' ? 10240 : 51200

    await client.query(
      `insert into organization_memberships (organization_id, user_id, email, role, status)
       values ($1, $2, $3, 'owner', 'active')`,
      [organizationId, input.userId, input.userEmail],
    )
    await client.query(
      `insert into organization_subscriptions (organization_id, plan, status, seats, trial_until)
       values ($1, $2, 'trial', $3, $4)`,
      [organizationId, input.plan, plan.includedUsers, trialUntil],
    )
    await client.query(
      `insert into organization_entitlements (organization_id, features, max_users, max_storage_mb)
       values ($1, $2, $3, $4)`,
      [organizationId, plan.features, plan.includedUsers, maxStorageMb],
    )
    await client.query(
      `insert into company_profile (organization_id, name, address, zip, city, country, email, iban)
       values ($1, $2, '', '', '', 'Schweiz', $3, '')`,
      [organizationId, input.companyName.trim(), input.userEmail],
    )
    await client.query(
      `insert into number_sequences (organization_id, kind, prefix, next_value, padding, include_year)
       values
         ($1, 'customer', 'K', 1, 3, true),
         ($1, 'quote', 'AN', 1, 3, true),
         ($1, 'order', 'AU', 1, 3, true),
         ($1, 'contract', 'VT', 1, 3, true),
         ($1, 'invoice', 'RE', 1, 3, true),
         ($1, 'credit_note', 'GS', 1, 3, true)`,
      [organizationId],
    )
    await client.query(
      `insert into platform_tenants (organization_id, owner_name, owner_email, platform_status, seats, monthly_revenue_chf, storage_mb, last_active_at)
       values ($1, $2, $3, 'trial', $4, 0, 0, now())`,
      [organizationId, input.ownerName.trim() || input.userName, input.userEmail, plan.includedUsers],
    )
    await client.query(
      `insert into signup_requests (company_name, owner_name, email, plan, status, user_id, organization_id)
       values ($1, $2, $3, $4, 'trial_started', $5, $6)`,
      [input.companyName.trim(), input.ownerName.trim() || input.userName, input.userEmail, input.plan, input.userId, organizationId],
    )
    await client.query(
      `insert into audit_events (organization_id, actor_user_id, actor_name, action, entity_type, entity_id, detail)
       values ($1, $2, $3, 'organization.created', 'organization', $1::text, 'Trial organisation created during onboarding')`,
      [organizationId, input.userId, input.userName],
    )

    return { organizationId, created: true }
  })
}
