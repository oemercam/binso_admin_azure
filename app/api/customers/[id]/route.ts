import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { tenantList, tenantUpdate } from "@/lib/server/database";

type Body={name?:unknown;sector?:unknown;email?:unknown;phone?:unknown;street?:unknown;postalCode?:unknown;city?:unknown;uid?:unknown;status?:unknown};

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const {id}=await params;
    const rows=await tenantList<Record<string,unknown>>("customers","id,name,sector,email,phone,street,postal_code,city,uid,status,created_at,updated_at","id=eq."+encodeURIComponent(id)+"&limit=1");
    if(!rows[0]) return json({error:"not_found",message:"Kunde wurde nicht gefunden."},404);
    return json({item:rows[0]});
  }catch(error){return apiError(error);}
}

export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{
    assertSameOrigin(request);
    const {id}=await params;
    const body=await readJson<Body>(request,16384);
    const name=cleanText(body.name,200);
    if(!name) return json({error:"name_required",message:"Bitte Kundennamen eingeben."},400);
    const rows=await tenantUpdate("customers",id,{
      name,
      sector:cleanText(body.sector,120)||null,
      email:cleanText(body.email,320)||null,
      phone:cleanText(body.phone,80)||null,
      street:cleanText(body.street,200)||null,
      postal_code:cleanText(body.postalCode,20)||null,
      city:cleanText(body.city,120)||null,
      uid:cleanText(body.uid,40)||null,
      status:body.status==="inactive"?"inactive":"active",
    });
    if(!rows[0]) return json({error:"not_found",message:"Kunde wurde nicht gefunden."},404);
    return json({item:rows[0]});
  }catch(error){return apiError(error);}
}
