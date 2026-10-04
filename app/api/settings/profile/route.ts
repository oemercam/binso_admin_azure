import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { currentProfile, updateProfile } from "@/lib/server/database";
import { requireUser } from "@/lib/server/auth";

type ProfileBody={firstName?:unknown;lastName?:unknown;phone?:unknown;jobTitle?:unknown;language?:unknown;theme?:unknown};

export async function GET(){
  try{
    const {user}=await requireUser();
    return json({item:await currentProfile(),email:user.email??null});
  }catch(error){return apiError(error);}
}

export async function PATCH(request:NextRequest){
  try{
    assertSameOrigin(request);
    const body=await readJson<ProfileBody>(request,8192);
    const firstName=cleanText(body.firstName,120);
    const lastName=cleanText(body.lastName,120);
    const language=cleanText(body.language,20)||"de-CH";
    const data:Record<string,unknown>={};
    if(body.firstName!==undefined)data.first_name=firstName||null;
    if(body.lastName!==undefined)data.last_name=lastName||null;
    if(body.firstName!==undefined&&body.lastName!==undefined)data.display_name=[firstName,lastName].filter(Boolean).join(" ")||"Benutzer";
    if(body.phone!==undefined)data.phone=cleanText(body.phone,80)||null;
    if(body.jobTitle!==undefined)data.job_title=cleanText(body.jobTitle,160)||null;
    if(body.language!==undefined)data.language=language;
    if(body.theme!==undefined)data.theme=cleanText(body.theme,10);
    const rows=await updateProfile(data);
    return json({item:rows[0]});
  }catch(error){return apiError(error);}
}
