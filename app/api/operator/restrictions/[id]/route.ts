import {NextRequest} from 'next/server';
import {requireOperatorSession} from '@/lib/server/operator/session';
import {authorizeOperator} from '@/lib/server/operator/rbac';
import {platformAudit} from '@/lib/server/operator/audit';
import {withPlatform} from '@/lib/server/db';
import {apiError,assertSameOrigin,json,ApiError} from '@/lib/server/http';
import {reconcileOperatorRestrictions,updateOperatorBusiness} from '@/lib/server/repositories/operator-api';

export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{const session=await requireOperatorSession();authorizeOperator(session,'restrictions:manage');assertSameOrigin(request);
  const {id}=await params;
  const item=await withPlatform(async c=>{
   const restriction=(await c.query('select organization_id from organization_restrictions where id::text=$1',[id])).rows[0];
   if(!restriction)throw new ApiError(404,'not_found','Einschränkung wurde nicht gefunden.');
   await c.query('select id from organizations where id=$1 for update',[restriction.organization_id]);
   const rows=await updateOperatorBusiness(c,session,'tenant_restrictions','id=eq.'+encodeURIComponent(id),{active:false});
   await reconcileOperatorRestrictions(c,restriction.organization_id);
   await platformAudit({userId:session.userId,userEmail:session.email,action:'tenant.restriction.removed',entityType:'tenant',entityId:restriction.organization_id,metadata:{restriction_id:id}},c);
   return rows[0];
  });return json({item});
 }catch(error){return apiError(error);}
}
