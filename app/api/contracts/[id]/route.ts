import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {commercialContractDetail,writeCommercialContract} from '@/lib/server/repositories/commercial-contracts';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{const s=await requireSession(),{id}=await params;return json(await withTenant(s.organizationId,s.userId,c=>commercialContractDetail(c,s,id)));}catch(error){return apiError(error);}}
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{assertSameOrigin(request);const s=await requireSession(),{id}=await params,body=await readJson(request,8192);return json(await withTenant(s.organizationId,s.userId,c=>writeCommercialContract(c,s,id,body,request.headers.get('idempotency-key')??'')));}catch(error){return apiError(error);}}
