import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {listWageDefinitions,writeWageDefinition} from '@/lib/server/repositories/wage-definitions';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{
 const s=await requireSession(),{id}=await params;return json(await withTenant(s.organizationId,s.userId,c=>listWageDefinitions(c,s,id)));
}catch(error){return apiError(error);}}
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{
 assertSameOrigin(request);const s=await requireSession(),{id}=await params,body=await readJson(request,4096);
 return json(await withTenant(s.organizationId,s.userId,c=>writeWageDefinition(c,s,id,null,body,request.headers.get('idempotency-key')??'')),201);
}catch(error){return apiError(error);}}
