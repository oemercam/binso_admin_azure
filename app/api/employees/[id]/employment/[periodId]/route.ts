import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {requireModuleEntitlement} from '@/lib/server/plan-access';
import {withTenant} from '@/lib/server/db';
import {apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {writeEmploymentPeriod} from '@/lib/server/repositories/employment';

export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string;periodId:string}>}){try{
 const s=await requireSession();authorize(s,'employees:write');await requireModuleEntitlement(s.organizationId,'personal');assertSameOrigin(request);
 const {id,periodId}=await params,body=await readJson(request,8192);
 return json(await withTenant(s.organizationId,s.userId,c=>writeEmploymentPeriod(c,s,id,periodId,body as Parameters<typeof writeEmploymentPeriod>[4],request.headers.get('idempotency-key')??'')));
}catch(error){return apiError(error);}}
