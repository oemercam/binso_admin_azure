import { NextRequest } from "next/server";
import { requireSession } from "@/lib/server/session";
import { authorize } from "@/lib/server/rbac";
import { createCustomer, listCustomers, customerInput, type CustomerInput } from "@/lib/server/repositories/customers";
import { apiError, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { asObject } from "@/lib/server/validation";

export const runtime="nodejs";
export async function GET(request:NextRequest){
 try{
  const s=await requireSession();authorize(s,"customers:read");
  const filters=new URLSearchParams({order:"name.asc"});
  for(const key of ["q","limit","order","offset"]){const value=request.nextUrl.searchParams.get(key);if(value)filters.set(key,value)}
  const status=request.nextUrl.searchParams.get("status");if(status)filters.set("status","eq."+status);
  const items=await listCustomers(s,filters.toString());
  let total=Number(items[0]?.total_count??0);
  if(!items.length&&Number(filters.get('offset')||0)>0){filters.set('offset','0');filters.set('limit','1');total=Number((await listCustomers(s,filters.toString()))[0]?.total_count??0)}
  return json({items,total});
 }
 catch(e){return apiError(e)}
}
export async function POST(request:NextRequest){
 try{
  assertSameOrigin(request);const s=await requireSession();authorize(s,"customers:write");const body=asObject(await readJson(request));
  const item=await createCustomer(s.organizationId,s.userId,customerInput(body) as CustomerInput);
  return json({item},201);
 }catch(e){return apiError(e)}
}
