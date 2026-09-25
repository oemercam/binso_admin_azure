import 'server-only'
import { query } from '@/lib/db/client'
import { withTenantTransaction } from '@/lib/db/tenant'
import type { SupportAccessGrant } from '@/types/domain'

type SupportAccessRow = {
  id: string
  organization_id: string
  requested_by_user_id: string
  approved_by_user_id: string | null
  platform_actor_user_id: string | null
  reason: string
  status: SupportAccessGrant['status']
  valid_from: Date | null
  valid_until: Date | null
  created_at: Date
}

function mapGrant(row: SupportAccessRow): SupportAccessGrant {
  return {
    id: row.id,
    organizationId: row.organization_id,
    requestedByUserId: row.requested_by_user_id,
    approvedByUserId: row.approved_by_user_id ?? undefined,
    platformActorUserId: row.platform_actor_user_id ?? undefined,
    reason: row.reason,
    status: row.status,
    validFrom: row.valid_from?.toISOString(),
    validUntil: row.valid_until?.toISOString(),
    createdAt: row.created_at.toISOString(),
  }
}

export async function listTenantSupportAccess(context: { organizationId: string; userId: string }) {
  return withTenantTransaction(context, async (client) => {
    const result = await client.query<SupportAccessRow>(
      `select id,organization_id,requested_by_user_id,approved_by_user_id,platform_actor_user_id,reason,status,valid_from,valid_until,created_at
         from support_access_grants
        where organization_id=$1
        order by created_at desc
        limit 50`,
      [context.organizationId],
    )
    return result.rows.map(mapGrant)
  })
}

export async function requestTenantSupportAccess(input: { organizationId: string; userId: string; actorName: string; reason: string }) {
  return withTenantTransaction({ organizationId: input.organizationId, userId: input.userId }, async (client) => {
    const result = await client.query<SupportAccessRow>(
      `insert into support_access_grants(organization_id,requested_by_user_id,reason,status)
       values($1,$2,$3,'requested')
       returning id,organization_id,requested_by_user_id,approved_by_user_id,platform_actor_user_id,reason,status,valid_from,valid_until,created_at`,
      [input.organizationId, input.userId, input.reason],
    )
    await client.query(
      `insert into audit_events(organization_id,actor_user_id,actor_name,action,entity_type,entity_id,detail)
       values($1,$2,$3,'support.access.requested','support_access_grant',$4,$5)`,
      [input.organizationId, input.userId, input.actorName, result.rows[0].id, input.reason],
    )
    return mapGrant(result.rows[0])
  })
}

export async function revokeTenantSupportAccess(input: { organizationId: string; userId: string; actorName: string; grantId: string }) {
  return withTenantTransaction({ organizationId: input.organizationId, userId: input.userId }, async (client) => {
    const result = await client.query<SupportAccessRow>(
      `update support_access_grants
          set status='revoked', valid_until=coalesce(valid_until,now()), updated_at=now()
        where organization_id=$1 and id=$2 and status in ('requested','approved','active')
        returning id,organization_id,requested_by_user_id,approved_by_user_id,platform_actor_user_id,reason,status,valid_from,valid_until,created_at`,
      [input.organizationId, input.grantId],
    )
    if (!result.rows[0]) throw new Error('Supportzugriff wurde nicht gefunden oder ist bereits beendet.')
    await client.query(
      `insert into audit_events(organization_id,actor_user_id,actor_name,action,entity_type,entity_id,detail)
       values($1,$2,$3,'support.access.revoked','support_access_grant',$4,'Tenant revoked support access')`,
      [input.organizationId, input.userId, input.actorName, input.grantId],
    )
    return mapGrant(result.rows[0])
  })
}

export async function listPlatformSupportAccess() {
  const result = await query<SupportAccessRow & { organization_name: string }>(
    `select g.id,g.organization_id,g.requested_by_user_id,g.approved_by_user_id,g.platform_actor_user_id,g.reason,g.status,g.valid_from,g.valid_until,g.created_at,o.name as organization_name
       from support_access_grants g
       join organizations o on o.id=g.organization_id
      order by case g.status when 'requested' then 0 when 'active' then 1 else 2 end, g.created_at desc
      limit 200`,
  )
  return result.rows.map((row) => ({ ...mapGrant(row), organizationName: row.organization_name }))
}

export async function updatePlatformSupportAccess(input: {
  grantId: string
  platformActorUserId: string
  platformActorEmail: string
  action: 'approve' | 'activate' | 'revoke'
  durationHours?: number
}) {
  const durationHours = Math.min(Math.max(input.durationHours ?? 4, 1), 8)
  const result = await query<SupportAccessRow>(
    `update support_access_grants
        set status = case $2 when 'approve' then 'approved' when 'activate' then 'active' else 'revoked' end,
            approved_by_user_id = case when $2 in ('approve','activate') then coalesce(approved_by_user_id,$3) else approved_by_user_id end,
            platform_actor_user_id = $3,
            valid_from = case when $2='activate' then now() else valid_from end,
            valid_until = case when $2='activate' then now() + make_interval(hours => $4::int) when $2='revoke' then now() else valid_until end,
            updated_at = now()
      where id=$1
        and (($2='approve' and status='requested') or ($2='activate' and status in ('requested','approved')) or ($2='revoke' and status in ('requested','approved','active')))
      returning id,organization_id,requested_by_user_id,approved_by_user_id,platform_actor_user_id,reason,status,valid_from,valid_until,created_at`,
    [input.grantId, input.action, input.platformActorUserId, durationHours],
  )
  const grant = result.rows[0]
  if (!grant) throw new Error('Supportzugriff kann in diesem Status nicht geändert werden.')
  await query(
    `insert into platform_audit_events(actor_user_id,actor_email,action,tenant_id,detail)
     values($1,$2,$3,$4,$5)`,
    [input.platformActorUserId, input.platformActorEmail, `support.access.${input.action}`, grant.organization_id, input.grantId],
  )
  return mapGrant(grant)
}
