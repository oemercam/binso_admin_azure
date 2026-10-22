import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {listCommercialContracts,writeCommercialContract} from '@/lib/server/repositories/commercial-contracts';
export async function GET(request:NextRequest){try{const s=await requireSession(),offset=request.nextUrl.searchParams.get('offset')??'0';if(!/^\d{1,6}$/.test(offset))throw new ApiError(400,'query_invalid','Bitte eine gültige Seite wählen.');return json(await withTenant(s.organizationId,s.userId,c=>listCommercialContracts(c,s,Number(offset))));}catch(error){return apiError(error);}}
export async function POST(request:NextRequest){try{assertSameOrigin(request);const s=await requireSession(),body=await readJson(request,8192);return json(await withTenant(s.organizationId,s.userId,c=>writeCommercialContract(c,s,null,body,request.headers.get('idempotency-key')??'')),201);}catch(error){return apiError(error);}}
