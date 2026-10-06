import {NextRequest} from "next/server";
import {apiError,assertSameOrigin,cleanText,json,readJson} from "@/lib/server/http";
import {requireSession} from "@/lib/server/session";
import {withTenant} from "@/lib/server/db";
import {changeDocumentStatus} from "@/lib/server/document-process";
export async function POST(request:NextRequest,{params}:{params:Promise<{number:string}>}){try{
 assertSameOrigin(request);const s=await requireSession();const {number}=await params;
 const b=await readJson<{action?:unknown;note?:unknown}>(request,4096);
 return json(await withTenant(s.organizationId,s.userId,c=>changeDocumentStatus(c,s,number,cleanText(b.action,30),cleanText(b.note,2000))));
}catch(e){return apiError(e)}}
