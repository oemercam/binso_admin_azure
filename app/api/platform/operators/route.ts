import { PRODUCT_LIMITS } from '@/lib/config/product'
import { getPlatformSession } from '@/lib/auth/server'
import { listPlatformOperators, upsertPlatformOperator } from '@/lib/db/repositories/platform-operators'
import { apiError, apiJson, readJsonBody, requireSameOrigin } from '@/lib/http/server-api'
import type { PlatformRole } from '@/types/domain'
import { canManagePlatform, isPlatformRole } from '@/lib/auth/platform-permissions'
import { serverEnv } from '@/lib/config/server-env'
export async function GET(){const s=await getPlatformSession();if(!s||!canManagePlatform(s.user.platformRole))return apiError(403,'forbidden','Keine Plattformberechtigung.');return apiJson({operators:await listPlatformOperators(),roleSource:serverEnv.platformRoleSource})}
export async function PUT(request:Request){try{requireSameOrigin(request)}catch{return apiError(403,'invalid_origin','Ungültige Anfragequelle.')}const s=await getPlatformSession();if(!s||!canManagePlatform(s.user.platformRole))return apiError(403,'forbidden','Keine Plattformberechtigung.');const b=await readJsonBody<{userId?:string;email?:string;role?:PlatformRole;status?:'active'|'suspended';reason?:string}>(request,PRODUCT_LIMITS.apiBodyMediumBytes).catch(()=>null);const email=b?.email?.trim().toLowerCase()??'';const reason=b?.reason?.trim()??'';if(!b?.userId||!email.endsWith('@binso.ch')||!b.role||!isPlatformRole(b.role)||!b.status||reason.length<3)return apiError(422,'validation','Operatorangaben oder Änderungsgrund ungültig.');await upsertPlatformOperator({userId:b.userId,email,role:b.role,status:b.status,actorUserId:s.user.id,actorEmail:s.user.email,reason});return apiJson({ok:true})}
