import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {listCommercialContracts,writeCommercialContract} from '@/lib/server/repositories/commercial-contracts';
export async function GET(request:NextRequest){try{
 const s=await requireSession(),p=request.nextUrl.searchParams,offset=p.get('offset')??'0',q=(p.get('q')??'').trim(),status=p.get('status')??'all',side=p.get('side')??'all',partyId=p.get('partyId')??'',order=p.get('order')??'created_at.desc';
 if(!/^\d{1,6}$/.test(offset)||q.length>120||!['all','draft','active','paused','ended','cancelled'].includes(status)||!['all','purchase','sale'].includes(side)||(partyId&&! /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(partyId)))throw new ApiError(400,'query_invalid','Bitte einen gültigen Vertragsfilter wählen.');
 return json(await withTenant(s.organizationId,s.userId,c=>listCommercialContracts(c,s,Number(offset),{q,status,side,partyId,order})));
}catch(error){return apiError(error);}}
export async function POST(request:NextRequest){try{assertSameOrigin(request);const s=await requireSession(),body=await readJson(request,8192);return json(await withTenant(s.organizationId,s.userId,c=>writeCommercialContract(c,s,null,body,request.headers.get('idempotency-key')??'')),201);}catch(error){return apiError(error);}}
