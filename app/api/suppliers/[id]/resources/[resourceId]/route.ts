import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {requireModuleEntitlement} from '@/lib/server/plan-access';
import {withTenant} from '@/lib/server/db';
import {apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {writeExternalResource} from '@/lib/server/repositories/external-resources';
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string;resourceId:string}>}){try{
 assertSameOrigin(request);const s=await requireSession();await requireModuleEntitlement(s.organizationId,'lieferanten');const {id,resourceId}=await params,body=await readJson<Record<string,unknown>>(request,4096);
 return json(await withTenant(s.organizationId,s.userId,c=>writeExternalResource(c,s,id,resourceId,body,request.headers.get('idempotency-key')??'')));
}catch(error){return apiError(error);}}
