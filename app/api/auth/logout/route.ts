import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, json } from "@/lib/server/http";
import { clearAuthCookies } from "@/lib/server/auth";

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    const response=json({ok:true});
    clearAuthCookies(response);
    return response;
  }catch(error){return apiError(error);}
}
