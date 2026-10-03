import { NextRequest } from "next/server";
import { requireSession } from "@/lib/server/session";
import { authorize } from "@/lib/server/rbac";
import { createCustomer, listCustomers } from "@/lib/server/repositories/customers";
import { apiError, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { asObject, emailField, stringField } from "@/lib/server/validation";

export const runtime="nodejs";
export async function GET(){
 try{const s=await requireSession();authorize(s,"customers:read");return json({items:await listCustomers(s.organizationId,s.userId)})}
 catch(e){return apiError(e)}
}
export async function POST(request:NextRequest){
 try{
  assertSameOrigin(request);const s=await requireSession();authorize(s,"customers:write");const body=asObject(await readJson(request));
  const name=stringField(body,"name",{max:180,min:2});
  const email=body.email?emailField(body):"";
  const item=await createCustomer(s.organizationId,s.userId,{name,email:email||undefined,contact:stringField(body,"contact",{required:false,max:160}),phone:stringField(body,"phone",{required:false,max:80}),address:stringField(body,"address",{required:false,max:240}),zipCity:stringField(body,"zipCity",{required:false,max:120}),uid:stringField(body,"uid",{required:false,max:80})});
  return json({item},201);
 }catch(e){return apiError(e,request)}
}
