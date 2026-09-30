import {NextRequest} from "next/server";
import {requireSession} from "@/lib/server/session";
import {authorize} from "@/lib/server/rbac";
import {withTransaction,query} from "@/lib/server/db";
import {apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
import {asObject} from "@/lib/server/validation";
import type {TenantRole} from "@/lib/permissions";
export const runtime="nodejs";
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{
 assertSameOrigin(request);const s=await requireSession();authorize(s,"users:manage");const {id}=await params;const body=asObject(await readJson(request,32_000));
 const target=(await query<{role:string;status:string}>(`select role,status from organization_memberships where user_id=$1 and organization_id=$2`,[id,s.organizationId])).rows[0];
 if(!target)return json({error:"Nicht gefunden."},404);if(target.role==="owner"&&s.role!=="owner")return json({error:"Nur der Inhaber darf den Inhaber ändern."},403);
 const allowed=new Set<TenantRole>(["owner","admin","finance","hr","project_manager","manager","member","reader"]);if(typeof body.role==="string"&&!allowed.has(body.role as TenantRole))return json({error:"Ungültige Rolle."},400);
 const requestedRole=(typeof body.role==="string"?body.role:target.role) as TenantRole;if(requestedRole==="owner"&&s.role!=="owner")return json({error:"Nur der Inhaber darf die Inhaberrolle vergeben."},403);if(id===s.userId&&body.active===false)return json({error:"Das eigene Konto kann nicht deaktiviert werden."},409);
 if(target.role==="owner"&&body.active===false){const owners=await query(`select count(*)::int count from organization_memberships where organization_id=$1 and role='owner' and status='active'`,[s.organizationId]);if(Number(owners.rows[0]?.count||0)<=1)return json({error:"Der letzte aktive Inhaber kann nicht deaktiviert werden."},409)}
 const item=await withTransaction(async c=>{if(typeof body.name==="string"||typeof body.language==="string"||typeof body.active==="boolean")await c.query(`update app_users set display_name=coalesce($1,display_name),language=coalesce($2,language),status=case when $3::boolean is null then status when $3 then 'active' else 'suspended' end,updated_at=now() where id=$4`,[typeof body.name==="string"?body.name:null,typeof body.language==="string"?body.language:null,typeof body.active==="boolean"?body.active:null,id]);await c.query(`update organization_memberships set role=$1,role_id=(select id from organization_roles where organization_id=$2 and code=$1 limit 1),status=case when $3::boolean is null then status when $3 then 'active' else 'suspended' end,updated_at=now() where user_id=$4 and organization_id=$2`,[requestedRole,s.organizationId,typeof body.active==="boolean"?body.active:null,id]);return (await c.query(`select u.id,u.display_name as name,u.email,m.role,u.language,(u.status='active' and m.status='active') as active from organization_memberships m join app_users u on u.id=m.user_id where m.user_id=$1 and m.organization_id=$2`,[id,s.organizationId])).rows[0]});return json({item})
}catch(e){return apiError(e,request)}}
