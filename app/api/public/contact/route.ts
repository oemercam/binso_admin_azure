import { PRODUCT_LIMITS } from '@/lib/config/product'
import { query } from '@/lib/db/client'
import { enforceDistributedRateLimit } from '@/lib/http/rate-limit'
import { apiError, apiJson, readJsonBody, requestId, requireSameOrigin } from '@/lib/http/server-api'
const topics = new Set(['general','support','sales','privacy','security','billing','pilot','partnership'])
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export async function POST(request: Request) {
  const correlationId = requestId(request)
  try { requireSameOrigin(request) } catch { return apiError(403,'invalid_origin','Ungültige Anfragequelle.',correlationId) }
  const limit = await enforceDistributedRateLimit(request,'public-contact',5,15*60_000)
  if (!limit.allowed) return apiError(429,'rate_limited',`Zu viele Anfragen. Bitte in ${limit.retryAfterSeconds} Sekunden erneut versuchen.`,correlationId)
  const body = await readJsonBody<{name?:string;company?:string;email?:string;topic?:string;message?:string}>(request,PRODUCT_LIMITS.apiBodyContactBytes).catch(()=>null)
  const name=body?.name?.trim()??'', company=body?.company?.trim()??'', email=body?.email?.trim().toLowerCase()??'', topic=body?.topic?.trim()??'general', message=body?.message?.trim()??''
  if(name.length<2||name.length>120||company.length>160||!emailPattern.test(email)||email.length>320||!topics.has(topic)||message.length<5||message.length>2000) return apiError(422,'validation','Bitte Eingaben prüfen.',correlationId)
  try { await query(`insert into public_leads(name,company,email,topic,message,source) values($1,$2,$3,$4,$5,'website')`,[name,company||null,email,topic,message]); return apiJson({accepted:true,reference:correlationId.slice(0,12)},{status:201},correlationId) }
  catch { console.error(JSON.stringify({level:'ERROR',event:'public_contact_store_failed',correlationId})); return apiError(503,'contact_unavailable','Kontakt ist vorübergehend nicht verfügbar.',correlationId) }
}
