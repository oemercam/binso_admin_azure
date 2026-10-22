import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {requireModuleEntitlement} from '@/lib/server/plan-access';
import {withTenant} from '@/lib/server/db';
import {apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {getSupplier,supplierInput,writeSupplier} from '@/lib/server/repositories/suppliers';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{
 const s=await requireSession();authorize(s,'purchasing:read');await requireModuleEntitlement(s.organizationId,'lieferanten');const {id}=await params;
 return json(await withTenant(s.organizationId,s.userId,c=>getSupplier(c,s,id)));
}catch(error){return apiError(error);}}
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{
 const s=await requireSession();authorize(s,'purchasing:write');await requireModuleEntitlement(s.organizationId,'lieferanten');assertSameOrigin(request);
 const {id}=await params,input=supplierInput(await readJson<Record<string,unknown>>(request,8192));
 return json(await withTenant(s.organizationId,s.userId,c=>writeSupplier(c,s,id,input,request.headers.get('idempotency-key')??'')));
}catch(error){return apiError(error);}}
