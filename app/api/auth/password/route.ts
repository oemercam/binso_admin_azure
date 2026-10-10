import { NextRequest } from "next/server";
import { ApiError, apiError, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { consumeAuthToken } from "@/lib/server/auth-tokens";
import { hashPassword, verifyPassword } from "@/lib/server/password";
import {requireSession} from "@/lib/server/session";
import {enforceRateLimit} from "@/lib/server/rate-limit";
import { query,withTransaction } from "@/lib/server/db";
export async function PATCH(request:NextRequest){
 try{
  assertSameOrigin(request);const body=await readJson<{token?:unknown;password?:unknown;currentPassword?:unknown}>(request,8192);
  const token=typeof body.token==="string"?body.token:"";const password=typeof body.password==="string"?body.password:"";
  if(password.length>256)return json({error:"password_too_long",message:"Das Passwort ist zu lang."},400);
  if(password.length<12)return json({error:"password_too_short",message:"Das Passwort muss mindestens 12 Zeichen haben."},400);
  if(!token){
    const session=await requireSession();
    if(session.isDemo)return json({error:'demo_action_unavailable',message:'Demo-Zugang benötigt kein Passwort.'},403);
    await enforceRateLimit(request,'password-change',5,15*60*1000);
    const current=typeof body.currentPassword==='string'?body.currentPassword:'';
    const user=(await query<{password_hash:string}>('select password_hash from app_users where id=$1',[session.userId])).rows[0];
    if(!user?.password_hash||!await verifyPassword(current,user.password_hash))return json({error:'reauth_required',message:'Das aktuelle Passwort stimmt nicht.'},403);
    const hash=await hashPassword(password);
    await withTransaction(async c=>{const changed=await c.query("update app_users set password_hash=$1,updated_at=now() where id=$2 and status='active' and password_hash=$3 returning id",[hash,session.userId,user.password_hash]);if(!changed.rowCount)throw new ApiError(409,"auth_state_changed","Die Sicherheitsdaten wurden geändert. Bitte erneut anmelden.");await c.query('delete from auth_sessions where user_id=$1 and id<>$2',[session.userId,session.sessionId]);});
    return json({ok:true});
  }
  await enforceRateLimit(request,"password-reset",5,15*60_000);
  const hash=await hashPassword(password);
  await withTransaction(async client=>{
    const reset=await consumeAuthToken("password_reset",token,client);
    if(!reset?.user_id)throw new ApiError(400,"reset_invalid","Link ist ungültig oder abgelaufen.");
    const changed=await client.query("update app_users set password_hash=$1,updated_at=now() where id=$2 and status='active' returning id",[hash,reset.user_id]);
    if(!changed.rowCount)throw new ApiError(400,"reset_invalid","Link ist ungültig oder abgelaufen.");
    await client.query("delete from auth_sessions where user_id=$1",[reset.user_id]);
  });
  return json({ok:true});
 }catch(error){return apiError(error);}
}
