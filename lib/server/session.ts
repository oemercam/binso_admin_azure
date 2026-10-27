import "server-only";
import {maintenanceState} from "@/lib/server/maintenance";
import {createHash,randomBytes} from "node:crypto";
import {cookies,headers} from "next/headers";
import {query,withTransaction} from "@/lib/server/db";
import {ApiError} from "@/lib/server/http";
import {env} from "@/lib/server/env";
import {expireUnpaidTrials} from "@/lib/server/subscription-lifecycle";
import {requireFreshAuthentication} from './fresh-authentication';
import {audit} from './audit';

export type SessionUser={
 moduleProfile?:import('@/lib/permissions').ModuleProfile;
 isDemo?:boolean;
 organizationStatus?:string;
 sessionId:string;
 userId:string;
 organizationId:string;
 email:string;
 name:string;
 role:"owner"|"admin"|"finance"|"hr"|"project_manager"|"manager"|"member"|"reader";
 mfaEnabled:boolean;
 passkeyVerified?:boolean;
 mfaRequired?:boolean;
};

const tokenHash=(token:string)=>createHash("sha256").update(token).digest("hex");
const ipHash=(value:string)=>createHash("sha256").update(value).digest("hex");

export async function createSession(input:{userId:string;organizationId:string;email:string;name:string;role:SessionUser["role"];ttlHours?:number;persistent?:boolean;cookieName?:string;expectedPasskeyId?:string;expectedAuth?:{passwordHash:string|null;mfaEnabled:boolean;mfaSecretEnc:string|null}}){
 const token=randomBytes(32).toString("base64url");
 const hash=tokenHash(token);
 const ttlHours=Math.max(1,Math.min(input.ttlHours??env.sessionTtlHours,env.sessionTtlHours));
 const expiresAt=new Date(Date.now()+ttlHours*60*60*1000);
 const h=await headers();
 const ua=(h.get("user-agent")||"").slice(0,500);
 const ip=(h.get("x-forwarded-for")?.split(",")[0]?.trim()||h.get("x-real-ip")||"unknown");
 const result=await withTransaction(async client=>{
  // Serialize issuance with password reset/change and MFA enrollment. A proof of
  // old credentials must never mint a session after their revocation committed.
  const current=(await client.query<{status:string;password_hash:string|null;mfa_enabled:boolean;mfa_secret_enc:string|null}>("select status,password_hash,mfa_enabled,mfa_secret_enc from app_users where id=$1 for update",[input.userId])).rows[0];
  const expected=input.expectedAuth;
  if(current?.status!=="active"||expected&&(current.password_hash!==expected.passwordHash||current.mfa_enabled!==expected.mfaEnabled||current.mfa_secret_enc!==expected.mfaSecretEnc))throw new ApiError(401,"auth_state_changed","Die Sicherheitsdaten wurden geändert. Bitte erneut anmelden.");
  await client.query("select set_config('app.user_id',$1,true),set_config('app.organization_id',$2,true)",[input.userId,input.organizationId]);
  if(input.expectedPasskeyId&&!(await client.query('select 1 from auth_passkeys where credential_id=$1 and user_id=$2 and organization_id=$3 and revoked_at is null',[input.expectedPasskeyId,input.userId,input.organizationId])).rowCount)throw new ApiError(401,'auth_state_changed','Bitte erneut anmelden.');
  const membership=(await client.query("select organization_id from organization_memberships where user_id=$1 and status='active'",[input.userId])).rows;
  if(membership.length!==1||membership[0].organization_id!==input.organizationId)throw new ApiError(401,'membership_ambiguous','Die Firmenzuordnung muss vor der Anmeldung geklärt werden.');
  const issued=await client.query<{id:string}>(
   `insert into auth_sessions(user_id,organization_id,token_hash,expires_at,user_agent,ip_hash,passkey_verified)
    values($1,$2,$3,$4,$5,$6,$7) returning id`,
   [input.userId,input.organizationId,hash,expiresAt,ua,ipHash(ip),!!input.expectedPasskeyId]
  );
  if(input.expectedPasskeyId)await audit(client,{organizationId:input.organizationId,userId:input.userId,action:'auth.passkey_login',entityType:'auth_sessions',entityId:issued.rows[0].id,metadata:{method:'passkey',userVerified:true}});
  return issued;
 });
 const jar=await cookies();
 jar.set(input.cookieName??env.sessionCookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",...(input.persistent===false?{}:{expires:expiresAt})});
 return result.rows[0]?.id;
}

export async function destroySession(cookieName=env.sessionCookieName){
 const jar=await cookies();
 const token=jar.get(cookieName)?.value;
 if(token)await query("delete from auth_sessions where token_hash=$1",[tokenHash(token)]);
 jar.delete(cookieName);
}

export async function endDemoSession(){
 const jar=await cookies();
 const token=jar.get("binso_demo_write")?.value;
 if(token)await query("delete from auth_sessions where token_hash=$1",[tokenHash(token)]);
 jar.delete("binso_demo_write");
 jar.delete("binso_demo");
}

export async function getSession(options:{allowMfaEnrollment?:boolean}={}):Promise<SessionUser|null>{
 const jar=await cookies();
 const token=jar.get(env.sessionCookieName)?.value;
 if(!token)return null;
 const result=await withTransaction(async client=>{
   const context=(await client.query<{user_id:string;organization_id:string}>("select user_id,organization_id from auth_sessions where token_hash=$1 and expires_at>now() limit 1",[tokenHash(token)])).rows[0];
   if(!context)return {rows:[] as SessionUser[]};
   await client.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true)",[context.organization_id,context.user_id]);
   const authenticated=await client.query<SessionUser>(
   `select s.id as "sessionId",u.id as "userId",s.organization_id as "organizationId",u.email,u.display_name as name,m.role,m.module_profile as "moduleProfile",o.status as "organizationStatus",o.is_demo as "isDemo",u.mfa_enabled as "mfaEnabled",o.employee_mfa_required as "mfaRequired",s.passkey_verified as "passkeyVerified"
      from auth_sessions s
      join app_users u on u.id=s.user_id and u.status='active'
      join organization_memberships m on m.user_id=u.id and m.organization_id=s.organization_id and m.status='active'
      join organizations o on o.id=s.organization_id and o.status in ('trial','active','grace_period','read_only')
     where s.token_hash=$1 and s.expires_at>now() and o.is_demo=false
       and (select count(*) from organization_memberships all_m where all_m.user_id=u.id and all_m.status='active')=1
     limit 1`,
   [tokenHash(token)]
 );
   const session=authenticated.rows[0];
   if(session){
     await expireUnpaidTrials(session.organizationId,session.userId,client);
     // A concurrent request may have expired the trial while this one waited on
     // its update. Re-read after that statement, rather than trusting old joins
     // or only the rows changed by this particular request.
     const organization=(await client.query<{status:string}>("select status from organizations where id=$1",[session.organizationId])).rows[0];
     if(!organization||!["trial","active","grace_period","read_only"].includes(organization.status))authenticated.rows=[];
     else session.organizationStatus=organization.status;
   }
   return authenticated;
 });
 const session=result.rows[0]||null;
 if(session)void query(`update auth_sessions set last_seen_at=now() where id=$1 and last_seen_at<now()-interval '5 minutes'`,[session.sessionId]).catch(()=>{});
 if(session?.mfaRequired&&!session.mfaEnabled&&!session.passkeyVerified&&!options.allowMfaEnrollment)return null;
 return session;
}

export async function requireSession(options:{allowMfaEnrollment?:boolean;freshAuthentication?:boolean}={}){
 if((await maintenanceState()).enabled)throw new ApiError(503,"maintenance","Binso One wird gewartet");
 const session=await getSession({allowMfaEnrollment:true});
 if(!session){const {ApiError}=await import("@/lib/server/http");throw new ApiError(401,"unauthorized","Anmeldung erforderlich.");}
 // Phase 1: only the existing enrollment/security flow is reachable until a
 // required factor is enrolled. No role or alternate login exempts the policy.
 if(session.mfaRequired&&!session.mfaEnabled&&!session.passkeyVerified&&!options.allowMfaEnrollment)throw new ApiError(403,'mfa_enrollment_required','Dein Unternehmen verlangt eine starke Anmeldung. Bitte richte sie unter Sicherheit ein.');
  if(options.freshAuthentication)await requireFreshAuthentication(session);
  return session;
}
