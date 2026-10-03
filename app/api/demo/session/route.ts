import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { assertSameOrigin, apiError, json } from "@/lib/server/http";

const demoCookie="binso_demo";
const demoMaxAge=60*60*24;

export async function GET(){
  const store=await cookies();
  return json({active:store.get(demoCookie)?.value==="1",mode:"demo"},200);
}

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    const response=json({ok:true,active:true,mode:"demo",expiresIn:demoMaxAge});
    response.cookies.set(demoCookie,"1",{
      httpOnly:true,
      secure:process.env.NODE_ENV==="production",
      sameSite:"lax",
      path:"/",
      maxAge:demoMaxAge,
    });
    return response;
  }catch(error){return apiError(error);}
}

export async function DELETE(request:NextRequest){
  try{
    assertSameOrigin(request);
    const response=json({ok:true,active:false,mode:"demo"});
    response.cookies.set(demoCookie,"",{
      httpOnly:true,
      secure:process.env.NODE_ENV==="production",
      sameSite:"lax",
      path:"/",
      maxAge:0,
    });
    return response;
  }catch(error){return apiError(error);}
}
