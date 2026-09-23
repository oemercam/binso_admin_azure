import 'server-only'
import { query } from '@/lib/db/client'
import type { SignupRequest, SubscriptionPlan } from '@/types/domain'

type SignupRow = {
  id: string
  company_name: string
  owner_name: string
  email: string
  plan: SubscriptionPlan
  status: SignupRequest['status']
  created_at: Date
  updated_at: Date
  organization_id: string | null
}

export type PersistedSignup = SignupRequest & {
  updatedAt: string
  organizationId?: string
}

function mapSignup(row: SignupRow): PersistedSignup {
  return {
    id: row.id,
    companyName: row.company_name,
    ownerName: row.owner_name,
    email: row.email,
    plan: row.plan,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    organizationId: row.organization_id ?? undefined,
  }
}

export async function findOpenSignupForUser(userId: string): Promise<PersistedSignup | null> {
  const result = await query<SignupRow>(
    `select id, company_name, owner_name, email, plan, status, created_at, updated_at, organization_id
       from signup_requests
      where user_id = $1 and status in ('started','account_created')
      order by updated_at desc
      limit 1`,
    [userId],
  )
  return result.rows[0] ? mapSignup(result.rows[0]) : null
}

export async function saveRegistration(input: {
  userId: string
  companyName: string
  ownerName: string
  email: string
  plan: SubscriptionPlan
}): Promise<PersistedSignup> {
  const result = await query<SignupRow>(
    `insert into signup_requests (company_name, owner_name, email, plan, status, user_id, updated_at)
     values ($1, $2, $3, $4, 'account_created', $5, now())
     on conflict (user_id) where user_id is not null and status in ('started','account_created')
     do update set
       company_name = excluded.company_name,
       owner_name = excluded.owner_name,
       email = excluded.email,
       plan = excluded.plan,
       status = 'account_created',
       updated_at = now()
     returning id, company_name, owner_name, email, plan, status, created_at, updated_at, organization_id`,
    [input.companyName.trim(), input.ownerName.trim(), input.email.trim().toLowerCase(), input.plan, input.userId],
  )
  return mapSignup(result.rows[0])
}

export async function cancelOpenSignup(userId: string) {
  await query(
    `update signup_requests
        set status = 'cancelled', updated_at = now(), completed_at = now()
      where user_id = $1 and status in ('started','account_created')`,
    [userId],
  )
}
