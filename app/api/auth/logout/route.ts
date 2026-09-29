import { NextRequest } from "next/server";
import { destroySession } from "@/lib/server/session";
import { apiError, assertSameOrigin, json } from "@/lib/server/http";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 try{assertSameOrigin(request);await destroySession();return json({ok:true})}
 catch(error){return apiError(error,request)}
}
