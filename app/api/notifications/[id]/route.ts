import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, json } from "@/lib/server/http";
import { requireSession } from "@/lib/server/session";
import { withTenant } from "@/lib/server/db";
import {markNotificationsRead} from '@/lib/server/repositories/notifications';

export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{
    assertSameOrigin(request);
    const {id}=await params;
    const s=await requireSession();
    await withTenant(s.organizationId,s.userId,c=>markNotificationsRead(c,s,id));
    return json({ok:true});
  }catch(error){return apiError(error);}
}
