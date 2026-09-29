import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { query } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import type { OperatorRole } from "@/lib/permissions";

export type OperatorSession={sessionId:string;userId:string;email:string;name:string;role:OperatorRole};
function tokenHash(token:string){return createHash("sha256").update(token).digest("hex")}

export async function createOperatorSession(input:{userId:string;email:string;name:string;role:OperatorRole}){
 const token=randomBytes(32).toString("base64url");const hash=tokenHash(token);const expiresAt=new Date(Date.now()+env.sessionTtlHours*60*60*1000);
 const result=await query<{id:string}>(`insert into platform_sessions (platform_user_id,token_hash,expires_at) values ($1,$2,$3) returning id`,[input.userId,hash,expiresAt]);
 const jar=await cookies();jar.set(env.operatorSessionCookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",expires:expiresAt});
 return result.rows[0]?.id;
}
export async function getOperatorSession():Promise<OperatorSession|null>{
 const jar=await cookies();const token=jar.get(env.operatorSessionCookieName)?.value;if(!token)return null;
 const result=await query<OperatorSession>(`select s.id as "sessionId",u.id as "userId",u.email,u.name,u.role from platform_sessions s join platform_users u on u.id=s.platform_user_id where s.token_hash=$1 and s.expires_at>now() and u.active=true`,[tokenHash(token)]);
 return result.rows[0]||null;
}
export async function requireOperatorSession(){const session=await getOperatorSession();if(!session)throw new Response("Unauthorized",{status:401});return session}
export async function destroyOperatorSession(){const jar=await cookies();const token=jar.get(env.operatorSessionCookieName)?.value;if(token)await query("delete from platform_sessions where token_hash=$1",[tokenHash(token)]);jar.delete(env.operatorSessionCookieName)}
