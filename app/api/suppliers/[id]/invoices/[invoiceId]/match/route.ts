import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {requireModuleEntitlement} from '@/lib/server/plan-access';
import {withTenant} from '@/lib/server/db';
import {apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {supplierMatchState,saveSupplierMatch} from '@/lib/server/repositories/supplier-invoice-matches';
type Context={params:Promise<{id:string;invoiceId:string}>};
export async function GET(request:NextRequest,{params}:Context){try{
 const s=await requireSession();authorize(s,'purchasing:read');await requireModuleEntitlement(s.organizationId,'lieferanten');const {id,invoiceId}=await params;
 return json(await withTenant(s.organizationId,s.userId,c=>supplierMatchState(c,s,id,invoiceId,request.nextUrl.searchParams.get('from')??'',request.nextUrl.searchParams.get('until')??''),{snapshot:true}));
}catch(error){return apiError(error);}}
export async function POST(request:NextRequest,{params}:Context){try{
 assertSameOrigin(request);const s=await requireSession();authorize(s,'purchasing:write');await requireModuleEntitlement(s.organizationId,'lieferanten');const {id,invoiceId}=await params,body=await readJson<Record<string,unknown>>(request,32768);
 return json(await withTenant(s.organizationId,s.userId,c=>saveSupplierMatch(c,s,id,invoiceId,body,request.headers.get('idempotency-key')??'')),201);
}catch(error){return apiError(error);}}
