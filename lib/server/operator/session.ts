import "server-only";
import {createHash,randomBytes} from "node:crypto";
import {cookies,headers} from "next/headers";
import {query} from "@/lib/server/db";
import {env} from "@/lib/server/env";
import type {OperatorRole} from "@/lib/permissions";

export type OperatorSession={sessionId:string;userId:string;email:string;name:string;role:OperatorRole};
const tokenHash=(token:string)=>createHash("sha256").update(token).digest("hex");
const ipHash=(value:string)=>createHash("sha256").update(value).digest("hex");

export async function createOperatorSession(input:{userId:string;email:string;name:string;role:OperatorRole}){
 const token=randomBytes(32).toString("base64url");
 const expiresAt=new Date(Date.now()+env.sessionTtlHours*60*60*1000);
 const h=await headers();
 const ua=(h.get("user-agent")||"").slice(0,500);
 const ip=(h.get("x-forwarded-for")?.split(",")[0]?.trim()||h.get("x-real-ip")||"unknown");
 const result=await query<{id:string}>(`insert into platform_auth_sessions(user_id,token_hash,expires_at,user_agent,ip_hash) values($1,$2,$3,$4,$5) returning id`,[input.userId,tokenHash(token),expiresAt,ua,ipHash(ip)]);
 const jar=await cookies();
 jar.set(env.operatorSessionCookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",expires:expiresAt});
 return result.rows[0]?.id;
}
export async function getOperatorSession():Promise<OperatorSession|null>{
 const jar=await cookies();const token=jar.get(env.operatorSessionCookieName)?.value;if(!token)return null;
 const result=await query<OperatorSession>(`select s.id as "sessionId",u.user_id as "userId",u.email,coalesce(u.display_name,u.email) as name,u.role from platform_auth_sessions s join platform_operator_assignments u on u.user_id=s.user_id where s.token_hash=$1 and s.expires_at>now() and u.status='active'`,[tokenHash(token)]);
 const session=result.rows[0]||null;
 if(session)void query(`update platform_auth_sessions set last_seen_at=now() where id=$1 and last_seen_at<now()-interval '5 minutes'`,[session.sessionId]).catch(()=>{});
 return session;
}
export async function requireOperatorSession(){const session=await getOperatorSession();if(!session){const {ApiError}=await import("@/lib/server/http");throw new ApiError(401,"unauthorized","Anmeldung erforderlich.");}return session}
export async function destroyOperatorSession(){const jar=await cookies();const token=jar.get(env.operatorSessionCookieName)?.value;if(token)await query("delete from platform_auth_sessions where token_hash=$1",[tokenHash(token)]);jar.delete(env.operatorSessionCookieName)}
