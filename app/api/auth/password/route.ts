import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { requireUser, updatePassword } from "@/lib/server/auth";

type Body={password?:unknown};

export async function PATCH(request:NextRequest){
  try{
    assertSameOrigin(request);
    const body=await readJson<Body>(request,8192);
    const password=typeof body.password==="string"?body.password:"";
    if(password.length<12) return json({error:"password_too_short",message:"Das Passwort muss mindestens 12 Zeichen haben."},400);
    const {token}=await requireUser();
    await updatePassword(token,password);
    return json({ok:true});
  }catch(error){return apiError(error);}
}
