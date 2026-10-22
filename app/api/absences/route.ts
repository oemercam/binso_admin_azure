import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {createAbsence,listAbsences} from '@/lib/server/repositories/absences';
export async function GET(request:NextRequest){try{
 const s=await requireSession(),scope=request.nextUrl.searchParams.get('scope')??'self',raw=request.nextUrl.searchParams.get('offset')??'0';
 if(!['self','team'].includes(scope)||!/^\d{1,6}$/.test(raw))throw new ApiError(400,'absence_query_invalid','Bitte einen gültigen Abwesenheitsbereich wählen.');
 return json(await withTenant(s.organizationId,s.userId,c=>listAbsences(c,s,scope as 'self'|'team',Number(raw))));
}catch(error){return apiError(error);}}
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);const s=await requireSession(),body=await readJson(request,4096);
 return json(await withTenant(s.organizationId,s.userId,c=>createAbsence(c,s,body,request.headers.get('idempotency-key')??'')),201);
}catch(error){return apiError(error);}}
