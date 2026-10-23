import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {requireModuleEntitlement} from '@/lib/server/plan-access';
import {withTenant} from '@/lib/server/db';
import {apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {supplierApprovalPolicy,saveSupplierApprovalPolicy} from '@/lib/server/repositories/supplier-approval-policy';
export async function GET(){try{const s=await requireSession();await requireModuleEntitlement(s.organizationId,'lieferanten');return json(await withTenant(s.organizationId,s.userId,c=>supplierApprovalPolicy(c,s)));}catch(e){return apiError(e);}}
export async function POST(request:NextRequest){try{assertSameOrigin(request);const s=await requireSession();await requireModuleEntitlement(s.organizationId,'lieferanten');const body=await readJson<Record<string,unknown>>(request,4096);return json(await withTenant(s.organizationId,s.userId,c=>saveSupplierApprovalPolicy(c,s,body,request.headers.get('idempotency-key')??'')),201);}catch(e){return apiError(e);}}
