import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {tenantCan} from '@/lib/permissions';
import {withTenant} from '@/lib/server/db';
import {financialSummary} from '@/lib/server/repositories/financial-summary';
import {financeData,cashStatisticsData} from '@/lib/server/repositories/finance';
import {listApiBusiness} from '@/lib/server/repositories/business-api';
import {apiError,json} from '@/lib/server/http';
export async function GET(request:NextRequest){try{
 const s=await requireSession();authorize(s,'organization:read');
 const customerId=request.nextUrl.searchParams.get('customerId');
 return json(await withTenant(s.organizationId,s.userId,async c=>{
  const summary=await financialSummary(c,s,customerId);
  if(request.nextUrl.searchParams.get('include')!=='workspace')return summary;
  authorize(s,'documents:read');authorize(s,'accounting:read');
  const documents=await listApiBusiness(c,s,'documents',customerId?'customer_id=eq.'+encodeURIComponent(customerId):'');
  const data=tenantCan(s.role,'accounting:read')?await financeData(c,s.organizationId):{};
  const cash=tenantCan(s.role,'accounting:read')?await cashStatisticsData(c,s.organizationId):null;
  return {...summary,documents,data,cash};
 },{snapshot:true}));
}catch(e){return apiError(e)}}
