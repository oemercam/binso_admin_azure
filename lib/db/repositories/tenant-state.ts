import 'server-only'
import { withTenantTransaction } from '@/lib/db/tenant'
import { mergeAuthorizedState, validateFinancialChanges, type StateActor } from '@/lib/auth/business-state-policy'
import type { Role } from '@/types/domain'

export type TenantStateRecord = {
  state: Record<string, unknown>
  version: number
  updatedAt: string | null
}

export async function getTenantBusinessState(context: { organizationId: string; userId: string }): Promise<TenantStateRecord> {
  return withTenantTransaction(context, async (client) => {
    const result = await client.query<{ state: Record<string, unknown>; version: string; updated_at: Date }>(
      `select state, version::text, updated_at
         from tenant_business_state
        where organization_id = $1`,
      [context.organizationId],
    )
    const row = result.rows[0]
    return row
      ? { state: row.state ?? {}, version: Number(row.version), updatedAt: row.updated_at.toISOString() }
      : { state: {}, version: 0, updatedAt: null }
  })
}

export async function saveTenantBusinessState(input: {
  organizationId: string
  userId: string
  expectedVersion: number
  state: Record<string, unknown>
  actor: StateActor
}) {
  return withTenantTransaction({ organizationId: input.organizationId, userId: input.userId }, async (client) => {
    await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [input.organizationId])
    const access = await client.query<{ role: Role; features: string[] }>(`select m.role,e.features from organization_memberships m
      join organization_entitlements e on e.organization_id=m.organization_id
      join organizations o on o.id=m.organization_id and o.status='active'
      join platform_tenants pt on pt.organization_id=m.organization_id
      join organization_subscriptions s on s.organization_id=m.organization_id
      where m.organization_id=$1 and m.user_id=$2 and m.status='active'
      and (pt.platform_status in ('active','past_due') or (pt.platform_status='trial' and s.trial_until>now()))`, [input.organizationId, input.userId])
    if (!access.rows[0]) throw new Error('state_forbidden')
    input.actor = { ...input.actor, role: access.rows[0].role, features: access.rows[0].features }
    const current = await client.query<{ version: string; state: Record<string, unknown> }>(
      `select version::text, state from tenant_business_state where organization_id = $1 for update`,
      [input.organizationId],
    )
    const currentVersion = current.rows[0] ? Number(current.rows[0].version) : 0
    if (currentVersion !== input.expectedVersion) {
      return { saved: false as const, conflict: true as const, version: currentVersion }
    }

    const state = mergeAuthorizedState(current.rows[0]?.state ?? {}, input.state, input.actor)
    validateFinancialChanges(current.rows[0]?.state ?? {}, state)
    const nextVersion = currentVersion + 1
    await client.query(
      `insert into tenant_business_state (organization_id, state, version, updated_by, updated_at)
       values ($1, $2::jsonb, $3, $4, now())
       on conflict (organization_id) do update
         set state = excluded.state,
             version = excluded.version,
             updated_by = excluded.updated_by,
             updated_at = now()`,
      [input.organizationId, JSON.stringify(state), nextVersion, input.userId],
    )

    await client.query(`insert into audit_events (organization_id, actor_user_id, actor_name, action, entity_type, detail)
      values ($1,$2,$3,'business.saved','business_state',$4)`,
      [input.organizationId, input.userId, input.actor.email, `Version ${nextVersion}`])
    return { saved: true as const, conflict: false as const, version: nextVersion }
  })
}
