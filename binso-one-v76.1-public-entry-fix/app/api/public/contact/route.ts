import { query } from '@/lib/db/client'
import { enforceDistributedRateLimit } from '@/lib/http/rate-limit'
import { apiError, apiJson, readJsonBody, requireSameOrigin } from '@/lib/http/server-api'

const topics = new Set(['general','sales','pilot','partnership'])
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  try { requireSameOrigin(request) } catch { return apiError(403, 'invalid_origin', 'Ungültige Anfragequelle.') }
  const limit = await enforceDistributedRateLimit(request, 'public-contact', 5, 15 * 60_000)
  if (!limit.allowed) return apiError(429, 'rate_limited', `Zu viele Anfragen. Bitte in ${limit.retryAfterSeconds} Sekunden erneut versuchen.`)

  const body = await readJsonBody<{name?:string;company?:string;email?:string;topic?:string;message?:string}>(request, 12_000).catch(() => null)
  const name = body?.name?.trim() ?? ''
  const company = body?.company?.trim() ?? ''
  const email = body?.email?.trim().toLowerCase() ?? ''
  const topic = body?.topic?.trim() ?? 'general'
  const message = body?.message?.trim() ?? ''
  if (name.length < 2 || name.length > 120 || company.length > 160 || !emailPattern.test(email) || email.length > 320 || !topics.has(topic) || message.length < 5 || message.length > 2000) {
    return apiError(422, 'validation', 'Bitte Eingaben prüfen.')
  }

  try {
    await query(`insert into public_leads(name,company,email,topic,message,source) values($1,$2,$3,$4,$5,'website')`, [name, company || null, email, topic, message])
    return apiJson({ accepted: true }, { status: 201 })
  } catch {
    return apiError(503, 'contact_unavailable', 'Kontakt ist vorübergehend nicht verfügbar. Bitte per E-Mail kontaktieren.')
  }
}
