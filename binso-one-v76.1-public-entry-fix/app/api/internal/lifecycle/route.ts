import { timingSafeEqual } from 'node:crypto'
import { expireTrials } from '@/lib/db/repositories/subscription-lifecycle'
import { runBusinessJobs } from '@/lib/db/repositories/business-jobs'
import { isDatabaseConfigured } from '@/lib/db/client'
import { apiError, apiJson, requestId } from '@/lib/http/server-api'

function authorized(request: Request) {
  const configured = process.env.INTERNAL_JOB_SECRET?.trim()
  const header = request.headers.get('authorization') || ''
  const supplied = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!configured || configured.length < 32 || !supplied) return false
  const expected = Buffer.from(configured)
  const candidate = Buffer.from(supplied)
  return expected.length === candidate.length && timingSafeEqual(expected, candidate)
}

export async function POST(request: Request) {
  const id = requestId(request)
  if (!authorized(request)) return apiError(401, 'unauthorized', 'Ungültige Job-Authentifizierung.', id)
  if (!isDatabaseConfigured()) return apiError(503, 'database_unavailable', 'Datenbank ist nicht konfiguriert.', id)
  try {
    const result = await expireTrials()
    const business = await runBusinessJobs()
    return apiJson({ ok: business.tenantErrors === 0, ...result, ...business, completedAt: new Date().toISOString() }, { status: business.tenantErrors ? 500 : 200 }, id)
  } catch (cause) {
    console.error('Subscription lifecycle failed', { requestId: id, error: cause instanceof Error ? cause.message : 'Unknown error' })
    return apiError(500, 'lifecycle_failed', 'Subscription-Lifecycle konnte nicht ausgeführt werden.', id)
  }
}
