import { PRODUCT_LIMITS } from '@/lib/config/product'
import { getPlatformSession } from '@/lib/auth/server'
import { listFeatureFlags,setFeatureFlag } from '@/lib/db/repositories/platform-governance'
import { apiError,apiJson,readJsonBody,requireSameOrigin } from '@/lib/http/server-api'
import { canManagePlatform } from '@/lib/auth/platform-permissions'
export async function GET(){const s=await getPlatformSession();if(!s?.user.platformRole)return apiError(403,'forbidden','Keine Plattformberechtigung.');return apiJson({flags:await listFeatureFlags()})}
export async function PATCH(request:Request){try{requireSameOrigin(request)}catch{return apiError(403,'invalid_origin','Ungültige Anfragequelle.')}const s=await getPlatformSession();if(!s?.user.platformRole||!canManagePlatform(s.user.platformRole))return apiError(403,'forbidden','Keine Plattformberechtigung.');const b=await readJsonBody<{key?:string;enabled?:boolean;reason?:string}>(request,PRODUCT_LIMITS.apiBodyMediumBytes).catch(()=>null);const reason=b?.reason?.trim()??'';if(!b?.key||typeof b.enabled!=='boolean'||reason.length<3)return apiError(422,'validation','Änderungsgrund ist erforderlich.');try{return apiJson({flag:await setFeatureFlag({key:b.key,enabled:b.enabled,userId:s.user.id,email:s.user.email,reason})})}catch(e){return apiError(404,'not_found',e instanceof Error?e.message:'Feature Flag nicht gefunden.')}}
