import {NextRequest} from "next/server";
import {requireOperatorSession} from "@/lib/server/operator/session";
import {authorizeOperator} from "@/lib/server/operator/rbac";
import {platformAudit} from "@/lib/server/operator/audit";
import {withPlatform} from "@/lib/server/db";
import {maintenanceState} from "@/lib/server/maintenance";
import {ApiError,apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
import {asObject} from "@/lib/server/validation";
export const runtime="nodejs";
export async function GET(){try{const session=await requireOperatorSession();authorizeOperator(session,"platform:read");return json(await maintenanceState());}catch(error){return apiError(error);}}
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);const session=await requireOperatorSession();authorizeOperator(session,"security:manage");
 const body=asObject(await readJson(request,4096));
 if(typeof body.enabled!=="boolean")throw new ApiError(400,"invalid_maintenance","Ungültige Anfrage.");
 const minutes=body.minutes??60;
 if(typeof minutes!=="number"||!Number.isInteger(minutes)||minutes<5||minutes>240)throw new ApiError(400,"invalid_duration","Ungültige Anfrage.");
 await withPlatform(async client=>{
  await client.query(`update platform_maintenance set enabled=$1,ends_at=case when $1 then now()+($2 * interval '1 minute') else null end,updated_at=now(),updated_by_user_id=$3 where id=1`,[body.enabled,minutes,session.userId]);
  await platformAudit({userId:session.userId,userEmail:session.email,action:body.enabled?"platform.maintenance.enabled":"platform.maintenance.disabled",entityType:"maintenance",entityId:"1",metadata:{minutes}},client);
 });return json(await maintenanceState());
}catch(error){return apiError(error);}}
