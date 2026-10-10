import {cashStatisticsData} from '@/lib/server/repositories/finance';
import {dashboardAnalytics,dashboardAttention} from "@/lib/server/repositories/dashboard";
import { withDemo } from '@/lib/server/demo';
import { listApiBusiness } from '@/lib/server/repositories/business-api';
import { apiError,json } from '@/lib/server/http';
export async function GET(){
 try{
  return json(await withDemo(async(c,s)=>{
   const invoices=await listApiBusiness(c,s,'documents','kind=eq.invoice');
   const payments=await listApiBusiness(c,s,'payments','status=eq.booked');
   const analytics=await dashboardAnalytics(c,s.organizationId);
   const cash=await cashStatisticsData(c,s.organizationId);
   const attention=(await Promise.all((await dashboardAttention(c,s.organizationId)).map(row=>listApiBusiness(c,s,'documents','kind=eq.invoice&id=eq.'+encodeURIComponent(String(row.id)))))).flat();
   return {attention,recent:await listApiBusiness(c,s,'documents','kind=eq.invoice&order=updated_at.desc&limit=5'),cash,canFinance:true,stats:{customer_count:analytics.customerCount},invoices:invoices.slice(0,5),payments:payments.slice(0,5),...analytics,demo:true};
  }));
 }catch(e){return apiError(e)}
}
