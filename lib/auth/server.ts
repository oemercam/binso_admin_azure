import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { env } from '@/lib/config/env'
import type { Session } from './types'
import type { Role } from '@/types/domain'
import { roleAllowed } from './permissions'
export { signInUrl, signOutUrl } from './urls'

type AzureClientPrincipal = {
  userId?: string
  userDetails?: string
  userRoles?: string[]
  claims?: Array<{ typ: string; val: string }>
}

function roleFromClaims(roles: string[]): Role {
  const normalized = roles.map((role) => role.toLowerCase())
  if (normalized.includes('owner')) return 'owner'
  if (normalized.includes('admin')) return 'admin'
  if (normalized.includes('finance') || normalized.includes('accounting')) return 'finance'
  return 'employee'
}

function parseAzurePrincipal(raw: string | null): Session {
  if (!raw) return null

  try {
    const json = Buffer.from(raw, 'base64').toString('utf8')
    const principal = JSON.parse(json) as AzureClientPrincipal
    const claims = principal.claims ?? []

    const email =
      principal.userDetails ??
      claims.find((claim) => claim.typ.includes('preferred_username'))?.val ??
      claims.find((claim) => claim.typ.includes('email'))?.val ??
      ''

    const name =
      claims.find((claim) => claim.typ.endsWith('/name'))?.val ??
      claims.find((claim) => claim.typ === 'name')?.val ??
      email.split('@')[0] ??
      'Benutzer'

    const roles = principal.userRoles ?? []

    return {
      user: {
        id: principal.userId ?? email,
        name,
        email,
        role: roleFromClaims(roles),
      },
    }
  } catch {
    return null
  }
}

export async function getSession(): Promise<Session> {
  if (env.authMode === 'local') {
    return {
      user: {
        id: 'local-user',
        name: 'Lokaler Admin',
        email: 'local@binso.ch',
        role: 'owner',
      },
    }
  }

  const requestHeaders = await headers()
  return parseAzurePrincipal(requestHeaders.get('x-ms-client-principal'))
}

export async function requireRole(allowedRoles: readonly Role[]) {
  const session = await getSession()
  if (!session) redirect('/sign-in')
  if (!roleAllowed(session.user.role, allowedRoles)) redirect('/access-denied')
  return session
}
