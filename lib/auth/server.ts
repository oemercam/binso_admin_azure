import 'server-only'
import { headers } from 'next/headers'
import { env } from '@/lib/config/env'
import type { Session } from './types'

type AzureClientPrincipal = {
  userId?: string
  userDetails?: string
  userRoles?: string[]
  claims?: Array<{ typ: string; val: string }>
}

function parseAzurePrincipal(raw: string | null): Session {
  if (!raw) return null
  try {
    const json = Buffer.from(raw, 'base64').toString('utf8')
    const principal = JSON.parse(json) as AzureClientPrincipal
    const email = principal.userDetails ?? principal.claims?.find(c => c.typ.includes('email'))?.val ?? ''
    const name = principal.claims?.find(c => c.typ.endsWith('/name'))?.val ?? email.split('@')[0] ?? 'Benutzer'
    const roles = principal.userRoles ?? []
    return {
      user: {
        id: principal.userId ?? email,
        name,
        email,
        role: roles.includes('admin') ? 'admin' : roles.includes('finance') ? 'finance' : 'employee'
      }
    }
  } catch {
    return null
  }
}

export async function getSession(): Promise<Session> {
  if (env.authMode === 'local') {
    return {
      user: { id: 'local-demo', name: 'Ömer', email: 'local@binso.ch', role: 'admin' }
    }
  }
  const h = await headers()
  return parseAzurePrincipal(h.get('x-ms-client-principal'))
}

export function signInUrl(returnTo = '/') {
  return `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(returnTo)}`
}

export function signOutUrl() {
  return '/.auth/logout?post_logout_redirect_uri=/sign-in'
}
