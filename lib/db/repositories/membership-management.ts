import 'server-only'
import { withTenantTransaction } from '@/lib/db/tenant'
import type { OrganizationMembership, Role } from '@/types/domain'

type MembershipRow = {
  id: string
  organization_id: string
  user_id: string
  email: string
  role: Role
  status: 'invited' | 'active' | 'suspended'
  created_at: Date
  updated_at: Date
}

function mapMembership(row: MembershipRow): OrganizationMembership {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

export async function listOrganizationMembers(context: { organizationId: string; userId: string }) {
  return withTenantTransaction(context, async (client) => {
    const result = await client.query<MembershipRow>(
      `select id, organization_id, user_id, email, role, status, created_at, updated_at
         from organization_memberships
        where organization_id = $1
        order by case status when 'active' then 0 when 'invited' then 1 else 2 end, created_at asc`,
      [context.organizationId],
    )
    return result.rows.map(mapMembership)
  })
}

export async function inviteOrganizationMember(input: {
  organizationId: string
  userId: string
  actorName: string
  email: string
  role: Role
  invitationUrl?: string
}) {
  return withTenantTransaction({ organizationId: input.organizationId, userId: input.userId }, async (client) => {
    await client.query('select pg_advisory_xact_lock(hashtextextended($1, 1))', [input.organizationId])
    const existing = await client.query<MembershipRow>(
      `select id, organization_id, user_id, email, role, status, created_at, updated_at
         from organization_memberships
        where organization_id = $1 and lower(email) = lower($2)
        limit 1`,
      [input.organizationId, input.email],
    )
    const existingMembership = existing.rows[0]
    if (existingMembership?.status === 'active') throw new Error('Dieser Benutzer ist bereits Mitglied der Organisation.')
    if (existingMembership?.status === 'suspended') throw new Error('Dieser Benutzer ist gesperrt. Ändere den Status der bestehenden Mitgliedschaft.')

    if (!existingMembership) {
      const limit = await client.query<{ max_users: number; used: string }>(
        `select e.max_users,
                count(m.id) filter (where m.status in ('active','invited'))::text as used
           from organization_entitlements e
           left join organization_memberships m on m.organization_id = e.organization_id
          where e.organization_id = $1
          group by e.max_users`,
        [input.organizationId],
      )
      const row = limit.rows[0]
      if (row && Number(row.used) >= row.max_users) throw new Error('Das Benutzerlimit des Abonnements ist erreicht.')
    }

    const invitedUserId = `invited:${input.email.toLowerCase()}`
    const result = existingMembership
      ? await client.query<MembershipRow>(
          `update organization_memberships
              set role = $3, status = 'invited', updated_at = now()
            where organization_id = $1 and id = $2
            returning id, organization_id, user_id, email, role, status, created_at, updated_at`,
          [input.organizationId, existingMembership.id, input.role],
        )
      : await client.query<MembershipRow>(
          `insert into organization_memberships (organization_id, user_id, email, role, status, updated_at)
           values ($1,$2,$3,$4,'invited',now())
           returning id, organization_id, user_id, email, role, status, created_at, updated_at`,
          [input.organizationId, invitedUserId, input.email.toLowerCase(), input.role],
        )
    await client.query(
      `insert into audit_events (organization_id, actor_user_id, actor_name, action, entity_type, entity_id, detail)
       values ($1,$2,$3,'member.invited','organization_membership',$4,$5)`,
      [input.organizationId, input.userId, input.actorName, result.rows[0].id, `${input.email.toLowerCase()} · ${input.role}`],
    )
    if (input.invitationUrl) {
      await client.query(`insert into mail_outbox (organization_id,deduplication_key,kind,entity_id,recipient,subject,body,created_by)
        values ($1,$2,'invitation',$3,$4,'Einladung zu Binso One',$5,$6)
        on conflict (organization_id,deduplication_key) do nothing`,
        [input.organizationId, `invitation-${result.rows[0].id}-${result.rows[0].updated_at.toISOString()}`, result.rows[0].id, input.email,
          `${input.actorName} hat dich zu einer Organisation in Binso One eingeladen.\nRolle: ${input.role}\n\nMelde dich mit ${input.email} an:\n${input.invitationUrl}`, input.userId])
    }
    return mapMembership(result.rows[0])
  })
}

export async function updateOrganizationMember(input: {
  organizationId: string
  userId: string
  actorName: string
  actorRole: Role
  membershipId: string
  role?: Role
  status?: 'active' | 'suspended'
}) {
  return withTenantTransaction({ organizationId: input.organizationId, userId: input.userId }, async (client) => {
    await client.query('select pg_advisory_xact_lock(hashtextextended($1, 1))', [input.organizationId])
    const currentResult = await client.query<MembershipRow>(
      `select id, organization_id, user_id, email, role, status, created_at, updated_at
         from organization_memberships where organization_id = $1 and id = $2 for update`,
      [input.organizationId, input.membershipId],
    )
    const current = currentResult.rows[0]
    if (!current) throw new Error('Benutzer wurde nicht gefunden.')
    if (current.role === 'owner' && input.actorRole !== 'owner') throw new Error('Nur Inhaber dürfen Inhaber ändern.')
    if (current.status === 'invited' && input.status === 'active') throw new Error('Einladungen werden erst bei der Anmeldung aktiviert.')
    if (current.status === 'suspended' && input.status === 'active') {
      const seats = await client.query<{ max_users: number; used: string }>(`select e.max_users,
        (select count(*)::text from organization_memberships where organization_id=$1 and status in ('active','invited')) as used
        from organization_entitlements e where organization_id=$1`, [input.organizationId])
      if (!seats.rows[0] || Number(seats.rows[0].used) >= seats.rows[0].max_users) throw new Error('Das Benutzerlimit ist erreicht.')
    }
    if (current.role === 'owner' && (input.role && input.role !== 'owner' || input.status === 'suspended')) {
      const owners = await client.query<{ count: string }>(
        `select count(*)::text as count from organization_memberships where organization_id = $1 and role = 'owner' and status = 'active'`,
        [input.organizationId],
      )
      if (Number(owners.rows[0]?.count ?? 0) <= 1) throw new Error('Der letzte aktive Inhaber kann nicht geändert oder gesperrt werden.')
    }

    const result = await client.query<MembershipRow>(
      `update organization_memberships
          set role = coalesce($3, role), status = coalesce($4, status), updated_at = now()
        where organization_id = $1 and id = $2
        returning id, organization_id, user_id, email, role, status, created_at, updated_at`,
      [input.organizationId, input.membershipId, input.role ?? null, input.status ?? null],
    )
    await client.query(
      `insert into audit_events (organization_id, actor_user_id, actor_name, action, entity_type, entity_id, detail)
       values ($1,$2,$3,'member.updated','organization_membership',$4,$5)`,
      [input.organizationId, input.userId, input.actorName, input.membershipId, `${current.role}/${current.status} -> ${result.rows[0].role}/${result.rows[0].status}`],
    )
    return mapMembership(result.rows[0])
  })
}
