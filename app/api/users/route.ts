import {NextRequest} from "next/server";
import {randomUUID} from "node:crypto";
import {requireSession} from "@/lib/server/session";
import {authorize} from "@/lib/server/rbac";
import {withTransaction,query} from "@/lib/server/db";
import {hashPassword} from "@/lib/server/password";
import {apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
import {asObject,emailField,enumField,stringField} from "@/lib/server/validation";
import type {TenantRole} from "@/lib/permissions";
import {requireUserCapacity} from "@/lib/server/plan-access";
export const runtime="nodejs";
const roles=["admin","finance","hr","project_manager","manager","member","reader"] as const;
export async function GET(){try{const s=await requireSession();authorize(s,"users:read");const r=await query(`select u.id,u.display_name as name,u.email,m.role,u.language,(u.status='active' and m.status='active') as active,m.created_at as "createdAt" from organization_memberships m join app_users u on u.id=m.user_id where m.organization_id=$1 order by lower(u.display_name)`,[s.organizationId]);return json({items:r.rows})}catch(e){return apiError(e)}}
export async function POST(request:NextRequest){try{assertSameOrigin(request);const s=await requireSession();authorize(s,"users:manage");await requireUserCapacity(s.organizationId);const body=asObject(await readJson(request,32_000));const name=stringField(body,"name",{min:2,max:120});const email=emailField(body);const role=enumField(body,"role",roles) as TenantRole;const password=stringField(body,"password",{min:12,max:256});const language=enumField(body,"language",["de","en","fr","it","tr"] as const);const id=randomUUID();const hash=await hashPassword(password);await withTransaction(async c=>{const exists=await c.query(`select id from app_users where lower(email)=lower($1) limit 1`,[email]);if(exists.rowCount)throw new Error("Für diese E-Mail besteht bereits ein Benutzerkonto.");await c.query(`insert into app_users(id,email,display_name,status,password_hash,language,email_verified_at) values($1,$2,$3,'active',$4,$5,now())`,[id,email,name,hash,language]);await c.query(`insert into organization_memberships(organization_id,user_id,email,role,role_id,status) values($1,$2,$3,$4,(select id from organization_roles where organization_id=$1 and code=$4 limit 1),'active')`,[s.organizationId,id,email,role])});return json({item:{id,name,email,role,language,active:true}},201)}catch(e){return apiError(e,request)}}
