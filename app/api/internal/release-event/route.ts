import { PRODUCT_LIMITS } from '@/lib/config/product'
import { recordPlatformRelease } from '@/lib/db/repositories/platform-workflows'
import { apiError, apiJson, readJsonBody } from '@/lib/http/server-api'
import { isInternalJobAuthorized } from '@/lib/auth/internal-job'
export async function POST(request:Request){if(!isInternalJobAuthorized(request))return apiError(401,'unauthorized','Nicht autorisiert.');const b=await readJsonBody<{buildId?:string;environment?:'staging'|'production';status?:'started'|'healthy'|'failed'|'rolled_back';commitSha?:string;detail?:string}>(request,PRODUCT_LIMITS.apiBodyMediumBytes).catch(()=>null);if(!b?.buildId||!b.environment||!b.status)return apiError(422,'validation','Release-Ereignis ist ungültig.');await recordPlatformRelease({buildId:b.buildId.slice(0,120),environment:b.environment,status:b.status,commitSha:b.commitSha?.slice(0,80),detail:b.detail?.slice(0,2000)});return apiJson({ok:true},{status:201})}
