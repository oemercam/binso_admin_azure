import { NextRequest } from "next/server";
import { destroySession, endDemoSession } from "@/lib/server/session";
import { apiError, assertSameOrigin, json } from "@/lib/server/http";
import {destroyOperatorSession} from "@/lib/server/operator/session";
import {microsoftLogoutUrl} from "@/lib/server/operator/entra";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 try{assertSameOrigin(request);await destroySession();await endDemoSession();await destroyOperatorSession();return json({ok:true,microsoftLogoutUrl:microsoftLogoutUrl()})}
 catch(error){return apiError(error)}
}
