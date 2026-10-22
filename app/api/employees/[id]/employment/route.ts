import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {requireModuleEntitlement} from '@/lib/server/plan-access';
import {withTenant} from '@/lib/server/db';
import {apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {listEmploymentPeriods,writeEmploymentPeriod} from '@/lib/server/repositories/employment';

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{
 const s=await requireSession();authorize(s,'employees:read');await requireModuleEntitlement(s.organizationId,'personal');
 const {id}=await params;return json(await withTenant(s.organizationId,s.userId,c=>listEmploymentPeriods(c,s,id)));
}catch(error){return apiError(error);}}
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{
 const s=await requireSession();authorize(s,'employees:write');await requireModuleEntitlement(s.organizationId,'personal');assertSameOrigin(request);
 const {id}=await params,body=await readJson(request,8192);
 return json(await withTenant(s.organizationId,s.userId,c=>writeEmploymentPeriod(c,s,id,null,body as Parameters<typeof writeEmploymentPeriod>[4],request.headers.get('idempotency-key')??'')),201);
}catch(error){return apiError(error);}}
