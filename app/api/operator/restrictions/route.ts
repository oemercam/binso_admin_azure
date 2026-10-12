import {NextRequest} from 'next/server';
import {requireOperatorSession} from '@/lib/server/operator/session';
import {authorizeOperator} from '@/lib/server/operator/rbac';
import {platformAudit} from '@/lib/server/operator/audit';
import {withPlatform} from '@/lib/server/db';
import {apiError,assertSameOrigin,cleanText,json,readJson,ApiError} from '@/lib/server/http';
import {insertOperatorBusiness,listOperatorBusiness} from '@/lib/server/repositories/operator-api';

export async function GET(){
 try{const session=await requireOperatorSession();authorizeOperator(session,'restrictions:manage');
  const items=await withPlatform(c=>listOperatorBusiness(c,session,'tenant_restrictions','limit=500'));
  return json({items});
 }catch(error){return apiError(error);}
}
export async function POST(request:NextRequest){
 try{const session=await requireOperatorSession();authorizeOperator(session,'restrictions:manage');assertSameOrigin(request);
  const body=await readJson<Record<string,unknown>>(request,16384);
  const tenantId=cleanText(body.tenantId,80),scope=cleanText(body.scope,20),reason=cleanText(body.reason,160),note=cleanText(body.note,2000);
  if(!tenantId||!['all','write'].includes(scope)||!reason||!note)return json({error:'invalid_restriction',message:'Angaben zur Einschränkung sind unvollständig.'},400);
  const end=cleanText(body.endsAt,40);
  const endsAt=end?(/^\d{4}-\d{2}-\d{2}$/.test(end)?end+'T23:59:59.999Z':end):null;
  if(endsAt&&(!Number.isFinite(Date.parse(endsAt))||Date.parse(endsAt)<=Date.now()))return json({error:'invalid_expiry',message:'Das Ablaufdatum muss in der Zukunft liegen.'},400);
  const item=await withPlatform(async c=>{
   const organization=(await c.query('select id from organizations where id::text=$1 and not is_demo for update',[tenantId])).rows[0];
   if(!organization)throw new ApiError(404,'tenant_not_found','Kundenkonto wurde nicht gefunden.');
   const rows=await insertOperatorBusiness(c,session,'tenant_restrictions',{tenant_id:tenantId,scope,reason,note,ends_at:endsAt});
   await platformAudit({userId:session.userId,userEmail:session.email,action:'tenant.restriction.created',entityType:'tenant',entityId:tenantId,metadata:{restriction_id:rows[0].id,scope,reason}},c);
   return rows[0];
  });return json({item},201);
 }catch(error){return apiError(error);}
}
