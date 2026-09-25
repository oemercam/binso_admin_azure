import { PRODUCT_LIMITS } from '@/lib/config/product'
import { getPlatformSession } from '@/lib/auth/server'
import { listPlatformLeads, updatePlatformLead } from '@/lib/db/repositories/platform-leads'
import { apiError, apiJson, readJsonBody, requireSameOrigin } from '@/lib/http/server-api'
import { canSupportPlatform } from '@/lib/auth/platform-permissions'
const statuses=new Set(['new','contacted','qualified','pilot','converted','closed'])
export async function GET(){const s=await getPlatformSession();if(!s||!canSupportPlatform(s.user.platformRole))return apiError(403,'forbidden','Keine Plattformberechtigung.');return apiJson({leads:await listPlatformLeads()})}
export async function PATCH(request:Request){try{requireSameOrigin(request)}catch{return apiError(403,'invalid_origin','Ungültige Anfragequelle.')}const s=await getPlatformSession();if(!s||!canSupportPlatform(s.user.platformRole))return apiError(403,'forbidden','Keine Plattformberechtigung.');const b=await readJsonBody<{id?:string;status?:string;internalNotes?:string;convertedOrganizationId?:string|null}>(request,PRODUCT_LIMITS.apiBodyMediumBytes).catch(()=>null);if(!b?.id||!b.status||!statuses.has(b.status)||((b.internalNotes?.length??0)>4000))return apiError(422,'validation','Anfrage ist ungültig.');await updatePlatformLead({id:b.id,status:b.status as never,internalNotes:b.internalNotes?.trim(),convertedOrganizationId:b.convertedOrganizationId||undefined,actorUserId:s.user.id,actorEmail:s.user.email});return apiJson({ok:true})}
