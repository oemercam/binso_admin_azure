import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {reviewContractCondition} from '@/lib/server/repositories/commercial-contracts';
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string;conditionId:string}>}){try{assertSameOrigin(request);const s=await requireSession(),{id,conditionId}=await params,body=await readJson(request,4096);return json(await withTenant(s.organizationId,s.userId,c=>reviewContractCondition(c,s,id,conditionId,body,request.headers.get('idempotency-key')??'')));}catch(error){return apiError(error);}}
