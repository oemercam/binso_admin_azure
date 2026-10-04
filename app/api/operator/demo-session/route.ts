import { NextRequest } from "next/server";
import { assertSameOrigin, apiError, json } from "@/lib/server/http";

const maxAge=60*60*4;

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    const response=json({ok:true,mode:"operator-demo",expiresIn:maxAge});
    response.cookies.set("binso_operator_demo","1",{
      httpOnly:true,
      secure:process.env.NODE_ENV==="production",
      sameSite:"strict",
      path:"/",
      maxAge,
    });
    return response;
  }catch(error){return apiError(error);}
}