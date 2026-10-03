import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, json } from "@/lib/server/http";
import { userRpc } from "@/lib/server/database";

export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{
    assertSameOrigin(request);
    const {id}=await params;
    await userRpc("mark_notification_read",{p_notification_id:id});
    return json({ok:true});
  }catch(error){return apiError(error);}
}
