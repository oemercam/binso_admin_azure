import {requireFreshAuthentication} from '@/lib/server/fresh-authentication';
import {audit} from "@/lib/server/audit";
import {NextRequest} from "next/server";
import {ApiError,apiError,assertSameOrigin,cleanText,json,readJson} from "@/lib/server/http";
import {requireSession} from "@/lib/server/session";
import {authorize} from "@/lib/server/rbac";
import {withTenant} from "@/lib/server/db";
const roles=new Set(["admin","finance","hr","project_manager","manager","member","reader"]);
export async function PATCH(request:NextRequest,{params}:{params:Promise<{userId:string}>}){try{
 assertSameOrigin(request);const s=await requireSession();authorize(s,"users:manage");await requireFreshAuthentication(s);
 const {userId}=await params,b=await readJson<{action?:unknown;role?:unknown;moduleProfile?:unknown}>(request,4096);
 if(b.action!==undefined&&b.action!=='deactivate')throw new ApiError(400,'action_invalid','Ungültige Aktion.');
 const item=await withTenant(s.organizationId,s.userId,async c=>{
  const actor=(await c.query("select role from organization_memberships where organization_id=$1 and user_id=$2 and status='active' for share",[s.organizationId,s.userId])).rows[0];
  if(!actor||!['owner','admin'].includes(actor.role))throw new ApiError(403,'forbidden','Keine Berechtigung.');
  const current=(await c.query("select role,module_profile,status from organization_memberships where organization_id=$1 and user_id=$2 for update",[s.organizationId,userId])).rows[0];
  if(!current)throw new ApiError(404,'not_found','Mitarbeiter wurde nicht gefunden.');
  if(current.role==='owner')throw new ApiError(409,'owner_locked','Die Inhaberrolle kann hier nicht geändert werden.');
  if(b.action==='deactivate'){
   if(userId===s.userId)throw new ApiError(409,'self_deactivation_forbidden','Der eigene Zugang kann hier nicht gesperrt werden.');
   if(current.status==='suspended')return {user_id:userId,status:'suspended'};
   if(current.status!=='active')throw new ApiError(409,'membership_changed','Die Teamzuordnung hat sich geändert.');
   // Pause only this already-authorized member's own tracker under the existing
   // own-user RLS policy. This never creates a tenant/session impersonation.
   try{
    await c.query("select set_config('app.user_id',$1,true)",[userId]);
    await c.query("update active_time_trackers set accumulated_seconds=accumulated_seconds+case when state='running' and active_since is not null then greatest(0,extract(epoch from now()-active_since)::integer) else 0 end,state='paused',active_since=null,updated_at=now() where organization_id=$1 and user_id=$2",[s.organizationId,userId]);
   }finally{await c.query("select set_config('app.user_id',$1,true)",[s.userId]);}
   await c.query("update organization_memberships set status='suspended' where organization_id=$1 and user_id=$2",[s.organizationId,userId]);
   await c.query('delete from auth_sessions where organization_id=$1 and user_id=$2',[s.organizationId,userId]);
   await c.query("update organization_invitations set status='revoked' where organization_id=$1 and lower(email)=(select lower(email) from app_users where id=$2) and status='pending'",[s.organizationId,userId]);
   await c.query("update auth_tokens set consumed_at=coalesce(consumed_at,now()) where organization_id=$1 and user_id=$2 and token_type='invitation'",[s.organizationId,userId]);
   await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'membership.access_suspended',entityType:'organization_memberships',entityId:userId,metadata:{timer:'preserved_paused',history:'retained'}});
   return {user_id:userId,status:'suspended'};
  }
  const role=cleanText(b.role,40);if(!roles.has(role))throw new ApiError(400,'role_invalid','Ungültige Rolle.');
  if(current.status!=='active')throw new ApiError(409,'membership_changed','Die Teamzuordnung hat sich geändert.');
  const moduleProfile=b.moduleProfile??(role==='member'?current.module_profile??'standard':'standard');
  if((moduleProfile!=='standard'&&moduleProfile!=='time_only')||moduleProfile==='time_only'&&role!=='member')throw new ApiError(400,'profile_invalid','Ungültiges Modulprofil.');
  const updated=(await c.query('update organization_memberships set role=$1,module_profile=$4 where organization_id=$2 and user_id=$3 returning user_id,role,module_profile,created_at',[role,s.organizationId,userId,moduleProfile])).rows[0];
  if(current.role!==role||current.module_profile!==moduleProfile){
   await c.query('delete from auth_sessions where organization_id=$1 and user_id=$2',[s.organizationId,userId]);
   await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'membership.role_changed',entityType:'organization_memberships',entityId:userId,metadata:{previous:current.role,role,previousProfile:current.module_profile,moduleProfile}});
  }
  return updated;
 });return json({item});
}catch(e){return apiError(e)}}
