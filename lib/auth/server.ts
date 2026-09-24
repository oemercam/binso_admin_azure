import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { env } from '@/lib/config/env'
import type { Session } from './types'
import type { PlatformRole, Role } from '@/types/domain'
import { isDatabaseConfigured } from '@/lib/db/client'
import { findAccessibleMembership } from '@/lib/db/repositories/memberships'
import { upsertAuthenticatedUser } from '@/lib/db/repositories/users'
export { signInUrl, signOutUrl } from './urls'

type AzureClientPrincipal = {
  userId?: string
  userDetails?: string
  userRoles?: string[]
  claims?: Array<{ typ: string; val: string }>
}


function platformRoleFromClaims(roles: string[]): PlatformRole | undefined {
  const normalized = roles.map((role) => role.toLowerCase())
  if (normalized.some((role) => role === 'platform_owner' || role === 'platform.owner' || role.endsWith('.platform_owner'))) return 'platform_owner'
  if (normalized.some((role) => role === 'platform_admin' || role === 'platform.admin' || role.endsWith('.platform_admin'))) return 'platform_admin'
  if (normalized.some((role) => role === 'platform_support' || role === 'platform.support' || role.endsWith('.platform_support'))) return 'platform_support'
  if (normalized.some((role) => role === 'platform_billing' || role === 'platform.billing' || role.endsWith('.platform_billing'))) return 'platform_billing'
  if (normalized.some((role) => role === 'platform_auditor' || role === 'platform.auditor' || role.endsWith('.platform_auditor'))) return 'platform_auditor'
  return undefined
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
    const claims = Array.isArray(principal.claims) ? principal.claims.filter(claim => typeof claim.typ === 'string' && typeof claim.val === 'string') : []

    const claimValue = (...needles: string[]) =>
      claims.find((claim) => needles.some((needle) => claim.typ.toLowerCase() === needle || claim.typ.toLowerCase().endsWith(`/${needle}`)))?.val

    const rawEmail =
      principal.userDetails ??
      claimValue('preferred_username', 'emailaddress', 'emails', 'email') ??
      ''
    const email = rawEmail.replace(/^\[?['"]?/, '').replace(/['"]?\]?$/, '').trim().toLowerCase()

    const name =
      claimValue('/name', 'displayname', 'name') ??
      email.split('@')[0] ??
      'Benutzer'

    const roles = [...(Array.isArray(principal.userRoles) ? principal.userRoles.filter(role => typeof role === 'string') : []), ...claims.filter(claim => claim.typ === 'roles' || claim.typ.endsWith('/role')).map(claim => claim.val)]
    const subject = principal.userId || claimValue('nameidentifier', 'oid', 'sub')
    if (!subject || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null

    return {
      user: {
        id: subject,
        name,
        email,
        role: roleFromClaims(roles),
        platformRole: platformRoleFromClaims(roles),
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
        platformRole: 'platform_owner',
      },
    }
  }

  const requestHeaders = await headers()
  return parseAzurePrincipal(requestHeaders.get('x-ms-client-principal'))
}


export async function requireRole(...allowed: Array<Role | readonly Role[]>): Promise<NonNullable<Session>> {
  const session = await getSession()
  if (!session) redirect('/sign-in')

  let effectiveRole = session.user.role
  if (isDatabaseConfigured()) {
    const account = await upsertAuthenticatedUser({ id: session.user.id, email: session.user.email, displayName: session.user.name })
    if (account.status !== 'active') redirect('/access-denied')
    const membership = await findAccessibleMembership(session.user.id)
    if (!membership) redirect('/access-denied')
    effectiveRole = membership.role
  }

  const roles = allowed.flatMap((entry): Role[] =>
    typeof entry === 'string' ? [entry] : Array.from(entry)
  )
  if (roles.length > 0 && !roles.includes(effectiveRole)) redirect('/access-denied')

  return { user: { ...session.user, role: effectiveRole } }
}


export async function requirePlatformRole(...allowed: PlatformRole[]): Promise<NonNullable<Session>> {
  const session = await getPlatformSession()
  if (!session) redirect('/sign-in')
  const role = session.user.platformRole
  if (!role || (allowed.length > 0 && !allowed.includes(role))) redirect('/access-denied')
  return session
}

export async function getPlatformSession(): Promise<Session> {
  const session = await getSession()
  if (!session?.user.platformRole) return null
  // Operator access is reserved for official Binso identities. Entra single-tenant and MFA remain Azure configuration requirements.
  if (!session.user.email.toLowerCase().endsWith('@binso.ch')) return null
  if (isDatabaseConfigured()) {
    const account = await upsertAuthenticatedUser({ id: session.user.id, email: session.user.email, displayName: session.user.name })
    if (account.status !== 'active') return null
  } else if (process.env.NODE_ENV === 'production') return null
  return session
}
