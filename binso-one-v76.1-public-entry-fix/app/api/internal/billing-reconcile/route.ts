import { reconcileBillingState } from '@/lib/db/repositories/billing-reconciliation'
import { apiError, apiJson } from '@/lib/http/server-api'

function authorized(request:Request){const expected=process.env.INTERNAL_JOB_SECRET?.trim();const auth=request.headers.get('authorization')??'';return Boolean(expected&&auth===`Bearer ${expected}`)}
export async function POST(request:Request){if(!authorized(request))return apiError(401,'unauthorized','Nicht autorisiert.');try{return apiJson(await reconcileBillingState())}catch{return apiError(500,'reconciliation_failed','Billing-Abgleich ist fehlgeschlagen.')}}
