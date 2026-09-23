import 'server-only'
import { getSession } from '@/lib/auth/server'

export type TenantRequestContext = {
  userId: string
  email: string
  organizationId: string
}

/**
 * Production contract for tenant-aware APIs.
 *
 * The organization id must be resolved from an authenticated membership,
 * never trusted directly from a request body/query parameter.
 * The current demo has no database membership repository yet, so callers
 * must inject the resolved organization id after the persistence layer is connected.
 */
export async function authenticatedIdentity() {
  const session = await getSession()
  if (!session) return null
  return { userId: session.user.id, email: session.user.email }
}

export function assertTenantId(value: string | null | undefined) {
  if (!value) throw new Error('Organization context is required')
  return value
}
