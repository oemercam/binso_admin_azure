import {NextRequest} from "next/server";
import {requireSession} from "@/lib/server/session";
import {verifyPassword,hashPassword} from "@/lib/server/password";
import {withTenant} from "@/lib/server/db";
import {audit} from "@/lib/server/audit";
import {apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
import {asObject,stringField} from "@/lib/server/validation";
import {enforceRateLimit} from "@/lib/server/rate-limit";

export const runtime="nodejs";
export async function POST(request:NextRequest){try{assertSameOrigin(request);await enforceRateLimit(request,"password-change",8,15*60_000);const s=await requireSession();const body=asObject(await readJson(request,16_000));const current=stringField(body,"currentPassword",{min:1,max:256});const next=stringField(body,"newPassword",{min:12,max:256});if(current===next)return json({error:"Das neue Passwort muss sich vom bisherigen Passwort unterscheiden."},400);await withTenant(s.organizationId,s.userId,async c=>{const row=(await c.query<{password_hash:string}>(`select password_hash from app_users where id=$1`,[s.userId])).rows[0];if(!row||!(await verifyPassword(current,row.password_hash)))throw new Response("Aktuelles Passwort ist falsch.",{status:401});const hash=await hashPassword(next);await c.query(`update app_users set password_hash=$1,updated_at=now() where id=$2`,[hash,s.userId]);await c.query(`delete from auth_sessions where user_id=$1 and id<>$2`,[s.userId,s.sessionId]);await audit(c,{organizationId:s.organizationId,userId:s.userId,action:"security.password_changed",entityType:"user",entityId:s.userId})});return json({ok:true})}catch(e){return apiError(e,request)}}
