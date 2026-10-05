import { NextRequest } from "next/server";
import { destroySession, endDemoSession } from "@/lib/server/session";
import { apiError, assertSameOrigin, json } from "@/lib/server/http";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 try{assertSameOrigin(request);await destroySession();await endDemoSession();return json({ok:true})}
 catch(error){return apiError(error)}
}
