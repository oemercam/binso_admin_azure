import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/server/session";
import { authorize } from "@/lib/server/rbac";
import { query } from "@/lib/server/db";
import { hashPassword } from "@/lib/server/password";
import { apiError,assertSameOrigin,json,readJson } from "@/lib/server/http";
import { asObject,emailField,enumField,stringField } from "@/lib/server/validation";
import type { TenantRole } from "@/lib/permissions";
import {requireUserCapacity} from "@/lib/server/plan-access";export const runtime="nodejs";
const roles=["admin","finance","hr","project_manager","member","reader"] as const;
export async function GET(){try{const s=await requireSession();authorize(s,"users:read");const r=await query(`select id,name,email,role,language,active,created_at as "createdAt" from users where organization_id=$1 order by lower(name)`,[s.organizationId]);return json({items:r.rows})}catch(e){return apiError(e)}}
export async function POST(request:NextRequest){try{assertSameOrigin(request);const s=await requireSession();authorize(s,"users:manage");await requireUserCapacity(s.organizationId);const body=asObject(await readJson(request,32_000));const name=stringField(body,"name",{min:2,max:120});const email=emailField(body);const role=enumField(body,"role",roles) as TenantRole;const password=stringField(body,"password",{min:12,max:256});const language=enumField(body,"language",["de","en","fr","it","tr"] as const);const id=randomUUID();const hash=await hashPassword(password);await query(`insert into users (id,organization_id,name,email,password_hash,role,language,active) values ($1,$2,$3,$4,$5,$6,$7,true)`,[id,s.organizationId,name,email,hash,role,language]);return json({item:{id,name,email,role,language,active:true}},201)}catch(e){return apiError(e,request)}}
