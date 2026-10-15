import {NextRequest} from 'next/server';
import {apiError,cleanText,json} from '@/lib/server/http';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {findCustomerDuplicates} from '@/lib/server/repositories/customers';
export async function GET(request:NextRequest){try{
 const session=await requireSession();authorize(session,'customers:read');
 const p=request.nextUrl.searchParams;
 return json({items:await findCustomerDuplicates(session,{name:cleanText(p.get('name'),320),email:cleanText(p.get('email'),320),uid:cleanText(p.get('uid'),320)},cleanText(p.get('excludeId'),80))});
}catch(error){return apiError(error)}}
