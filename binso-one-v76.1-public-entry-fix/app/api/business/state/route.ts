import { resolveTenantContext } from '@/lib/auth/tenant-server'
import { isDatabaseConfigured } from '@/lib/db/client'
import { getTenantBusinessState, saveTenantBusinessState } from '@/lib/db/repositories/tenant-state'
import { apiError, apiJson, readJsonBody, requestId, requireSameOrigin } from '@/lib/http/server-api'
import { recordApplicationEvent } from '@/lib/db/repositories/application-events'
import { projectBusinessState } from '@/lib/auth/business-state-policy'

const MAX_STATE_BYTES = 2_000_000

const allowedStateKeys = new Set([
  'auditEvents','numberSequences','importJobs','exportJobs','customers','contracts','expenses','creditNotes',
  'customerActivities','customerContacts','suppliers','quotes','orders','timeEntries','invoices','payments',
  'supplierInvoices','employees','timeEvidence','orderPolicies','orderAssignmentRules','companyProfile','documentTemplates','appSettings',
])

function sanitizeTenantState(state: Record<string, unknown>, organizationId: string) {
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(state)) {
    if (!allowedStateKeys.has(key)) continue
    if (Array.isArray(value)) {
      if (value.length > 10_000) throw new Error('too_many_records')
      const ids = new Set<string>()
      for (const item of value) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('state_invalid')
        if (!['numberSequences','orderPolicies','orderAssignmentRules'].includes(key) && (typeof item.id !== 'string' || item.id.length > 128 || ids.has(item.id))) throw new Error('state_invalid')
        if (item.id) ids.add(item.id)
      }
      clean[key] = value.map((item) => item && typeof item === 'object' ? { ...(item as Record<string, unknown>), organizationId } : item)
      continue
    }
    if (key === 'companyProfile' && value && typeof value === 'object') {
      clean[key] = { ...(value as Record<string, unknown>), organizationId }
      continue
    }
    if (value && typeof value === 'object') clean[key] = value
  }
  return clean
}

export async function GET(request: Request) {
  const id = requestId(request)
  if (!isDatabaseConfigured()) return apiError(503, 'database_unavailable', 'Datenbank ist nicht konfiguriert.', id)
  const preferred = new URL(request.url).searchParams.get('organizationId')
  const context = await resolveTenantContext(preferred)
  if (!context) return apiError(403, 'tenant_forbidden', 'Keine Berechtigung für diese Organisation.', id)

  try {
    const record = await getTenantBusinessState(context)
    return apiJson({ ...record, state: projectBusinessState(record.state, { role: context.membership.role, email: context.email, userId: context.userId }) }, undefined, id)
  } catch (cause) {
    if (cause instanceof Error && cause.message === 'too_many_records') return apiError(413, 'too_many_records', 'Zu viele Datensätze in einer Speicherung.', id)
    await recordApplicationEvent({ severity: 'error', area: 'business-state', code: 'read_failed', message: cause instanceof Error ? cause.message : 'Unknown error', organizationId: context.organizationId, userId: context.userId, requestId: id })
    return apiError(500, 'state_read_failed', 'Geschäftsdaten konnten nicht geladen werden.', id)
  }
}

export async function PUT(request: Request) {
  const id = requestId(request)
  try { requireSameOrigin(request) } catch { return apiError(403, 'invalid_origin', 'Ungültige Anfragequelle.', id) }
  if (!isDatabaseConfigured()) return apiError(503, 'database_unavailable', 'Datenbank ist nicht konfiguriert.', id)

  let body: { organizationId?: string; expectedVersion?: number; state?: Record<string, unknown> }
  try {
    body = await readJsonBody(request, MAX_STATE_BYTES)
  } catch (cause) {
    return apiError(cause instanceof Error && cause.message === 'payload_too_large' ? 413 : 400, 'invalid_payload', 'Geschäftsdaten sind ungültig oder zu gross.', id)
  }

  const context = await resolveTenantContext(body.organizationId)
  if (!context) return apiError(403, 'tenant_forbidden', 'Keine Berechtigung für diese Organisation.', id)
  if (!body.state || typeof body.state !== 'object' || Array.isArray(body.state) || !Number.isSafeInteger(body.expectedVersion) || Number(body.expectedVersion) < 0) {
    return apiError(422, 'validation', 'Version oder Geschäftsdaten fehlen.', id)
  }

  try {
    const state = sanitizeTenantState(body.state, context.organizationId)
    const result = await saveTenantBusinessState({ organizationId: context.organizationId, userId: context.userId, expectedVersion: Number(body.expectedVersion), state, actor: { role: context.membership.role, email: context.email, userId: context.userId } })
    if (!result.saved) return apiJson({ error: { code: 'version_conflict', message: 'Die Daten wurden zwischenzeitlich geändert.' }, version: result.version }, { status: 409 }, id)
    return apiJson({ ok: true, version: result.version }, undefined, id)
  } catch (cause) {
    if (cause instanceof Error && ['state_forbidden', 'state_invalid'].includes(cause.message)) return apiError(403, cause.message, 'Diese Änderung ist nicht erlaubt. Bitte Daten neu laden.', id)
    if (cause instanceof Error && cause.message === 'too_many_records') return apiError(413, 'too_many_records', 'Zu viele Datensätze in einer Speicherung.', id)
    await recordApplicationEvent({ severity: 'error', area: 'business-state', code: 'write_failed', message: cause instanceof Error ? cause.message : 'Unknown error', organizationId: context.organizationId, userId: context.userId, requestId: id })
    return apiError(500, 'state_write_failed', 'Geschäftsdaten konnten nicht gespeichert werden.', id)
  }
}
