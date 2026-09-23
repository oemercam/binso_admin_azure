import 'server-only'
import { withTransaction } from '@/lib/db/client'

export type AuthenticatedUserRecord = {
  id: string
  email: string
  displayName: string
  status: 'active' | 'suspended'
  lastLoginAt: string | null
}

type UserRow = {
  id: string
  email: string
  display_name: string
  status: 'active' | 'suspended'
  last_login_at: Date | null
}

function mapUser(row: UserRow): AuthenticatedUserRecord {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    status: row.status,
    lastLoginAt: row.last_login_at?.toISOString() ?? null,
  }
}

export async function upsertAuthenticatedUser(input: { id: string; email: string; displayName: string }) {
  return withTransaction(async (client) => {
    const email = input.email.trim().toLowerCase()
    const result = await client.query<UserRow>(
      `insert into app_users (id, email, display_name, last_login_at, updated_at)
       values ($1, $2, $3, now(), now())
       on conflict (id) do update
         set email = excluded.email,
             display_name = case when app_users.display_name = '' then excluded.display_name else app_users.display_name end,
             last_login_at = now(),
             updated_at = now()
       returning id, email, display_name, status, last_login_at`,
      [input.id, email, input.displayName.trim()],
    )

    // Claim pending invitations by verified e-mail without trusting browser input.
    await client.query(
      `update organization_memberships invited
          set user_id = $1, status = 'active', updated_at = now()
        where lower(invited.email) = $2
          and invited.status = 'invited'
          and invited.user_id like 'invited:%'
          and not exists (
            select 1 from organization_memberships existing
             where existing.organization_id = invited.organization_id and existing.user_id = $1
          )`,
      [input.id, email],
    )

    return mapUser(result.rows[0])
  })
}
