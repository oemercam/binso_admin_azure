import "server-only";
import {createHash,randomBytes,randomUUID} from "node:crypto";
import {ApiError} from "./http";
import {withPlatform,withTenant} from "./db";
import {hashPassword} from "./password";
import {sendMail,mailLayout} from "./email";
import {env} from "./env";
import {authorize} from "./rbac";
import {audit} from "./audit";
import {idempotentBusiness} from "./business-idempotency";
import type {SessionUser} from "./session";

/** Cross-tenant identity lookup is required for existing accounts. Every business
 * write still carries the authenticated tenant; no platform identity is exposed. */
export async function inviteUser(s:SessionUser,email:string,role:string,key:string){
 authorize(s,'users:manage');
 if(s.isDemo)throw new ApiError(403,'demo_read_only','Einladungen sind in der Demo deaktiviert.');
 const prepared=await withPlatform(async c=>{
  await c.query("select set_config('app.organization_id',$1,true)",[s.organizationId]);
  await c.query("select set_config('app.user_id',$1,true)",[s.userId]);
  return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:'invitation.create',key,body:{email,role}},async()=>{
   await c.query('select id from organizations where id=$1 for update',[s.organizationId]);
   const capacity=(await c.query("select e.max_users,(select count(*) from organization_memberships m where m.organization_id=e.organization_id and m.status='active')+(select count(*) from organization_invitations i where i.organization_id=e.organization_id and i.status='pending' and i.expires_at>now()) occupied from organization_entitlements e where e.organization_id=$1",[s.organizationId])).rows[0];
   if(!capacity||Number(capacity.occupied)>=Number(capacity.max_users))throw new ApiError(409,'user_limit','Das Benutzerlimit ist erreicht.');
   if((await c.query("select id from organization_invitations where organization_id=$1 and lower(email)=lower($2) and status='pending' and expires_at>now()",[s.organizationId,email])).rowCount)throw new ApiError(409,'already_invited','Für diese Person besteht bereits eine Einladung.');
   // Serialize identity creation across organizations without sharing tenant records.
   await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))',['invitation.identity:'+email]);
   const existing=(await c.query('select id from app_users where lower(email)=lower($1) limit 1',[email])).rows[0];
   const userId=existing?.id??randomUUID();
   if(!existing)await c.query("insert into app_users(id,email,display_name,status,password_hash) values($1,$2,$2,'invited',$3)",[userId,email,await hashPassword(randomBytes(48).toString('base64url'))]);
   const member=(await c.query('select status from organization_memberships where organization_id=$1 and user_id=$2 for update',[s.organizationId,userId])).rows[0];
   if(member?.status==='active')throw new ApiError(409,'already_member','Diese Person ist bereits im Team.');
   const id=randomUUID(),token=randomBytes(32).toString('base64url');
   await c.query("insert into organization_invitations(id,organization_id,email,role,status,expires_at,created_by_user_id) values($1,$2,$3,$4,'pending',now()+interval '7 days',$5)",[id,s.organizationId,email,role,s.userId]);
   await c.query("insert into organization_memberships(organization_id,user_id,role,status,email) values($1,$2,$3,'invited',$4) on conflict(organization_id,user_id) do update set role=excluded.role,status='invited'",[s.organizationId,userId,role,email]);
   await c.query("insert into auth_tokens(user_id,organization_id,email,token_hash,token_type,metadata,expires_at) values($1,$2,$3,$4,'invitation',$5::jsonb,now()+interval '7 days')",[userId,s.organizationId,email,createHash('sha256').update(token).digest('hex'),JSON.stringify({invitation_id:id})]);
   const url=env.appUrl+'/einladung?token='+encodeURIComponent(token);
   const html=mailLayout('Einladung zu Binso One','<p>Du wurdest zu einem Binso One Firmenkonto eingeladen.</p>',{label:'Einladung annehmen',url});
   const outbox=(await c.query("insert into mail_outbox(organization_id,deduplication_key,kind,entity_id,recipient,subject,body,attachment_html,created_by) values($1,$2,'invitation',$3,$4,'Einladung zu Binso One',$5,$6,$7) returning id",[s.organizationId,'invitation:'+id,id,email,'Einladung annehmen: '+url,html,s.userId])).rows[0];
   await audit(c,{organizationId:s.organizationId,userId:s.userId,userName:s.name,action:'Einladung erstellt',entityType:'invitation',entityId:id,metadata:{role,delivery:'queued'}});
   return {id,outboxId:String(outbox.id)};
  });
 });
 const claim=await withTenant(s.organizationId,s.userId,async c=>{
  const invitation=(await c.query("select status,expires_at>now() valid from organization_invitations where organization_id=$1 and id=$2 for update",[s.organizationId,prepared.id])).rows[0];
  if(!invitation||invitation.status!=='pending'||!invitation.valid)throw new ApiError(409,'invitation_inactive','Diese Einladung ist nicht mehr aktiv.');
  const row=(await c.query("select * from mail_outbox where organization_id=$1 and id=$2 and kind='invitation' for update",[s.organizationId,prepared.outboxId])).rows[0];
  if(!row)throw new ApiError(409,'delivery_missing','Der Versandauftrag wurde nicht gefunden.');
  if(row.status==='accepted')return {accepted:true,row};
  if(!['queued','failed'].includes(row.status))throw new ApiError(409,'delivery_uncertain','Der Versand läuft oder konnte nicht sicher bestätigt werden. Bitte vor erneutem Versand prüfen.');
  await c.query("update mail_outbox set status='sending',attempts=attempts+1,updated_at=now() where organization_id=$1 and id=$2",[s.organizationId,row.id]);
  return {accepted:false,row};
 });
 if(claim.accepted)return {ok:true,id:prepared.id};
 let delivered=false,uncertain=false;
 try{delivered=(await sendMail({to:claim.row.recipient,subject:claim.row.subject,text:claim.row.body,html:claim.row.attachment_html})).delivered;}catch{uncertain=true;}
 const status=delivered?'accepted':uncertain?'uncertain':'failed';
 await withTenant(s.organizationId,s.userId,async c=>{
  await c.query("update mail_outbox set status=$3,last_error=$4,updated_at=now() where organization_id=$1 and id=$2 and status='sending'",[s.organizationId,prepared.outboxId,status,delivered?null:uncertain?'delivery_uncertain':'delivery_unavailable']);
  await audit(c,{organizationId:s.organizationId,userId:s.userId,userName:s.name,action:'Einladungsversand',entityType:'invitation',entityId:prepared.id,metadata:{delivery:status}});
 });
 if(!delivered)throw new ApiError(503,uncertain?'delivery_uncertain':'delivery_unavailable',uncertain?'Die Einladung ist gespeichert; der Versand konnte nicht sicher bestätigt werden. Bitte vor erneutem Versand prüfen.':'Die Einladung ist gespeichert, aber nicht versendet. Bitte die E-Mail-Verbindung prüfen und erneut versuchen.');
 return {ok:true,id:prepared.id};
}
