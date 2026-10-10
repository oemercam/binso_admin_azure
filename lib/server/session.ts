import "server-only";
import {createHash,randomBytes} from "node:crypto";
import {cookies,headers} from "next/headers";
import {query} from "@/lib/server/db";
import {env} from "@/lib/server/env";
import {expireUnpaidTrials} from "@/lib/server/subscription-lifecycle";

export type SessionUser={
 isDemo?:boolean;
 organizationStatus?:string;
 sessionId:string;
 userId:string;
 organizationId:string;
 email:string;
 name:string;
 role:"owner"|"admin"|"finance"|"hr"|"project_manager"|"manager"|"member"|"reader";
 mfaEnabled:boolean;
};

const tokenHash=(token:string)=>createHash("sha256").update(token).digest("hex");
const ipHash=(value:string)=>createHash("sha256").update(value).digest("hex");

export async function createSession(input:{userId:string;organizationId:string;email:string;name:string;role:SessionUser["role"];ttlHours?:number;cookieName?:string}){
 const token=randomBytes(32).toString("base64url");
 const hash=tokenHash(token);
 const ttlHours=Math.max(1,Math.min(input.ttlHours??env.sessionTtlHours,env.sessionTtlHours));
 const expiresAt=new Date(Date.now()+ttlHours*60*60*1000);
 const h=await headers();
 const ua=(h.get("user-agent")||"").slice(0,500);
 const ip=(h.get("x-forwarded-for")?.split(",")[0]?.trim()||h.get("x-real-ip")||"unknown");
 const result=await query<{id:string}>(
   `insert into auth_sessions(user_id,organization_id,token_hash,expires_at,user_agent,ip_hash)
    values($1,$2,$3,$4,$5,$6) returning id`,
   [input.userId,input.organizationId,hash,expiresAt,ua,ipHash(ip)]
 );
 const jar=await cookies();
 jar.set(input.cookieName??env.sessionCookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",expires:expiresAt});
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

export async function getSession():Promise<SessionUser|null>{
 const jar=await cookies();
 const demo=jar.get("binso_demo")?.value==="1";
 const token=jar.get(demo?"binso_demo_write":env.sessionCookieName)?.value;
 if(!token)return null;
 const result=await query<SessionUser>(
   `select s.id as "sessionId",u.id as "userId",s.organization_id as "organizationId",u.email,u.display_name as name,m.role,o.status as "organizationStatus",o.is_demo as "isDemo",u.mfa_enabled as "mfaEnabled"
      from auth_sessions s
      join app_users u on u.id=s.user_id and u.status='active'
      join organization_memberships m on m.user_id=u.id and m.organization_id=s.organization_id and m.status='active'
      join organizations o on o.id=s.organization_id and o.status in ('trial','active','grace_period','read_only')
     where s.token_hash=$1 and s.expires_at>now() and ($2::boolean=false or o.is_demo=true)
     limit 1`,
   [tokenHash(token),demo]
 );
 const session=result.rows[0]||null;
 if(session&&!session.isDemo){const expired=await expireUnpaidTrials(session.organizationId);if(expired?.rows?.length)session.organizationStatus="read_only";}
 if(session)void query(`update auth_sessions set last_seen_at=now() where id=$1 and last_seen_at<now()-interval '5 minutes'`,[session.sessionId]).catch(()=>{});
 return session;
}

export async function requireSession(options:{allowMfaEnrollment?:boolean}={}){
 const session=await getSession();
 if(!session){const {ApiError}=await import("@/lib/server/http");throw new ApiError(401,"unauthorized","Anmeldung erforderlich.");}
 const privileged=["owner","admin","finance"].includes(session.role);
 if(privileged&&!session.isDemo&&!session.mfaEnabled&&!options.allowMfaEnrollment){
   const {ApiError}=await import("@/lib/server/http");
   throw new ApiError(403,"mfa_enrollment_required","Für dieses Konto muss zuerst die Authenticator-App eingerichtet werden.");
 }
 return session;
}
