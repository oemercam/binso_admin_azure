import { getPlatformSession } from '@/lib/auth/server'
import { isPlatformDatabaseConfigured, platformQuery } from '@/lib/db/client'
import { apiError, apiJson, requestId } from '@/lib/http/server-api'

export async function GET(request: Request) {
  const id = requestId(request)
  const session = await getPlatformSession()
  if (!session) return apiError(401, 'unauthorized', 'Anmeldung erforderlich.', id)
  if (!session.user.platformRole) return apiError(403, 'forbidden', 'Keine Plattformberechtigung.', id)
  if (!isPlatformDatabaseConfigured()) return apiJson({ database: 'not_configured', webhookFailures24h: 0, applicationErrors24h: 0, pendingSignups: 0, activeTenants: 0, measuredAt: new Date().toISOString() }, undefined, id)

  const started = performance.now()
  try {
    const result = await platformQuery<{
      webhook_failures: string
      application_errors: string
      pending_signups: string
      active_tenants: string
    }>(
      `select
        (select count(*)::text from billing_webhook_events where status = 'failed' and received_at >= now() - interval '24 hours') as webhook_failures,
        (select count(*)::text from application_events where severity = 'error' and created_at >= now() - interval '24 hours') as application_errors,
        (select count(*)::text from signup_requests where status in ('started','account_created')) as pending_signups,
        (select count(*)::text from platform_tenants where platform_status in ('trial','active')) as active_tenants`,
    )
    const row = result.rows[0]
    return apiJson({
      database: 'ok',
      databaseLatencyMs: Math.max(0, Math.round(performance.now() - started)),
      webhookFailures24h: Number(row?.webhook_failures ?? 0),
      applicationErrors24h: Number(row?.application_errors ?? 0),
      pendingSignups: Number(row?.pending_signups ?? 0),
      activeTenants: Number(row?.active_tenants ?? 0),
      measuredAt: new Date().toISOString(),
    }, undefined, id)
  } catch {
    return apiJson({ database: 'error', webhookFailures24h: 0, applicationErrors24h: 0, pendingSignups: 0, activeTenants: 0, measuredAt: new Date().toISOString() }, { status: 503 }, id)
  }
}
