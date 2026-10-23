import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {apiError,json} from '@/lib/server/http';
import {absenceContext} from '@/lib/server/repositories/absences';
export async function GET(request:NextRequest){try{
 const s=await requireSession(),id=request.nextUrl.searchParams.get('employeeId')??'';return json(await withTenant(s.organizationId,s.userId,c=>absenceContext(c,s,id)));
}catch(error){return apiError(error);}}
