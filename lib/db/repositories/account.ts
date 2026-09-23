import 'server-only'
import { query } from '@/lib/db/client'

export type AccountProfile = {
  id: string
  email: string
  displayName: string
  phone: string
  locale: string
  timezone: string
  status: 'active' | 'suspended'
  lastLoginAt: string | null
  createdAt: string
}

type AccountRow = {
  id: string
  email: string
  display_name: string
  phone: string | null
  locale: string
  timezone: string
  status: 'active' | 'suspended'
  last_login_at: Date | null
  created_at: Date
}

function mapAccount(row: AccountRow): AccountProfile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    phone: row.phone ?? '',
    locale: row.locale,
    timezone: row.timezone,
    status: row.status,
    lastLoginAt: row.last_login_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
  }
}

export async function getAccountProfile(userId: string) {
  const result = await query<AccountRow>(
    `select id, email, display_name, phone, locale, timezone, status, last_login_at, created_at
       from app_users where id = $1`,
    [userId],
  )
  return result.rows[0] ? mapAccount(result.rows[0]) : null
}

export async function updateAccountProfile(input: {
  userId: string
  displayName: string
  phone: string
  locale: string
  timezone: string
}) {
  const result = await query<AccountRow>(
    `update app_users
        set display_name = $2, phone = nullif($3, ''), locale = $4, timezone = $5, updated_at = now()
      where id = $1
      returning id, email, display_name, phone, locale, timezone, status, last_login_at, created_at`,
    [input.userId, input.displayName, input.phone, input.locale, input.timezone],
  )
  return result.rows[0] ? mapAccount(result.rows[0]) : null
}
