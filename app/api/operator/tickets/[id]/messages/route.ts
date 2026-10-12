import { requireOperatorSession as requireRbacOperatorSession } from "@/lib/server/operator/session";
import { authorizeOperator } from "@/lib/server/operator/rbac";
import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { operatorList } from "@/lib/server/database";
import {withPlatform} from '@/lib/server/db';
import {platformAudit} from '@/lib/server/operator/audit';
import {insertOperatorBusiness} from '@/lib/server/repositories/operator-api';

type Body={body?:unknown;internal?:unknown};

export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{const rbacSession=await requireRbacOperatorSession();authorizeOperator(rbacSession,"support:manage");
    assertSameOrigin(request);
    const {id}=await params;
    const payload=await readJson<Body>(request,16384);
    const body=cleanText(payload.body,5000);
    const internal=payload.internal===true;
    if(!body) return json({error:"message_required",message:"Nachricht darf nicht leer sein."},400);
    const tickets=await operatorList<{id:string;tenant_id:string}>("support_tickets","id,tenant_id","id=eq."+encodeURIComponent(id)+"&limit=1");
    if(!tickets[0]) return json({error:"ticket_not_found",message:"Ticket wurde nicht gefunden."},404);
    const item=await withPlatform(async c=>{
      const rows=await insertOperatorBusiness(c,rbacSession,"support_messages",{ticket_id:id,body,internal});
      if(!rows[0])return null;
      await platformAudit({userId:rbacSession.userId,userEmail:rbacSession.email,action:internal?"support.note.created":"support.reply.created",entityType:"support_ticket",entityId:id,metadata:{message_id:rows[0].id,organizationId:tickets[0].tenant_id}},c);
      return rows[0];
    });
    return item?json({item},201):json({error:"not_found",message:"Ticket wurde nicht gefunden."},404);
  }catch(error){return apiError(error);}
}
