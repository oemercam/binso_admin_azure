import { resolveAuthorizedTenantContext } from '@/lib/auth/tenant-server'
import { isDatabaseConfigured } from '@/lib/db/client'
import { inviteOrganizationMember, listOrganizationMembers, updateOrganizationMember } from '@/lib/db/repositories/membership-management'
import { apiError, apiJson, readJsonBody, requestId, requireSameOrigin } from '@/lib/http/server-api'
import type { Role } from '@/types/domain'
import { graphMailConfigured } from '@/lib/email/graph'
import { enforceDistributedRateLimit } from '@/lib/http/rate-limit'

const roles = new Set<Role>(['owner','admin','finance','employee'])

export async function GET(request: Request) {
  const id = requestId(request)
  if (!isDatabaseConfigured()) return apiError(503, 'database_unavailable', 'Datenbank ist nicht konfiguriert.', id)
  const organizationId = new URL(request.url).searchParams.get('organizationId')
  const context = await resolveAuthorizedTenantContext(organizationId, 'members.read')
  if (!context) return apiError(403, 'tenant_forbidden', 'Keine Berechtigung.', id)
  const members = await listOrganizationMembers(context)
  const { withTenantTransaction } = await import('@/lib/db/tenant')
  const auditEvents = await withTenantTransaction(context, async (client) => {
    const result = await client.query<{ id: string; actor_user_id: string; actor_name: string; action: string; entity_type: string; entity_id: string | null; detail: string | null; created_at: Date }>(
      `select id, actor_user_id, actor_name, action, entity_type, entity_id, detail, created_at from audit_events where organization_id = $1 order by created_at desc limit 50`,
      [context.organizationId],
    )
    return result.rows.map((row) => ({ id: row.id, organizationId: context.organizationId, actorUserId: row.actor_user_id, actorName: row.actor_name, action: row.action, entityType: row.entity_type, entityId: row.entity_id ?? undefined, detail: row.detail ?? undefined, createdAt: row.created_at.toISOString() }))
  })
  return apiJson({ members, auditEvents }, undefined, id)
}

export async function POST(request: Request) {
  const id = requestId(request)
  const rate = await enforceDistributedRateLimit(request, 'member-invite', 20, 15 * 60_000)
  if (!rate.allowed) return apiError(429, 'rate_limited', 'Zu viele Einladungen. Bitte später erneut versuchen.', id)
  try { requireSameOrigin(request) } catch { return apiError(403, 'invalid_origin', 'Ungültige Anfragequelle.', id) }
  if (!isDatabaseConfigured()) return apiError(503, 'database_unavailable', 'Datenbank ist nicht konfiguriert.', id)
  let body: { organizationId?: string; email?: string; role?: Role }
  try { body = await readJsonBody(request, 16_384) } catch { return apiError(400, 'invalid_json', 'Ungültige Anfrage.', id) }
  const context = await resolveAuthorizedTenantContext(body.organizationId, 'members.manage')
  if (!context) return apiError(403, 'forbidden', 'Keine Berechtigung.', id)
  const email = body.email?.trim().toLowerCase() ?? ''
  if (!/^\S+@\S+\.\S+$/.test(email) || !body.role || !roles.has(body.role)) return apiError(422, 'validation', 'E-Mail oder Rolle ist ungültig.', id)
  if (body.role === 'owner' && context.membership.role !== 'owner') return apiError(403, 'forbidden', 'Nur Inhaber können weitere Inhaber einladen.', id)
  try {
    const queued = graphMailConfigured()
    const baseUrl = (process.env.APP_BASE_URL?.trim() || new URL(request.url).origin).replace(/\/$/, '')
    const member = await inviteOrganizationMember({ organizationId: context.organizationId, userId: context.userId, actorName: context.email, email, role: body.role,
      invitationUrl: queued ? `${baseUrl}/api/auth/login?returnTo=${encodeURIComponent('/post-login')}` : undefined })
    const emailDelivery = { queued, delivered: false, provider: queued ? 'graph' : 'disabled' }
    return apiJson({ member, emailDelivery }, { status: 201 }, id)
  } catch (cause) {
    return apiError(409, 'membership_conflict', cause instanceof Error ? cause.message : 'Benutzer konnte nicht eingeladen werden.', id)
  }
}

export async function PATCH(request: Request) {
  const id = requestId(request)
  try { requireSameOrigin(request) } catch { return apiError(403, 'invalid_origin', 'Ungültige Anfragequelle.', id) }
  if (!isDatabaseConfigured()) return apiError(503, 'database_unavailable', 'Datenbank ist nicht konfiguriert.', id)
  let body: { organizationId?: string; membershipId?: string; role?: Role; status?: 'active' | 'suspended' }
  try { body = await readJsonBody(request, 16_384) } catch { return apiError(400, 'invalid_json', 'Ungültige Anfrage.', id) }
  const context = await resolveAuthorizedTenantContext(body.organizationId, 'members.manage')
  if (!context) return apiError(403, 'forbidden', 'Keine Berechtigung.', id)
  if (!body.membershipId || (body.role && !roles.has(body.role)) || (body.status && !['active','suspended'].includes(body.status))) return apiError(422, 'validation', 'Änderung ist ungültig.', id)
  if (body.role === 'owner' && context.membership.role !== 'owner') return apiError(403, 'forbidden', 'Nur Inhaber können die Inhaberrolle vergeben.', id)
  try {
    const member = await updateOrganizationMember({ organizationId: context.organizationId, userId: context.userId, actorName: context.email, actorRole: context.membership.role, membershipId: body.membershipId, role: body.role, status: body.status })
    return apiJson({ member }, undefined, id)
  } catch (cause) {
    return apiError(409, 'membership_conflict', cause instanceof Error ? cause.message : 'Benutzer konnte nicht geändert werden.', id)
  }
}
