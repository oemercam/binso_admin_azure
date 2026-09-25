import { expireTrials } from '@/lib/db/repositories/subscription-lifecycle'
import { runBusinessJobs } from '@/lib/db/repositories/business-jobs'
import { isDatabaseConfigured } from '@/lib/db/client'
import { apiError, apiJson, requestId } from '@/lib/http/server-api'
import { logError } from '@/lib/logging/server'
import { isInternalJobAuthorized } from '@/lib/auth/internal-job'


export async function POST(request: Request) {
  const id = requestId(request)
  if (!isInternalJobAuthorized(request)) return apiError(401, 'unauthorized', 'Ungültige Job-Authentifizierung.', id)
  if (!isDatabaseConfigured()) return apiError(503, 'database_unavailable', 'Datenbank ist nicht konfiguriert.', id)
  try {
    const result = await expireTrials()
    const business = await runBusinessJobs()
    return apiJson({ ok: business.tenantErrors === 0, ...result, ...business, completedAt: new Date().toISOString() }, { status: business.tenantErrors ? 500 : 200 }, id)
  } catch (cause) {
    logError('subscription.lifecycle_failed', cause, { requestId: id })
    return apiError(500, 'lifecycle_failed', 'Subscription-Lifecycle konnte nicht ausgeführt werden.', id)
  }
}
