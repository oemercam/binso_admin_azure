import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { env } from '@/lib/config/env'
import type { Session } from './types'
import type { Role } from '@/types/domain'
export { signInUrl, signOutUrl } from './urls'

type AzureClientPrincipal = {
  userId?: string
  userDetails?: string
  userRoles?: string[]
  claims?: Array<{ typ: string; val: string }>
}

function roleFromClaims(roles: string[]): Role {
  const normalized = roles.map((role) => role.toLowerCase())
  if (normalized.some((role) => role === 'owner' || role.endsWith('.owner') || role.endsWith('-owner'))) return 'owner'
  if (normalized.some((role) => role === 'admin' || role.endsWith('.admin') || role.endsWith('-admin'))) return 'admin'
  if (normalized.some((role) => role === 'finance' || role === 'accounting' || role.endsWith('.finance') || role.endsWith('-finance'))) return 'finance'
  if (normalized.some((role) => role === 'employee' || role.endsWith('.employee') || role.endsWith('-employee'))) return 'employee'
  return env.authDefaultRole as Role
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
        id: 'local-demo',
        name: 'Demo Admin',
        email: 'demo@binso.ch',
        role: 'owner',
      },
    }
  }

  const requestHeaders = await headers()
  return parseAzurePrincipal(requestHeaders.get('x-ms-client-principal'))
}


export async function requireRole(...allowed: Array<Role | readonly Role[]>): Promise<NonNullable<Session>> {
  const session = await getSession()
  if (!session) redirect('/sign-in')

  const roles = allowed.flatMap((entry): Role[] =>
    typeof entry === 'string' ? [entry] : Array.from(entry)
  )
  if (roles.length > 0 && !roles.includes(session.user.role)) redirect('/access-denied')

  return session
}
