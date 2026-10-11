import {requireOperatorSession} from '@/lib/server/operator/session';
import {authorizeOperator} from '@/lib/server/operator/rbac';
import {apiError,json} from '@/lib/server/http';
import {monitoringSnapshot} from '@/lib/server/observability';
export async function GET(){
 try{const session=await requireOperatorSession();authorizeOperator(session,'platform:read');return json(await monitoringSnapshot(session.role));}catch(error){return apiError(error);}
}
