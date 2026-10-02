import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { tenantInsert, tenantList } from "@/lib/server/database";

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
    const customers=await tenantList<{id:string}>("customers","id","id=eq."+encodeURIComponent(id)+"&limit=1");
    if(!customers[0]) return json({error:"not_found",message:"Kunde wurde nicht gefunden."},404);
    const body=await readJson<Body>(request,16384);
    const firstName=cleanText(body.firstName,120),lastName=cleanText(body.lastName,120);
    if(!firstName||!lastName) return json({error:"name_required",message:"Vorname und Nachname sind erforderlich."},400);
    const rows=await tenantInsert("customer_contacts",{
      customer_id:id,
      first_name:firstName,
      last_name:lastName,
      email:cleanText(body.email,320)||null,
      phone:cleanText(body.phone,80)||null,
      job_title:cleanText(body.jobTitle,160)||null,
      is_primary:body.isPrimary===true,
    });
    return json({item:rows[0]},201);
  }catch(error){return apiError(error);}
}
