import "server-only";import {randomBytes} from "node:crypto";import {query,withPrivileged} from "./db";import {hashPassword} from "./password";import {requestPasswordRecovery} from "./auth";import {ApiError} from "./http";
export async function provisionInvitedUser(invitationId:string){
 const invite=(await query<{id:string;tenant_id:string;email:string;role:string;status:string}>(`select id,tenant_id,email,role,status from tenant_invitations where id=$1 and status='pending' and expires_at>now()`,[invitationId])).rows[0];if(!invite)throw new ApiError(400,"invitation_failed","Einladung konnte nicht gesendet werden.");
 const existing=(await query<{id:string}>(`select id from auth.users where lower(email)=lower($1) limit 1`,[invite.email])).rows[0];let userId=existing?.id;
 if(!userId){const password=await hashPassword(randomBytes(32).toString("base64url"));userId=await withPrivileged(async c=>(await c.query<{id:string}>(`insert into auth.users(email,password_hash,email_confirmed_at,raw_user_meta_data) values(lower($1),$2,now(),'{}') returning id`,[invite.email,password])).rows[0].id);}
 await query(`insert into tenant_memberships(tenant_id,user_id,role) values($1,$2,$3) on conflict(tenant_id,user_id) do update set role=excluded.role`,[invite.tenant_id,userId,invite.role]);
 await query(`update tenant_invitations set status='accepted',accepted_at=now() where id=$1`,[invite.id]);
 const base=(process.env.NEXT_PUBLIC_APP_URL??"http://localhost:3000").replace(/\/$/,"");await requestPasswordRecovery(invite.email,base+"/passwort-zuruecksetzen");
}
export async function revokeInvitation(id:string){await query(`update tenant_invitations set status='revoked' where id=$1 and status='pending'`,[id]);}
