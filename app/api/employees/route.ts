import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { tenantInsert, tenantList, requireTenantFeature } from "@/lib/server/database";

type EmployeeBody={firstName?:unknown;lastName?:unknown;email?:unknown;phone?:unknown;jobTitle?:unknown;workloadPercent?:unknown;entryDate?:unknown;status?:unknown};

export async function GET(){
  try{
    await requireTenantFeature("employees");return json({items:await tenantList("employees","id,first_name,last_name,email,phone,job_title,workload_percent,entry_date,status,created_at","order=created_at.desc")});}
  catch(error){return apiError(error);}
}

export async function POST(request:NextRequest){
  try{
    await requireTenantFeature("employees");
    assertSameOrigin(request);
    const body=await readJson<EmployeeBody>(request,16384);
    const firstName=cleanText(body.firstName,120),lastName=cleanText(body.lastName,120),jobTitle=cleanText(body.jobTitle,160);
    const workload=Number(body.workloadPercent);
    if(!firstName||!lastName||!jobTitle) return json({error:"required_fields",message:"Name und Funktion sind erforderlich."},400);
    if(!Number.isFinite(workload)||workload<0||workload>100) return json({error:"workload_invalid",message:"Pensum muss zwischen 0 und 100 liegen."},400);
    const rows=await tenantInsert("employees",{first_name:firstName,last_name:lastName,email:cleanText(body.email,320)||null,phone:cleanText(body.phone,80)||null,job_title:jobTitle,workload_percent:workload,entry_date:cleanText(body.entryDate,20)||null,status:body.status==="inactive"?"inactive":"active"});
    return json({item:rows[0]},201);
  }catch(error){return apiError(error);}
}
