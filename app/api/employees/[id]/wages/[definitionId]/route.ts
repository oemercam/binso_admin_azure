import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {writeWageDefinition} from '@/lib/server/repositories/wage-definitions';
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string;definitionId:string}>}){try{
 assertSameOrigin(request);const s=await requireSession(),{id,definitionId}=await params,body=await readJson(request,4096);
 return json(await withTenant(s.organizationId,s.userId,c=>writeWageDefinition(c,s,id,definitionId,body,request.headers.get('idempotency-key')??'')));
}catch(error){return apiError(error);}}
