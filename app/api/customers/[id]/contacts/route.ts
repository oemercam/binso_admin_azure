import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { requireTenantFeature, tenantList } from "@/lib/server/database";

import {authorize} from "@/lib/server/rbac";
import {saveCustomerContact} from "@/lib/server/repositories/contacts";

type Body={firstName?:unknown;lastName?:unknown;email?:unknown;phone?:unknown;jobTitle?:unknown;isPrimary?:unknown};

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const {id}=await params;
    const items=await tenantList<Record<string,unknown>>(
      "customer_contacts",
      "id,customer_id,first_name,last_name,email,phone,job_title,is_primary,created_at,updated_at",
      "customer_id=eq."+encodeURIComponent(id)+"&order=is_primary.desc,created_at.asc"
    );
    return json({items});
  }catch(error){return apiError(error);}
}

export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{
    assertSameOrigin(request);
    const {id}=await params;
    const {session}=await requireTenantFeature("customer_contacts");
    authorize(session,"customers:write");
    const body=await readJson<Body>(request,16384);
    return json({item:await saveCustomerContact(session,id,null,body)},201);
  }catch(error){return apiError(error);}
}
