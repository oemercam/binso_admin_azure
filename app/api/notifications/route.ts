import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { userRpc } from "@/lib/server/database";

type Body={action?:unknown};

export async function GET(request:NextRequest){
  try{
    const unreadOnly=request.nextUrl.searchParams.get("unread")==="1";
    const items=await userRpc<Array<Record<string,unknown>>>("current_notifications",{p_limit:100});
    return json({items:unreadOnly?items.filter(item=>item.read_at==null):items});
  }catch(error){return apiError(error);}
}

export async function PATCH(request:NextRequest){
  try{
    assertSameOrigin(request);
    const body=await readJson<Body>(request,4096);
    if(body.action!=="read_all") return json({error:"action_invalid",message:"Ungültige Aktion."},400);
    const changed=await userRpc<number>("mark_all_notifications_read",{});
    return json({ok:true,changed});
  }catch(error){return apiError(error);}
}
