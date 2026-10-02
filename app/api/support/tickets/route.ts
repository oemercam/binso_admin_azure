import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { currentTenant, tenantInsert, tenantList } from "@/lib/server/database";

type TicketBody={subject?:unknown;category?:unknown;priority?:unknown;message?:unknown};

export async function GET(){
  try{return json({items:await tenantList("support_tickets","id,subject,category,priority,status,created_at,updated_at","order=updated_at.desc")});}
  catch(error){return apiError(error);}
}

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    const body=await readJson<TicketBody>(request,32768);
    const subject=cleanText(body.subject,240),message=cleanText(body.message,8000);
    if(!subject||!message) return json({error:"required_fields",message:"Betreff und Nachricht sind erforderlich."},400);
    const tenant=await currentTenant();
    const tickets=await tenantInsert("support_tickets",{created_by:tenant.user.id,subject,category:cleanText(body.category,120)||null,priority:["low","normal","high","critical"].includes(String(body.priority))?String(body.priority):"normal",status:"open"});
    const ticket=tickets[0];
    await tenantInsert("support_messages",{ticket_id:ticket.id,author_user_id:tenant.user.id,author_type:"customer",body:message,internal:false});
    return json({item:ticket},201);
  }catch(error){return apiError(error);}
}
