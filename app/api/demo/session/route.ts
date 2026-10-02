import { NextRequest } from "next/server";
import { assertSameOrigin, apiError, json } from "@/lib/server/http";

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    const response=json({ok:true});
    response.cookies.set("binso_demo","1",{
      httpOnly:true,
      secure:process.env.NODE_ENV==="production",
      sameSite:"lax",
      path:"/",
      maxAge:60*60*8,
    });
    return response;
  }catch(error){return apiError(error);}
}
