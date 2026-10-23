import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {requireModuleEntitlement} from '@/lib/server/plan-access';
import {withTenant} from '@/lib/server/db';
import {apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {listExternalResources,writeExternalResource} from '@/lib/server/repositories/external-resources';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{
 const s=await requireSession();await requireModuleEntitlement(s.organizationId,'lieferanten');const {id}=await params;
 return json(await withTenant(s.organizationId,s.userId,c=>listExternalResources(c,s,id)));
}catch(error){return apiError(error);}}
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{
 assertSameOrigin(request);const s=await requireSession();await requireModuleEntitlement(s.organizationId,'lieferanten');const {id}=await params,body=await readJson<Record<string,unknown>>(request,4096);
 return json(await withTenant(s.organizationId,s.userId,c=>writeExternalResource(c,s,id,null,body,request.headers.get('idempotency-key')??'')),201);
}catch(error){return apiError(error);}}
