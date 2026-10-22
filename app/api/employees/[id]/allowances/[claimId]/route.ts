import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {writeAllowanceClaim} from '@/lib/server/repositories/employee-family';
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string;claimId:string}>}){try{
 assertSameOrigin(request);const s=await requireSession(),{id,claimId}=await params,body=await readJson(request,4096);
 return json(await withTenant(s.organizationId,s.userId,c=>writeAllowanceClaim(c,s,id,claimId,body,request.headers.get('idempotency-key')??'')));
}catch(error){return apiError(error);}}
