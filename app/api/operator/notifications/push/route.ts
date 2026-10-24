import {NextRequest} from 'next/server';
import {requireOperatorSession} from '@/lib/server/operator/session';
import {authorizeOperator} from '@/lib/server/operator/rbac';
import {platformAudit} from '@/lib/server/operator/audit';
import {assertSameOrigin,apiError,json} from '@/lib/server/http';
import {dispatchPush} from '@/lib/server/push';
import {pushConfiguration,pushWorkerConfiguration} from '@/lib/server/push-config';
import {pushWorkerStatus} from '@/lib/server/push-worker';
import {withPlatform} from '@/lib/server/db';
import {enforceRateLimit} from '@/lib/server/rate-limit';
export const runtime='nodejs';
export async function GET(){
 try{
  const s=await requireOperatorSession();authorizeOperator(s,'security:manage');
  const config=pushConfiguration(),worker=pushWorkerConfiguration();
  const queue=await withPlatform(async c=>(await c.query(`select status,count(*)::int count,max(attempted_at) as last_attempt_at
   from push_deliveries where attempted_at>=now()-interval '24 hours' group by status order by status`)).rows);
  return json({configuration:{enabled:config.enabled,reason:config.reason},worker:{requested:worker.requested,configured:worker.enabled,intervalSeconds:worker.intervalSeconds,...pushWorkerStatus()},queue,windowHours:24,deviceDeliveryConfirmed:false});
 }catch(error){return apiError(error)}
}
export async function POST(request:NextRequest){
 try{
  assertSameOrigin(request);await enforceRateLimit(request,'push-dispatch',5,60000);
  const s=await requireOperatorSession();authorizeOperator(s,'security:manage');
  await platformAudit({userId:s.userId,userEmail:s.email,action:'notifications.push.dispatch_requested',entityType:'push_deliveries'});
  return json(await dispatchPush(10));
 }catch(error){return apiError(error)}
}
