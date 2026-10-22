import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {requireModuleEntitlement} from '@/lib/server/plan-access';
import {withTenant} from '@/lib/server/db';
import {apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {listSuppliers,supplierInput,writeSupplier} from '@/lib/server/repositories/suppliers';
export async function GET(request:NextRequest){try{
 const s=await requireSession();authorize(s,'purchasing:read');await requireModuleEntitlement(s.organizationId,'lieferanten');
 return json(await withTenant(s.organizationId,s.userId,c=>listSuppliers(c,s,request.nextUrl.searchParams)));
}catch(error){return apiError(error);}}
export async function POST(request:NextRequest){try{
 const s=await requireSession();authorize(s,'purchasing:write');await requireModuleEntitlement(s.organizationId,'lieferanten');assertSameOrigin(request);
 const input=supplierInput(await readJson<Record<string,unknown>>(request,8192));
 return json(await withTenant(s.organizationId,s.userId,c=>writeSupplier(c,s,null,input,request.headers.get('idempotency-key')??'')),201);
}catch(error){return apiError(error);}}
