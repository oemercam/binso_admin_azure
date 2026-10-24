import {NextRequest} from 'next/server';
import {requireSession,type SessionUser} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {withTenant} from '@/lib/server/db';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {requireFreshAuthentication} from '@/lib/server/fresh-authentication';
import {audit} from '@/lib/server/audit';
export async function GET(){try{
 const session=await requireSession();authorize(session,'users:manage');
 const item=await withTenant(session.organizationId,session.userId,async c=>(await c.query('select employee_mfa_required as required from organizations where id=$1',[session.organizationId])).rows[0]);
 return json({item});
}catch(error){return apiError(error)}}
export async function PATCH(request:NextRequest){try{
 assertSameOrigin(request);const session=await requireSession();authorize(session,'users:manage');
 const body=await readJson<{required:unknown}>(request,1024);
 if(typeof body.required!=='boolean')throw new ApiError(400,'invalid_policy','Bitte wähle eine gültige Authenticator-Regel.');
 await requireFreshAuthentication(session);
 const item=await withTenant(session.organizationId,session.userId,async c=>{
  const current=(await c.query('select employee_mfa_required,status from organizations where id=$1 for update',[session.organizationId])).rows[0];
  if(!current)throw new ApiError(404,'not_found','Unternehmen wurde nicht gefunden.');
  // Share the organization lock with individual disable; require the acting
  // administrator's actual factor before making the policy mandatory for all.
  const user=(await c.query('select mfa_enabled from app_users where id=$1 and status=\'active\' for update',[session.userId])).rows[0];
  if(!user)throw new ApiError(401,'unauthorized','Anmeldung erforderlich.');
  const membership=(await c.query<{role:SessionUser['role']}>('select role from organization_memberships where organization_id=$1 and user_id=$2 and status=\'active\' for update',[session.organizationId,session.userId])).rows[0];
  if(!membership)throw new ApiError(401,'unauthorized','Anmeldung erforderlich.');
  authorize({...session,role:membership.role,organizationStatus:current.status},'users:manage');
  await requireFreshAuthentication(session,c);
  if(body.required&&!user?.mfa_enabled)throw new ApiError(409,'mfa_enroll_first','Aktiviere zuerst deinen eigenen Authenticator unter Sicherheit.');
  if(current.employee_mfa_required!==body.required){
   await c.query('update organizations set employee_mfa_required=$1,updated_at=now() where id=$2',[body.required,session.organizationId]);
   await audit(c,{organizationId:session.organizationId,userId:session.userId,action:'organization.mfa_policy_changed',entityType:'organizations',entityId:session.organizationId,metadata:{before:current.employee_mfa_required,required:body.required}});
  }
  return {required:body.required};
 });return json({item});
}catch(error){return apiError(error)}}
