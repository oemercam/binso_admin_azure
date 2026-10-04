import {NextRequest} from "next/server";
import {requireSession} from "@/lib/server/session";
import {withTenant} from "@/lib/server/db";
import {apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
import {asObject,stringField} from "@/lib/server/validation";
export const runtime="nodejs";
export async function GET(){try{const s=await requireSession();const items=await withTenant(s.organizationId,s.userId,async c=>(await c.query(`select id,kind,title,body,body as message,href,read_at,read_at as "readAt",created_at,created_at as "createdAt" from in_app_notifications where organization_id=$1 and (user_id is null or user_id=$2) order by created_at desc limit 100`,[s.organizationId,s.userId])).rows);return json({items,unread:items.filter((x:{readAt?:string|null})=>!x.readAt).length})}catch(e){return apiError(e)}}
export async function PATCH(request:NextRequest){try{assertSameOrigin(request);const s=await requireSession();const b=asObject(await readJson(request,8_000));if(b.all===true){await withTenant(s.organizationId,s.userId,async c=>c.query(`update in_app_notifications set read_at=coalesce(read_at,now()) where organization_id=$1 and (user_id is null or user_id=$2) and read_at is null`,[s.organizationId,s.userId]));return json({ok:true})}const id=stringField(b,"id",{min:10,max:100});await withTenant(s.organizationId,s.userId,async c=>c.query(`update in_app_notifications set read_at=coalesce(read_at,now()) where id=$1 and organization_id=$2 and (user_id is null or user_id=$3)`,[id,s.organizationId,s.userId]));return json({ok:true})}catch(e){return apiError(e)}}
