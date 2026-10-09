import { NextRequest } from "next/server";
import { requireSession } from "@/lib/server/session";
import { authorize } from "@/lib/server/rbac";
import { deleteCustomer, updateCustomer, customerInput } from "@/lib/server/repositories/customers";
import { apiError, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { tenantList } from "@/lib/server/database";
import {withTenant} from "@/lib/server/db";
import {requireModuleEntitlement} from "@/lib/server/plan-access";
import {customerWorkspace} from "@/lib/server/repositories/customer-workspace";
import { asObject } from "@/lib/server/validation";

export const runtime="nodejs";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 try{const s=await requireSession();authorize(s,"customers:read");const {id}=await params;if(new URL(_request.url).searchParams.get("include")==="workspace"){await requireModuleEntitlement(s.organizationId,"kunden");return json(await withTenant(s.organizationId,s.userId,c=>customerWorkspace(c,s,id),{snapshot:true}));}const rows=await tenantList("customers","*","id=eq."+encodeURIComponent(id));return rows[0]?json({item:rows[0]}):json({error:"not_found",message:"Kunde wurde nicht gefunden."},404)}catch(e){return apiError(e)}
}
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{
  assertSameOrigin(request);const s=await requireSession();authorize(s,"customers:write");const {id}=await params;const body=asObject(await readJson(request));
  const item=await updateCustomer(s.organizationId,s.userId,id,customerInput(body,true));
  if(!item)return json({error:"Nicht gefunden."},404);
  return json({item});
 }catch(e){return apiError(e)}
}
export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{assertSameOrigin(request);const s=await requireSession();authorize(s,"customers:delete");const {id}=await params;const ok=await deleteCustomer(s.organizationId,s.userId,id);return ok?json({ok:true}):json({error:"Nicht gefunden."},404)}
 catch(e){return apiError(e)}
}
