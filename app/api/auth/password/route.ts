import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { consumeAuthToken } from "@/lib/server/auth-tokens";
import { hashPassword } from "@/lib/server/password";
import { query } from "@/lib/server/db";
export async function PATCH(request:NextRequest){
 try{
  assertSameOrigin(request);const body=await readJson<{token?:unknown;password?:unknown}>(request,8192);
  const token=typeof body.token==="string"?body.token:"";const password=typeof body.password==="string"?body.password:"";
  if(password.length<12)return json({error:"password_too_short",message:"Das Passwort muss mindestens 12 Zeichen haben."},400);
  if(!token)return json({error:"reset_invalid",message:"Link ist ungültig oder abgelaufen."},400);
  const reset=await consumeAuthToken("password_reset",token);
  if(!reset?.user_id)return json({error:"reset_invalid",message:"Link ist ungültig oder abgelaufen."},400);
  await query("update app_users set password_hash=$1,updated_at=now() where id=$2",[await hashPassword(password),reset.user_id]);
  await query("delete from auth_sessions where user_id=$1",[reset.user_id]);
  return json({ok:true});
 }catch(error){return apiError(error);}
}
