import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { currentTenant, tenantInsert, tenantList } from "@/lib/server/database";

type MessageBody={body?:unknown};

export async function GET(_request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{
    const {id}=await params;
    const rows=await tenantList("support_messages","id,ticket_id,author_user_id,author_type,body,internal,created_at","ticket_id=eq."+encodeURIComponent(id)+"&internal=eq.false&order=created_at.asc");
    return json({items:rows});
  }catch(error){return apiError(error);}
}

export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{
    assertSameOrigin(request);
    const {id}=await params;
    const payload=await readJson<MessageBody>(request,16384);
    const body=cleanText(payload.body,8000);
    if(!body) return json({error:"message_required",message:"Nachricht darf nicht leer sein."},400);
    const tenant=await currentTenant();
    const tickets=await tenantList<{id:string}>("support_tickets","id","id=eq."+encodeURIComponent(id)+"&limit=1");
    if(!tickets[0]) return json({error:"ticket_not_found",message:"Ticket wurde nicht gefunden."},404);
    const rows=await tenantInsert("support_messages",{ticket_id:id,author_user_id:tenant.user.id,author_type:"customer",body,internal:false});
    return json({item:rows[0]},201);
  }catch(error){return apiError(error);}
}
