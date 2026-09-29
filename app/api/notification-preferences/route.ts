import {NextRequest} from "next/server";
import {requireSession} from "@/lib/server/session";
import {withTenant} from "@/lib/server/db";
import {apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
import {asObject,stringField} from "@/lib/server/validation";

export const runtime="nodejs";
const allowedKinds=new Set(["security","billing","support","workflow","system","general"]);

export async function GET(){
 try{
  const s=await requireSession();
  const rows=await withTenant(s.organizationId,s.userId,async c=>(await c.query(`select kind,in_app as "inApp",email,push from notification_preferences where organization_id=$1 and user_id=$2 order by kind`,[s.organizationId,s.userId])).rows);
  return json({items:rows});
 }catch(e){return apiError(e)}
}

export async function PATCH(request:NextRequest){
 try{
  assertSameOrigin(request);
  const s=await requireSession();
  const body=asObject(await readJson(request,8_000));
  const kind=stringField(body,"kind",{min:2,max:40});
  if(!allowedKinds.has(kind))throw new Error("Ungültiger Benachrichtigungstyp.");
  const inApp=body.inApp!==false;
  const email=body.email!==false;
  const push=body.push===true;
  await withTenant(s.organizationId,s.userId,async c=>c.query(`insert into notification_preferences(organization_id,user_id,kind,in_app,email,push,updated_at) values($1,$2,$3,$4,$5,$6,now()) on conflict(user_id,kind) do update set in_app=excluded.in_app,email=excluded.email,push=excluded.push,updated_at=now()`,[s.organizationId,s.userId,kind,inApp,email,push]));
  return json({ok:true});
 }catch(e){return apiError(e,request)}
}
