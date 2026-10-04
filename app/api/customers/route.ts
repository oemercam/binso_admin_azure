import { NextRequest } from "next/server";
import { requireSession } from "@/lib/server/session";
import { authorize } from "@/lib/server/rbac";
import { createCustomer, listCustomers, customerInput, type CustomerInput } from "@/lib/server/repositories/customers";
import { apiError, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { asObject } from "@/lib/server/validation";

export const runtime="nodejs";
export async function GET(){
 try{const s=await requireSession();authorize(s,"customers:read");return json({items:await listCustomers(s.organizationId,s.userId)})}
 catch(e){return apiError(e)}
}
export async function POST(request:NextRequest){
 try{
  assertSameOrigin(request);const s=await requireSession();authorize(s,"customers:write");const body=asObject(await readJson(request));
  const item=await createCustomer(s.organizationId,s.userId,customerInput(body) as CustomerInput);
  return json({item},201);
 }catch(e){return apiError(e)}
}
