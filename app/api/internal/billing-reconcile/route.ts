import { reconcileBillingState } from '@/lib/db/repositories/billing-reconciliation'
import { apiError, apiJson } from '@/lib/http/server-api'
import { isInternalJobAuthorized } from '@/lib/auth/internal-job'

export async function POST(request:Request){if(!isInternalJobAuthorized(request))return apiError(401,'unauthorized','Nicht autorisiert.');try{return apiJson(await reconcileBillingState())}catch{return apiError(500,'reconciliation_failed','Billing-Abgleich ist fehlgeschlagen.')}}
