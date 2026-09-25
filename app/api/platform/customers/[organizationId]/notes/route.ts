import { PRODUCT_LIMITS } from '@/lib/config/product'
import { getPlatformSession } from '@/lib/auth/server'
import { addPlatformCustomerNote } from '@/lib/db/repositories/platform-customer-detail'
import { apiError, apiJson, readJsonBody, requireSameOrigin } from '@/lib/http/server-api'
import { canSupportPlatform } from '@/lib/auth/platform-permissions'
export async function POST(request:Request,{params}:{params:Promise<{organizationId:string}>}){try{requireSameOrigin(request)}catch{return apiError(403,'invalid_origin','Ungültige Anfragequelle.')}const s=await getPlatformSession();if(!s||!canSupportPlatform(s.user.platformRole))return apiError(403,'forbidden','Keine Plattformberechtigung.');const {organizationId}=await params;const b=await readJsonBody<{note?:string}>(request,PRODUCT_LIMITS.apiBodyMediumBytes).catch(()=>null);const note=b?.note?.trim()??'';if(note.length<1||note.length>4000)return apiError(422,'validation','Notiz ist ungültig.');return apiJson({note:await addPlatformCustomerNote({organizationId,actorUserId:s.user.id,actorEmail:s.user.email,note})},{status:201})}
