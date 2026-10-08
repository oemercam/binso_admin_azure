import {dashboardAnalytics} from "@/lib/server/repositories/dashboard";
import { withDemo } from '@/lib/server/demo';
import { listApiBusiness } from '@/lib/server/repositories/business-api';
import { apiError,json } from '@/lib/server/http';
export async function GET(){
 try{
  return json(await withDemo(async(c,s)=>{
   const invoices=await listApiBusiness(c,s,'documents','kind=eq.invoice');
   const payments=await listApiBusiness(c,s,'payments','status=eq.booked');
   const analytics=await dashboardAnalytics(c,s.organizationId);
   return {stats:{customer_count:analytics.customerCount},invoices:invoices.slice(0,5),payments:payments.slice(0,5),...analytics,demo:true};
  }));
 }catch(e){return apiError(e)}
}
