import { getPlatformSession } from '@/lib/auth/server'
import { platformQuery } from '@/lib/db/client'
import { apiError, apiJson, readJsonBody, requireSameOrigin } from '@/lib/http/server-api'
import { canManagePlatform } from '@/lib/auth/platform-permissions'

export async function GET() {
  const session = await getPlatformSession()
  if (!session?.user.platformRole) return apiError(403, 'forbidden', 'Keine Plattformberechtigung.')
  try {
    const [jobs, mail, events, audit] = await Promise.all([
      platformQuery('select id,job_name,status,summary,started_at,completed_at from job_runs order by started_at desc limit 20'),
      platformQuery('select id,organization_id,kind,entity_id,status,attempts,last_error,created_at,updated_at from mail_outbox order by created_at desc limit 100'),
      platformQuery('select id,severity,area,code,request_id,created_at from application_events order by created_at desc limit 30'),
      platformQuery('select id,actor_email,action,tenant_id,detail,created_at from platform_audit_events order by created_at desc limit 30'),
    ])
    return apiJson({ jobs: jobs.rows, mail: mail.rows, events: events.rows, audit: audit.rows })
  } catch { return apiError(503, 'operations_unavailable', 'Betriebsdaten sind nicht verfügbar. Migration und Datenbank prüfen.') }
}

export async function PATCH(request: Request) {
  try { requireSameOrigin(request) } catch { return apiError(403, 'invalid_origin', 'Ungültige Anfragequelle.') }
  const session = await getPlatformSession()
  if (!session?.user.platformRole || !canManagePlatform(session.user.platformRole)) return apiError(403, 'forbidden', 'Keine Plattformberechtigung.')
  try {
    const body = await readJsonBody<{ id: string; action: string }>(request)
    if (typeof body.id !== 'string' || body.action !== 'cancel') return apiError(422, 'validation', 'Ungültige Aktion.')
    // No blind retry for ambiguous Graph calls. Operators inspect Sent Items first.
    const result = await platformQuery("update mail_outbox set status='cancelled',updated_at=now() where id=$1 and status in ('queued','failed','uncertain') returning id", [body.id])
    if (!result.rowCount) return apiError(409, 'conflict', 'Versand kann nicht mehr abgebrochen werden.')
    await platformQuery("insert into platform_audit_events(actor_user_id,actor_email,action,detail) values ($1,$2,'mail.cancelled',$3)", [session.user.id, session.user.email, body.id])
    return apiJson({ ok: true })
  } catch { return apiError(400, 'invalid_request', 'Aktion fehlgeschlagen.') }
}
