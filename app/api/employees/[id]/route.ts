import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { tenantList, tenantUpdate } from "@/lib/server/database";

type Body={firstName?:unknown;lastName?:unknown;email?:unknown;phone?:unknown;jobTitle?:unknown;workloadPercent?:unknown;entryDate?:unknown;status?:unknown};

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const {id}=await params;
    const rows=await tenantList<Record<string,unknown>>("employees","id,first_name,last_name,email,phone,job_title,workload_percent,entry_date,status,created_at,updated_at","id=eq."+encodeURIComponent(id)+"&limit=1");
    if(!rows[0]) return json({error:"not_found",message:"Mitarbeiter wurde nicht gefunden."},404);
    return json({item:rows[0]});
  }catch(error){return apiError(error);}
}

export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{
    assertSameOrigin(request);
    const {id}=await params;
    const body=await readJson<Body>(request,16384);
    const firstName=cleanText(body.firstName,120),lastName=cleanText(body.lastName,120),jobTitle=cleanText(body.jobTitle,160);
    const workload=Number(body.workloadPercent);
    if(!firstName||!lastName||!jobTitle||!Number.isFinite(workload)||workload<0||workload>100) return json({error:"invalid_employee",message:"Mitarbeiterangaben sind ungültig."},400);
    const rows=await tenantUpdate("employees",id,{
      first_name:firstName,last_name:lastName,email:cleanText(body.email,320)||null,phone:cleanText(body.phone,80)||null,
      job_title:jobTitle,workload_percent:workload,entry_date:cleanText(body.entryDate,20)||null,status:body.status==="inactive"?"inactive":"active",
    });
    if(!rows[0]) return json({error:"not_found",message:"Mitarbeiter wurde nicht gefunden."},404);
    return json({item:rows[0]});
  }catch(error){return apiError(error);}
}
