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

type SignupRow = {
  id: string
  company_name: string
  owner_name: string
  email: string
  plan: SubscriptionPlan
  status: 'started' | 'account_created' | 'trial_started' | 'active' | 'cancelled'
  organization_id: string | null
  onboarding_business_settings: unknown
}

export async function createTrialOrganization(input: {
  signupId: string
  userId: string
  userEmail: string
  userName: string
}) {
  return withTransaction(async (client) => {
    const signupResult = await client.query<SignupRow>(
      `select id, company_name, owner_name, email, plan, status, organization_id, onboarding_business_settings
         from signup_requests
        where id = $1 and user_id = $2
        for update`,
      [input.signupId, input.userId],
    )
    const signup = signupResult.rows[0]
    if (!signup) throw new Error('Registrierung wurde nicht gefunden.')
    if (signup.status === 'cancelled') throw new Error('Diese Registrierung wurde abgebrochen.')
    if (signup.email.trim().toLowerCase() !== input.userEmail.trim().toLowerCase()) {
      throw new Error('Die Registrierung gehört nicht zum angemeldeten Konto.')
    }

    if (signup.organization_id) {
      return { organizationId: signup.organization_id, created: false }
    }

    const plan = getPlan(signup.plan)
    const onboardingSettings = signup.onboarding_business_settings && typeof signup.onboarding_business_settings === 'object' && !Array.isArray(signup.onboarding_business_settings)
      ? signup.onboarding_business_settings as Record<string, unknown>
      : {}
    const profileAddress = typeof onboardingSettings.address === 'string' ? onboardingSettings.address.trim() : ''
    const profileZip = typeof onboardingSettings.zip === 'string' ? onboardingSettings.zip.trim() : ''
    const profileCity = typeof onboardingSettings.city === 'string' ? onboardingSettings.city.trim() : ''
    const profileUid = typeof onboardingSettings.uid === 'string' ? onboardingSettings.uid.trim() : ''
    const slug = await uniqueSlug(client, signup.company_name)
    const organization = await client.query<{ id: string }>(
      `insert into organizations (name, slug, status, country, currency, locale)
       values ($1, $2, 'active', 'Schweiz', 'CHF', 'de-CH')
       returning id`,
      [signup.company_name.trim(), slug],
    )
    const organizationId = organization.rows[0].id
    const trialUntil = new Date(Date.now() + 14 * 86_400_000)
    const maxStorageMb = plan.maxStorageMb

    await client.query(
      `insert into organization_memberships (organization_id, user_id, email, role, role_id, status)
       values ($1, $2, $3, 'owner', (select id from organization_roles where organization_id = $1 and code = 'owner' limit 1), 'active')`,
      [organizationId, input.userId, input.userEmail],
    )
    await client.query(
      `insert into organization_subscriptions (organization_id, plan, status, seats, trial_until, billing_provider, billing_interval, unit_amount_chf)
       values ($1, $2, 'trial', $3, $4, 'manual', 'monthly', $5)`,
      [organizationId, signup.plan, plan.includedUsers, trialUntil, plan.monthlyPriceChf ?? 0],
    )
    await client.query(
      `insert into organization_entitlements (organization_id, features, max_users, max_storage_mb)
       values ($1, $2, $3, $4)`,
      [organizationId, plan.features, plan.includedUsers, maxStorageMb],
    )
    await client.query(
      `insert into company_profile (organization_id, name, address, zip, city, country, email, uid, iban)
       values ($1, $2, $3, $4, $5, 'Schweiz', $6, $7, '')`,
      [organizationId, signup.company_name.trim(), profileAddress, profileZip, profileCity, input.userEmail, profileUid],
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
      [organizationId, signup.owner_name.trim() || input.userName, input.userEmail, plan.includedUsers],
    )
    await client.query(
      `update signup_requests
          set status = 'trial_started', organization_id = $2, onboarding_status='completed', onboarding_step=3, onboarding_updated_at=now(), updated_at = now(), completed_at = now()
        where id = $1`,
      [signup.id, organizationId],
    )
    await client.query(
      `insert into audit_events (organization_id, actor_user_id, actor_name, action, entity_type, entity_id, detail)
       values ($1, $2, $3, 'organization.created', 'organization', $4, 'Trial organisation created during onboarding')`,
      [organizationId, input.userId, input.userName, organizationId],
    )

    return { organizationId, created: true }
  })
}
