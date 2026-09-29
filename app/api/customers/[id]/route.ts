import { NextRequest } from "next/server";
import { requireSession } from "@/lib/server/session";
import { authorize } from "@/lib/server/rbac";
import { deleteCustomer, updateCustomer } from "@/lib/server/repositories/customers";
import { apiError, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { asObject, stringField } from "@/lib/server/validation";

export const runtime="nodejs";
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{
  assertSameOrigin(request);const s=await requireSession();authorize(s,"customers:write");const {id}=await params;const body=asObject(await readJson(request));
  const item=await updateCustomer(s.organizationId,s.userId,id,{
    name:body.name?stringField(body,"name",{max:180,min:2}):undefined,
    contact:body.contact!=null?stringField(body,"contact",{required:false,max:160}):undefined,
    phone:body.phone!=null?stringField(body,"phone",{required:false,max:80}):undefined,
    address:body.address!=null?stringField(body,"address",{required:false,max:240}):undefined
  });
  if(!item)return json({error:"Nicht gefunden."},404);
  return json({item});
 }catch(e){return apiError(e,request)}
}
export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{assertSameOrigin(request);const s=await requireSession();authorize(s,"customers:delete");const {id}=await params;const ok=await deleteCustomer(s.organizationId,s.userId,id);return ok?json({ok:true}):json({error:"Nicht gefunden."},404)}
 catch(e){return apiError(e,request)}
}
