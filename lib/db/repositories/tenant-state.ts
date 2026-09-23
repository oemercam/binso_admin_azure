import 'server-only'
import { withTenantTransaction } from '@/lib/db/tenant'

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
}) {
  return withTenantTransaction({ organizationId: input.organizationId, userId: input.userId }, async (client) => {
    const current = await client.query<{ version: string }>(
      `select version::text from tenant_business_state where organization_id = $1 for update`,
      [input.organizationId],
    )
    const currentVersion = current.rows[0] ? Number(current.rows[0].version) : 0
    if (currentVersion !== input.expectedVersion) {
      return { saved: false as const, conflict: true as const, version: currentVersion }
    }

    const nextVersion = currentVersion + 1
    await client.query(
      `insert into tenant_business_state (organization_id, state, version, updated_by, updated_at)
       values ($1, $2::jsonb, $3, $4, now())
       on conflict (organization_id) do update
         set state = excluded.state,
             version = excluded.version,
             updated_by = excluded.updated_by,
             updated_at = now()`,
      [input.organizationId, JSON.stringify(input.state), nextVersion, input.userId],
    )

    const auditEvents = Array.isArray(input.state.auditEvents) ? input.state.auditEvents.slice(-250) : []
    if (auditEvents.length > 0) {
      await client.query(
        `insert into audit_events
          (organization_id, actor_user_id, actor_name, action, entity_type, entity_id, detail, created_at, client_event_id)
         select $1,
                coalesce(nullif(event->>'actorUserId',''), $2),
                coalesce(nullif(event->>'actorName',''), 'Benutzer'),
                coalesce(nullif(event->>'action',''), 'business.changed'),
                coalesce(nullif(event->>'entityType',''), 'business'),
                nullif(event->>'entityId',''),
                nullif(event->>'detail',''),
                coalesce(nullif(event->>'createdAt','')::timestamptz, now()),
                event->>'id'
           from jsonb_array_elements($3::jsonb) event
          where nullif(event->>'id','') is not null
         on conflict (organization_id, client_event_id) where client_event_id is not null do nothing`,
        [input.organizationId, input.userId, JSON.stringify(auditEvents)],
      )
    }
    return { saved: true as const, conflict: false as const, version: nextVersion }
  })
}
