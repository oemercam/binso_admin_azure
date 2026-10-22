import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {requireModuleEntitlement} from '@/lib/server/plan-access';
import {withTenant} from '@/lib/server/db';
import {apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {listSupplierInvoices,saveSupplierInvoice} from '@/lib/server/repositories/supplier-invoices';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{
 const s=await requireSession();authorize(s,'purchasing:read');await requireModuleEntitlement(s.organizationId,'lieferanten');const {id}=await params;
 return json(await withTenant(s.organizationId,s.userId,c=>listSupplierInvoices(c,s,id)));
}catch(error){return apiError(error);}}
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{
 assertSameOrigin(request);const s=await requireSession();authorize(s,'purchasing:write');await requireModuleEntitlement(s.organizationId,'lieferanten');const {id}=await params,body=await readJson<Record<string,unknown>>(request,8192);
 return json(await withTenant(s.organizationId,s.userId,c=>saveSupplierInvoice(c,s,id,body,request.headers.get('idempotency-key')??'')),201);
}catch(error){return apiError(error);}}
