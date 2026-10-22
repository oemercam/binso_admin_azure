import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {requireModuleEntitlement} from '@/lib/server/plan-access';
import {withTenant} from '@/lib/server/db';
import {apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {writeExternalAssignment} from '@/lib/server/repositories/external-resources';
async function mutate(request:NextRequest,params:Promise<{id:string;resourceId:string}>,revoke:boolean){try{
 assertSameOrigin(request);const s=await requireSession();await requireModuleEntitlement(s.organizationId,'lieferanten');const {id,resourceId}=await params,body=await readJson<Record<string,unknown>>(request,4096);
 return json(await withTenant(s.organizationId,s.userId,c=>writeExternalAssignment(c,s,id,resourceId,body,request.headers.get('idempotency-key')??'',revoke)),revoke?200:201);
}catch(error){return apiError(error);}}
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string;resourceId:string}>}){return mutate(request,params,false);}
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string;resourceId:string}>}){return mutate(request,params,true);}
