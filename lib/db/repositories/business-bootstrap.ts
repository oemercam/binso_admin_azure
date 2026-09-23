import 'server-only'
import { query } from '@/lib/db/client'
import type { BusinessBootstrap, CompanyProfile, Organization, OrganizationEntitlements, OrganizationMembership, OrganizationSubscription, OrganizationFeature, Role, SubscriptionPlan, SubscriptionStatus } from '@/types/domain'

type BootstrapRow = {
  organization_id: string
  organization_name: string
  organization_slug: string
  organization_status: 'active' | 'inactive'
  country: string
  currency: 'CHF' | 'EUR'
  locale: 'de-CH' | 'fr-CH' | 'it-CH' | 'en-CH'
  organization_created_at: Date
  organization_updated_at: Date
  membership_id: string
  user_id: string
  membership_email: string
  membership_role: Role
  membership_status: 'invited' | 'active' | 'suspended'
  membership_created_at: Date
  membership_updated_at: Date
  subscription_id: string | null
  plan: SubscriptionPlan | null
  subscription_status: SubscriptionStatus | null
  seats: number | null
  trial_until: Date | null
  billing_customer_id: string | null
  current_period_end: Date | null
  billing_subscription_id: string | null
  billing_provider: 'manual' | 'stripe' | null
  billing_interval: 'monthly' | 'yearly' | null
  unit_amount_chf: string | null
  next_billing_at: Date | null
  cancel_at_period_end: boolean | null
  cancelled_at: Date | null
  scheduled_plan: SubscriptionPlan | null
  features: OrganizationFeature[] | null
  max_users: number | null
  max_storage_mb: number | null
  profile_name: string | null
  address: string | null
  zip: string | null
  city: string | null
  profile_country: string | null
  profile_email: string | null
  phone: string | null
  uid: string | null
  iban: string | null
  bank_name: string | null
  website: string | null
}

export async function getBusinessBootstrapForUser(userId: string): Promise<BusinessBootstrap | null> {
  const result = await query<BootstrapRow>(
    `select
       o.id as organization_id, o.name as organization_name, o.slug as organization_slug,
       o.status as organization_status, o.country, o.currency, o.locale,
       o.created_at as organization_created_at, o.updated_at as organization_updated_at,
       m.id as membership_id, m.user_id, m.email as membership_email, m.role as membership_role,
       m.status as membership_status, m.created_at as membership_created_at, m.updated_at as membership_updated_at,
       s.id as subscription_id, s.plan, s.status as subscription_status, s.seats, s.trial_until,
       s.billing_customer_id, s.current_period_end, s.billing_subscription_id, s.billing_provider,
       s.billing_interval, s.unit_amount_chf::text, s.next_billing_at, s.cancel_at_period_end, s.cancelled_at, s.scheduled_plan,
       e.features, e.max_users, e.max_storage_mb,
       p.name as profile_name, p.address, p.zip, p.city, p.country as profile_country,
       p.email as profile_email, p.phone, p.uid, p.iban, p.bank_name, p.website
     from organization_memberships m
     join organizations o on o.id = m.organization_id
     join platform_tenants pt on pt.organization_id = o.id
     join organization_subscriptions access_subscription on access_subscription.organization_id = o.id
       and (pt.platform_status in ('active','past_due') or (pt.platform_status = 'trial' and access_subscription.trial_until is not null and access_subscription.trial_until > now()))
     left join organization_subscriptions s on s.organization_id = o.id
     left join organization_entitlements e on e.organization_id = o.id
     left join company_profile p on p.organization_id = o.id
     where m.user_id = $1 and m.status = 'active' and o.status = 'active'
     order by m.created_at asc`,
    [userId],
  )
  if (!result.rows.length) return null

  const organizations: Organization[] = result.rows.map((row) => ({
    id: row.organization_id,
    name: row.organization_name,
    slug: row.organization_slug,
    status: row.organization_status,
    country: row.country,
    currency: row.currency,
    locale: row.locale,
    createdAt: row.organization_created_at.toISOString(),
    updatedAt: row.organization_updated_at.toISOString(),
  }))
  const memberships: OrganizationMembership[] = result.rows.map((row) => ({
    id: row.membership_id,
    organizationId: row.organization_id,
    userId: row.user_id,
    email: row.membership_email,
    role: row.membership_role,
    status: row.membership_status,
    createdAt: row.membership_created_at.toISOString(),
    updatedAt: row.membership_updated_at.toISOString(),
  }))
  const subscriptions: OrganizationSubscription[] = result.rows.flatMap((row) => row.subscription_id && row.plan && row.subscription_status && row.seats ? [{
    id: row.subscription_id,
    organizationId: row.organization_id,
    plan: row.plan,
    status: row.subscription_status,
    seats: row.seats,
    trialUntil: row.trial_until?.toISOString(),
    billingCustomerId: row.billing_customer_id ?? undefined,
    currentPeriodEnd: row.current_period_end?.toISOString(),
    billingSubscriptionId: row.billing_subscription_id ?? undefined,
    billingProvider: row.billing_provider ?? undefined,
    billingInterval: row.billing_interval ?? undefined,
    unitAmountChf: row.unit_amount_chf ? Number(row.unit_amount_chf) : undefined,
    nextBillingAt: row.next_billing_at?.toISOString(),
    cancelAtPeriodEnd: row.cancel_at_period_end ?? false,
    cancelledAt: row.cancelled_at?.toISOString(),
    scheduledPlan: row.scheduled_plan ?? undefined,
  }] : [])
  const entitlements: OrganizationEntitlements[] = result.rows.flatMap((row) => row.features && row.max_users && row.max_storage_mb ? [{
    organizationId: row.organization_id,
    features: row.features,
    maxUsers: row.max_users,
    maxStorageMb: row.max_storage_mb,
  }] : [])
  const companyProfiles: Record<string, CompanyProfile> = {}
  for (const row of result.rows) {
    companyProfiles[row.organization_id] = {
      organizationId: row.organization_id,
      name: row.profile_name ?? row.organization_name,
      address: row.address ?? '',
      zip: row.zip ?? '',
      city: row.city ?? '',
      country: row.profile_country ?? row.country,
      uid: row.uid ?? '',
      email: row.profile_email ?? row.membership_email,
      phone: row.phone ?? '',
      website: row.website ?? '',
      iban: row.iban ?? '',
      bankName: row.bank_name ?? '',
      defaultPaymentDays: 30,
    }
  }

  return {
    organizations,
    currentOrganizationId: organizations[0].id,
    memberships,
    subscriptions,
    entitlements,
    companyProfiles,
  }
}
