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
  onboarding_status: 'not_started'|'in_progress'|'completed'|'skipped'
  onboarding_step: number
  onboarding_completed_steps: unknown
  onboarding_module_preferences: unknown
  onboarding_business_settings: unknown
}

export type PersistedSignup = SignupRequest & {
  updatedAt: string
  organizationId?: string
  onboardingStatus: 'not_started'|'in_progress'|'completed'|'skipped'
  onboardingStep: number
  onboardingCompletedSteps: number[]
  onboardingModulePreferences: string[]
  onboardingBusinessSettings: Record<string,string|number|boolean>
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
    onboardingStatus: row.onboarding_status ?? 'not_started',
    onboardingStep: row.onboarding_step ?? 1,
    onboardingCompletedSteps: Array.isArray(row.onboarding_completed_steps) ? row.onboarding_completed_steps.filter((x): x is number => typeof x === 'number') : [],
    onboardingModulePreferences: Array.isArray(row.onboarding_module_preferences) ? row.onboarding_module_preferences.filter((x): x is string => typeof x === 'string') : [],
    onboardingBusinessSettings: row.onboarding_business_settings && typeof row.onboarding_business_settings === 'object' && !Array.isArray(row.onboarding_business_settings) ? row.onboarding_business_settings as Record<string,string|number|boolean> : {},
  }
}

export async function findOpenSignupForUser(userId: string): Promise<PersistedSignup | null> {
  const result = await query<SignupRow>(
    `select id, company_name, owner_name, email, plan, status, created_at, updated_at, organization_id, onboarding_status, onboarding_step, onboarding_completed_steps, onboarding_module_preferences, onboarding_business_settings
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
     returning id, company_name, owner_name, email, plan, status, created_at, updated_at, organization_id, onboarding_status, onboarding_step, onboarding_completed_steps, onboarding_module_preferences, onboarding_business_settings`,
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


export async function updateSignupOnboarding(input: { userId: string; signupId: string; step: number; completedSteps: number[]; modulePreferences: string[]; businessSettings: Record<string,string|number|boolean>; status?: 'not_started'|'in_progress'|'completed'|'skipped' }) {
  const result = await query<SignupRow>(
    `update signup_requests set onboarding_status=$3,onboarding_step=$4,onboarding_completed_steps=$5::jsonb,onboarding_module_preferences=$6::jsonb,onboarding_business_settings=$7::jsonb,onboarding_updated_at=now(),updated_at=now() where id=$1 and user_id=$2 and status in ('started','account_created') returning id, company_name, owner_name, email, plan, status, created_at, updated_at, organization_id, onboarding_status, onboarding_step, onboarding_completed_steps, onboarding_module_preferences, onboarding_business_settings`,
    [input.signupId,input.userId,input.status ?? 'in_progress',Math.min(Math.max(input.step,1),5),JSON.stringify(input.completedSteps),JSON.stringify(input.modulePreferences),JSON.stringify(input.businessSettings)],
  )
  return result.rows[0] ? mapSignup(result.rows[0]) : null
}
