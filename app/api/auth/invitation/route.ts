import {canonicalPlanId,effectiveUserLimit,capacityReached} from '@/config/plans';
import {createHash} from "node:crypto";
import {NextRequest} from "next/server";
import {ApiError,apiError,assertSameOrigin,cleanText,json,readJson} from "@/lib/server/http";
import {withPlatform} from "@/lib/server/db";
import {hashPassword,verifyPassword} from "@/lib/server/password";
import {enforceRateLimit} from "@/lib/server/rate-limit";
const digest=(token:string)=>createHash("sha256").update(token).digest("hex");
async function invitation(token:string,lock=false){
 if(!token||token.length>200)throw new ApiError(400,"invitation_invalid","Die Einladung ist ungültig oder abgelaufen.");
 return withPlatform(async c=>{
  const row=(await c.query(`select t.id,t.user_id,t.organization_id,t.email,t.metadata,u.status user_status,u.password_hash
   from auth_tokens t join app_users u on u.id=t.user_id
   where t.token_hash=$1 and t.token_type='invitation' and t.consumed_at is null and t.expires_at>now() ${lock?'for update of t':''}`,[digest(token)])).rows[0];
  if(!row)throw new ApiError(400,"invitation_invalid","Die Einladung ist ungültig oder abgelaufen.");
  await c.query("select set_config('app.organization_id',$1,true)",[row.organization_id]);
  const organization=(await c.query('select * from read_invitation_organization($1,false)',[digest(token)])).rows[0];
  if(!organization)throw new ApiError(400,"invitation_invalid","Die Einladung ist ungültig oder abgelaufen.");
  const pending=(await c.query("select id,role from organization_invitations where id::text=$1 and organization_id=$2 and lower(email)=lower($3) and status='pending' and expires_at>now()",[row.metadata.invitation_id,row.organization_id,row.email])).rows[0];
  if(!pending)throw new ApiError(400,"invitation_invalid","Die Einladung ist ungültig oder abgelaufen.");
  return {...row,organization_name:organization.organization_name,role:pending.role};
 });
}
export async function GET(request:NextRequest){try{
 await enforceRateLimit(request,"invitation-preview",30,15*60_000);
 const row=await invitation(request.nextUrl.searchParams.get("token")??"");
 return json({email:row.email,organization:row.organization_name,existingAccount:row.user_status==='active'});
}catch(e){return apiError(e)}}
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);await enforceRateLimit(request,"invitation-accept",10,15*60_000);
 const b=await readJson<{token?:unknown;password?:unknown;name?:unknown;firstName?:unknown;lastName?:unknown}>(request,8192);
 const token=cleanText(b.token,200),password=typeof b.password==='string'?b.password:'';
 if(password.length<12||password.length>512)throw new ApiError(400,"password_invalid","Das Passwort muss zwischen 12 und 512 Zeichen haben.");
 // Read without consuming; invalid credentials must not destroy a valid invitation.
 const preview=await invitation(token);
 if(preview.user_status==='active'&&!await verifyPassword(password,preview.password_hash))throw new ApiError(403,"credentials_invalid","Das bestehende Passwort stimmt nicht.");
 const structured=b.firstName!==undefined||b.lastName!==undefined;
 const firstName=cleanText(b.firstName,80),lastName=cleanText(b.lastName,80);
 if(preview.user_status!=='active'&&structured&&(!firstName||!lastName))throw new ApiError(400,'name_required','Bitte Vorname und Nachname eingeben.');
 const passwordHash=preview.user_status==='active'?null:await hashPassword(password);
 await withPlatform(async c=>{
  const row=(await c.query("select * from auth_tokens where token_hash=$1 and token_type='invitation' and consumed_at is null and expires_at>now() for update",[digest(token)])).rows[0];
  if(!row)throw new ApiError(400,"invitation_invalid","Die Einladung ist ungültig oder abgelaufen.");
  await c.query("select set_config('app.organization_id',$1,true)",[row.organization_id]);
  const organization=(await c.query('select * from read_invitation_organization($1,true)',[digest(token)])).rows[0];
  if(!organization||!['trial','active','grace_period'].includes(organization.status))throw new ApiError(409,'organization_unavailable','Das Firmenkonto ist derzeit nicht verfügbar.');
  const inv=(await c.query("select * from organization_invitations where id::text=$1 and organization_id=$2 and status='pending' and expires_at>now() for update",[row.metadata.invitation_id,row.organization_id])).rows[0];
  if(!inv)throw new ApiError(400,"invitation_invalid","Die Einladung ist ungültig oder abgelaufen.");
  const capacity=(await c.query("select e.max_users,s.plan,(select count(*) from organization_memberships m where m.organization_id=e.organization_id and m.status='active') occupied from organization_entitlements e join organization_subscriptions s on s.organization_id=e.organization_id where e.organization_id=$1",[row.organization_id])).rows[0];
  const capacityPlan=canonicalPlanId(capacity?.plan);
   if(!capacity||!capacityPlan)throw new ApiError(409,'user_limit','Das Benutzerlimit konnte nicht geprüft werden.');
   if(capacityReached(Number(capacity.occupied),effectiveUserLimit(capacityPlan,capacity.max_users)))throw new ApiError(409,'user_limit','Das Benutzerlimit ist erreicht.');
  const user=(await c.query("select status,password_hash from app_users where id=$1 for update",[row.user_id])).rows[0];
  await c.query("select set_config('app.user_id',$1,true)",[row.user_id]);
  if((await c.query("select 1 from organization_memberships where user_id=$1 and organization_id<>$2 limit 1",[row.user_id,row.organization_id])).rowCount)throw new ApiError(409,'identity_unavailable','Diese Einladung kann mit diesem Konto nicht angenommen werden.');
  if(user.status==='active'){if(!await verifyPassword(password,user.password_hash))throw new ApiError(403,"credentials_invalid","Das bestehende Passwort stimmt nicht.");}
  else if(user.status==='invited'&&passwordHash)await c.query("update app_users set password_hash=$2,status='active',display_name=$3,first_name=coalesce($4,first_name),last_name=coalesce($5,last_name),email_verified_at=now(),updated_at=now() where id=$1",[row.user_id,passwordHash,structured?[firstName,lastName].join(' '):cleanText(b.name,200)||row.email,structured?firstName:null,structured?lastName:null]);
  else throw new ApiError(409,"account_unavailable","Dieses Konto kann nicht aktiviert werden.");
  const updated=await c.query("update organization_memberships set status='active',role=$3,module_profile=$4 where organization_id=$1 and user_id=$2 and status='invited' returning user_id",[row.organization_id,row.user_id,inv.role,inv.module_profile??'standard']);
  if(!updated.rowCount)throw new ApiError(409,"membership_changed","Die Teamzuordnung hat sich geändert.");
  await c.query("update organization_invitations set status='accepted' where id=$1",[inv.id]);
  await c.query("update auth_tokens set consumed_at=now() where id=$1",[row.id]);
 });
 return json({ok:true});
}catch(e){return apiError(e)}}
