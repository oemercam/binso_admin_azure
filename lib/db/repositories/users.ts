import 'server-only'
import { query } from '@/lib/db/client'

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
  const result = await query<UserRow>(
    `insert into app_users (id, email, display_name, last_login_at, updated_at)
     values ($1, $2, $3, now(), now())
     on conflict (id) do update
       set email = excluded.email,
           display_name = excluded.display_name,
           last_login_at = now(),
           updated_at = now()
     returning id, email, display_name, status, last_login_at`,
    [input.id, input.email.trim().toLowerCase(), input.displayName.trim()],
  )
  return mapUser(result.rows[0])
}
