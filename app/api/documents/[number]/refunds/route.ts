import {NextRequest} from 'next/server';
import {apiError,assertSameOrigin,cleanText,json,readJson} from '@/lib/server/http';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {recordInvoiceRefund} from '@/lib/server/credit-notes';
export async function POST(request:NextRequest,{params}:{params:Promise<{number:string}>}){
 try{
  assertSameOrigin(request);
  const session=await requireSession(),{number}=await params;
  const body=await readJson<{amount?:unknown;reason?:unknown;date?:unknown}>(request,8192);
  const item=await withTenant(session.organizationId,session.userId,c=>recordInvoiceRefund(c,session,number,{amount:Number(body.amount),reason:cleanText(body.reason,2000),date:cleanText(body.date,10)},request.headers.get('idempotency-key')?.trim()??''));
  return json({item},201);
 }catch(error){return apiError(error)}
}
