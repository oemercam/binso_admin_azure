import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {withTenant} from '@/lib/server/db';
import {financialSummary} from '@/lib/server/repositories/financial-summary';
import {apiError,json} from '@/lib/server/http';
export async function GET(request:NextRequest){try{const s=await requireSession();authorize(s,'organization:read');return json(await withTenant(s.organizationId,s.userId,c=>financialSummary(c,s,request.nextUrl.searchParams.get('customerId'))));}catch(e){return apiError(e)}}
