import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { operatorAudit, operatorList, operatorUpdate } from "@/lib/server/database";

type Body={status?:unknown;priority?:unknown};

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const {id}=await params;
    const tickets=await operatorList<Record<string,unknown>>(
      "support_tickets",
      "id,tenant_id,created_by,subject,category,priority,status,created_at,updated_at,tenant:tenants(id,name,uid,city,email,phone)",
      "id=eq."+encodeURIComponent(id)+"&limit=1"
    );
    if(!tickets[0]) return json({error:"not_found",message:"Ticket wurde nicht gefunden."},404);
    const messages=await operatorList<Record<string,unknown>>(
      "support_messages",
      "id,ticket_id,author_user_id,author_type,body,internal,created_at",
      "ticket_id=eq."+encodeURIComponent(id)+"&order=created_at.asc"
    );
    return json({item:tickets[0],messages});
  }catch(error){return apiError(error);}
}

export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{
    assertSameOrigin(request);
    const {id}=await params;
    const body=await readJson<Body>(request,8192);
    const patch:Record<string,unknown>={};
    const status=cleanText(body.status,40);
    const priority=cleanText(body.priority,40);
    if(status){
      if(!["new","open","in_progress","waiting_customer","resolved","closed"].includes(status)) return json({error:"status_invalid",message:"Ungültiger Status."},400);
      patch.status=status;
    }
    if(priority){
      if(!["low","normal","high","critical"].includes(priority)) return json({error:"priority_invalid",message:"Ungültige Priorität."},400);
      patch.priority=priority;
    }
    if(!Object.keys(patch).length) return json({error:"empty_patch",message:"Keine Änderung angegeben."},400);
    const rows=await operatorUpdate<Record<string,unknown>>("support_tickets","id=eq."+encodeURIComponent(id),patch);
    await operatorAudit("support.ticket.updated","support_ticket",id,patch);
    return json({item:rows[0]});
  }catch(error){return apiError(error);}
}
