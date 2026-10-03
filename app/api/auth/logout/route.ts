import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, json } from "@/lib/server/http";
import { clearAuthCookies, getAccessToken, revokeCurrentSession } from "@/lib/server/auth";

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    await revokeCurrentSession(await getAccessToken());
    const response=json({ok:true});
    clearAuthCookies(response);
    return response;
  }catch(error){return apiError(error);}
}
