import { PRODUCT_LIMITS } from '@/lib/config/product'
import { listPublishedHelpArticles, recordHelpFeedback } from '@/lib/db/repositories/help-center'
import { apiError, apiJson, readJsonBody, requireSameOrigin } from '@/lib/http/server-api'
import { getSession } from '@/lib/auth/server'
import { findAccessibleMembership } from '@/lib/db/repositories/memberships'

export async function GET(request:Request){const q=new URL(request.url).searchParams.get('q')??'';return apiJson({articles:await listPublishedHelpArticles(q.slice(0,120))})}
export async function POST(request:Request){try{requireSameOrigin(request)}catch{return apiError(403,'invalid_origin','Ungültige Anfragequelle.')}const b=await readJsonBody<{articleId?:string;helpful?:boolean}>(request,PRODUCT_LIMITS.apiBodyTinyBytes).catch(()=>null);if(!b?.articleId||typeof b.helpful!=='boolean')return apiError(422,'validation','Feedback ist ungültig.');const s=await getSession();let organizationId: string|undefined;if(s){organizationId=(await findAccessibleMembership(s.user.id))?.organizationId}await recordHelpFeedback({articleId:b.articleId,organizationId,userId:s?.user.id,helpful:b.helpful});return apiJson({ok:true})}
