import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { operatorAudit, operatorInsert, operatorList } from "@/lib/server/database";
import { requireOperatorSession } from "@/lib/server/operator";

type Body={body?:unknown;internal?:unknown};

export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{
    assertSameOrigin(request);
    const {id}=await params;
    const payload=await readJson<Body>(request,16384);
    const body=cleanText(payload.body,8000);
    const internal=payload.internal===true;
    if(!body) return json({error:"message_required",message:"Nachricht darf nicht leer sein."},400);
    const tickets=await operatorList<{id:string;tenant_id:string}>("support_tickets","id,tenant_id","id=eq."+encodeURIComponent(id)+"&limit=1");
    if(!tickets[0]) return json({error:"ticket_not_found",message:"Ticket wurde nicht gefunden."},404);
    const session=await requireOperatorSession();
    const rows=await operatorInsert("support_messages",{
      tenant_id:tickets[0].tenant_id,
      ticket_id:id,
      author_user_id:session.userId,
      author_type:"operator",
      body,
      internal,
    });
    await operatorAudit(internal?"support.note.created":"support.reply.created","support_ticket",id,{message_id:rows[0]?.id});
    return json({item:rows[0]},201);
  }catch(error){return apiError(error);}
}
