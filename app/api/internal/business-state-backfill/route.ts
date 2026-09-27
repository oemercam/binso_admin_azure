import { isInternalJobAuthorized } from '@/lib/auth/internal-job'
import { isDatabaseConfigured } from '@/lib/db/client'
import { backfillNormalizedBusinessState } from '@/lib/db/repositories/business-state-backfill'
import { apiError, apiJson, readJsonBody, requestId } from '@/lib/http/server-api'
import { logError } from '@/lib/logging/server'
import { PRODUCT_LIMITS } from '@/lib/config/product'

export async function POST(request:Request){
  const id=requestId(request)
  if(!isInternalJobAuthorized(request)) return apiError(401,'unauthorized','Ungültige Job-Authentifizierung.',id)
  if(!isDatabaseConfigured()) return apiError(503,'database_unavailable','Datenbank ist nicht konfiguriert.',id)
  let body:{dryRun?:boolean;organizationId?:string|null}={}
  try{body=await readJsonBody(request,PRODUCT_LIMITS.apiBodySmallBytes)}catch{return apiError(400,'validation_error','Ungültige Anfrage.',id)}
  const dryRun=body.dryRun!==false
  if(body.organizationId && !/^[0-9a-f-]{36}$/i.test(body.organizationId)) return apiError(400,'validation_error','Ungültige Organisations-ID.',id)
  try{
    const result=await backfillNormalizedBusinessState({dryRun,organizationId:body.organizationId})
    return apiJson({ok:result.failed===0,...result}, {status:result.failed?500:200}, id)
  }catch(cause){
    logError('business.normalized_backfill_failed',cause,{requestId:id})
    return apiError(500,'internal_error','Backfill konnte nicht ausgeführt werden.',id)
  }
}
