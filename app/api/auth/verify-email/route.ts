import {NextRequest} from "next/server";
import {consumeAuthToken} from "@/lib/server/auth-tokens";
import {query} from "@/lib/server/db";
import {apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
import {asObject,stringField} from "@/lib/server/validation";
import {enforceRateLimit} from "@/lib/server/rate-limit";

export const runtime="nodejs";

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    await enforceRateLimit(request,"verify-email",20,60*60_000);
    const body=asObject(await readJson(request,8192));
    const token=stringField(body,"token",{min:20,max:256});
    const record=await consumeAuthToken("verify_email",token);
    if(!record?.user_id)return json({error:"invalid_or_expired_token",message:"Bestätigungslink ist ungültig oder abgelaufen."},400);
    const updated=await query(
      `update app_users set email_verified_at=coalesce(email_verified_at,now()),updated_at=now() where id=$1 and lower(email)=lower($2) returning id`,
      [record.user_id,record.email]
    );
    if(!updated.rowCount)return json({error:"user_not_found",message:"Konto konnte nicht bestätigt werden."},400);
    return json({ok:true});
  }catch(error){return apiError(error);}
}
