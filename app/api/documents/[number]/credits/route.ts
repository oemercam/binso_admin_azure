import {NextRequest} from 'next/server';
import {apiError,assertSameOrigin,cleanText,json,readJson} from '@/lib/server/http';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {createCreditNote} from '@/lib/server/credit-notes';
export async function POST(request:NextRequest,{params}:{params:Promise<{number:string}>}){
 try{
  assertSameOrigin(request);
  const session=await requireSession(),{number}=await params;
  const body=await readJson<{amount?:unknown;reason?:unknown}>(request,8192);
  const key=request.headers.get('idempotency-key')?.trim()??'';
  const item=await withTenant(session.organizationId,session.userId,c=>createCreditNote(c,session,number,{amount:Number(body.amount),reason:cleanText(body.reason,2000)},key));
  return json({item},201);
 }catch(error){return apiError(error)}
}
