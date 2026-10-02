import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { tenantInsert, tenantList } from "@/lib/server/database";

type CustomerBody={name?:unknown;sector?:unknown;email?:unknown;phone?:unknown;street?:unknown;postalCode?:unknown;city?:unknown;uid?:unknown};

export async function GET(){
  try{
    const rows=await tenantList<Record<string,unknown>>("customers","id,name,sector,email,phone,street,postal_code,city,uid,status,created_at","order=created_at.desc");
    return json({items:rows});
  }catch(error){return apiError(error);}
}

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    const body=await readJson<CustomerBody>(request,16384);
    const name=cleanText(body.name,200);
    if(name.length<1) return json({error:"name_required",message:"Bitte Kundennamen eingeben."},400);
    const rows=await tenantInsert("customers",{
      name,
      sector:cleanText(body.sector,120)||null,
      email:cleanText(body.email,320)||null,
      phone:cleanText(body.phone,80)||null,
      street:cleanText(body.street,200)||null,
      postal_code:cleanText(body.postalCode,20)||null,
      city:cleanText(body.city,120)||null,
      uid:cleanText(body.uid,40)||null,
      status:"active",
    });
    return json({item:rows[0]},201);
  }catch(error){return apiError(error);}
}
