import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {authorizeWorkforceManagement} from '@/lib/server/workforce-access';
import {requireFreshAuthentication} from '@/lib/server/fresh-authentication';
import {withTenant} from '@/lib/server/db';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {eligibleSensitiveCapabilities,sensitiveGrantIssue,type SensitiveCapability} from '@/lib/sensitive-access';
import {idempotentBusiness} from '@/lib/server/business-idempotency';
import {audit} from '@/lib/server/audit';

export async function GET(_request:Request,{params}:{params:Promise<{userId:string}>}){try{
 const s=await requireSession();authorizeWorkforceManagement(s,false);const {userId}=await params;
 const item=await withTenant(s.organizationId,s.userId,async c=>(await c.query('select user_id,role,status,module_profile,sensitive_grants,sensitive_grants_version from organization_memberships where organization_id=$1 and user_id=$2',[s.organizationId,userId])).rows[0]);
 if(!item)throw new ApiError(404,'not_found','Teammitglied wurde nicht gefunden.');
 if(item.role==='owner'&&s.role!=='owner')throw new ApiError(403,'owner_protected','Nur der Inhaber kann diese Inhaberrechte verwalten.');
 return json({item,available:eligibleSensitiveCapabilities(item.role)});
}catch(error){return apiError(error);}}
export async function PATCH(request:NextRequest,{params}:{params:Promise<{userId:string}>}){try{
 assertSameOrigin(request);const s=await requireSession();authorizeWorkforceManagement(s);const {userId}=await params,body=await readJson<{grants?:unknown;expectedRevision?:unknown}>(request,4096);
 if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(key=>!['grants','expectedRevision'].includes(key))||!Number.isSafeInteger(body.expectedRevision)||Number(body.expectedRevision)<1)throw new ApiError(400,'sensitive_grants_invalid','Die Fachrechte sind ungültig.');
 const result=await withTenant(s.organizationId,s.userId,async c=>{
  await requireFreshAuthentication(s,c);
  return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:'membership.sensitive_grants',key:request.headers.get('idempotency-key')??'',body:{userId,...body}},async()=>{
   const previous=(await c.query('select role,status,module_profile,sensitive_grants,sensitive_grants_version from organization_memberships where organization_id=$1 and user_id=$2 for update',[s.organizationId,userId])).rows[0];
   if(!previous)throw new ApiError(404,'not_found','Teammitglied wurde nicht gefunden.');
   if(previous.role==='owner'&&s.role!=='owner')throw new ApiError(403,'owner_protected','Nur der Inhaber kann diese Inhaberrechte verwalten.');
   if(previous.status!=='active'||previous.module_profile!=='standard')throw new ApiError(409,'membership_changed','Die Teamzuordnung hat sich geändert.');
   if(previous.sensitive_grants_version!==body.expectedRevision)throw new ApiError(409,'sensitive_grants_changed','Die Fachrechte wurden geändert. Bitte den aktuellen Stand prüfen.');
   const issue=sensitiveGrantIssue(previous.role,body.grants);if(issue)throw new ApiError(400,'sensitive_grants_invalid',issue);
   await c.query("select set_config('app.sensitive_grant_session',$1,true)",[s.sessionId]);
   const grants=[...body.grants as SensitiveCapability[]].sort();
   const item=(await c.query('update organization_memberships set sensitive_grants=$3::text[] where organization_id=$1 and user_id=$2 returning user_id,sensitive_grants,sensitive_grants_version',[s.organizationId,userId,grants])).rows[0];
   await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'membership.sensitive_grants_changed',entityType:'organization_membership',entityId:userId,metadata:{previous:previous.sensitive_grants,grants}});
   return {item};
  });
 });return json(result);
}catch(error){return apiError(error);}}
