import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { tenantInsert, tenantList } from "@/lib/server/database";
import { requireUser } from "@/lib/server/auth";

type TimeBody={customerId?:unknown;customerName?:unknown;projectName?:unknown;description?:unknown;startedAt?:unknown;endedAt?:unknown;durationMinutes?:unknown};

export async function GET(){
  try{return json({items:await tenantList("time_entries","id,user_id,customer_id,project_name,description,started_at,ended_at,duration_minutes,created_at","order=created_at.desc")});}
  catch(error){return apiError(error);}
}

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    const body=await readJson<TimeBody>(request,16384);
    const {user}=await requireUser();
    const duration=Number(body.durationMinutes);
    if(!Number.isFinite(duration)||duration<0) return json({error:"duration_invalid",message:"Ungültige Dauer."},400);
    let customerId=cleanText(body.customerId,80)||null;
    const customerName=cleanText(body.customerName,200);
    if(!customerId&&customerName){
      const customers=await tenantList<{id:string}>("customers","id","name=eq."+encodeURIComponent(customerName)+"&limit=1");
      customerId=customers[0]?.id??null;
    }
    const rows=await tenantInsert("time_entries",{user_id:user.id,customer_id:customerId,project_name:cleanText(body.projectName,200)||null,description:cleanText(body.description,2000)||null,started_at:cleanText(body.startedAt,40)||null,ended_at:cleanText(body.endedAt,40)||null,duration_minutes:Math.round(duration)});
    return json({item:rows[0]},201);
  }catch(error){return apiError(error);}
}
