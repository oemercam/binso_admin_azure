import { PRODUCT_LIMITS } from '@/lib/config/product'
import { resolveTenantContext } from '@/lib/auth/tenant-server'
import { withTenantTransaction } from '@/lib/db/tenant'
import { apiError, apiJson, readJsonBody, requireSameOrigin } from '@/lib/http/server-api'

const allowedEvents=new Set(['onboarding.completed','customer.created','quote.created','order.created','time.created','invoice.created','payment.recorded','help.opened','support.opened'])
export async function POST(request:Request){
  try{requireSameOrigin(request)}catch{return apiError(403,'invalid_origin','Ungültige Anfragequelle.')}
  const body=await readJsonBody<{eventName?:string;route?:string;entityType?:string;entityId?:string;metadata?:Record<string,string|number|boolean|null>}>(request,PRODUCT_LIMITS.apiBodySmallBytes).catch(()=>null)
  if(!body?.eventName||!allowedEvents.has(body.eventName))return apiError(422,'validation','Ereignis ist ungültig.')
  const context=await resolveTenantContext(undefined);if(!context)return apiError(403,'forbidden','Keine Berechtigung.')
  await withTenantTransaction(context,client=>client.query(`insert into product_events(organization_id,user_id,event_name,route,entity_type,entity_id,metadata) values($1,$2,$3,$4,$5,$6,$7::jsonb)`,[context.organizationId,context.userId,body.eventName,body.route?.slice(0,500)??null,body.entityType?.slice(0,80)??null,body.entityId?.slice(0,120)??null,JSON.stringify(body.metadata??{})]))
  return apiJson({accepted:true},{status:202})
}
