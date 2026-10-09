import {tenantCan} from '@/lib/permissions';
import {dashboardAnalytics} from '@/lib/server/repositories/dashboard';
import {listApiBusiness} from '@/lib/server/repositories/business-api';
import {requireModuleEntitlement} from '@/lib/server/plan-access';
import {authorize} from '@/lib/server/rbac';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {apiError,json} from '@/lib/server/http';
export async function GET(){
 try{
  const session=await requireSession();
  const canInvoices=tenantCan(session.role,'invoices:read'),canPayments=tenantCan(session.role,'payments:read');
  if(canInvoices)authorize(session,'documents:read');
  if(canPayments){authorize(session,'payments:read');await requireModuleEntitlement(session.organizationId,'zahlungen');}
  return json(await withTenant(session.organizationId,session.userId,async c=>{
   const invoices=canInvoices?await listApiBusiness(c,session,'documents','kind=eq.invoice&order=issue_date.desc&limit=5'):[];
   const payments=canPayments?await listApiBusiness(c,session,'payments','order=paid_on.desc&limit=5'):[];
   const analytics=canInvoices&&canPayments?await dashboardAnalytics(c,session.organizationId):{analyticsInvoices:[],analyticsPayments:[],customerCount:0};
   return {stats:{customer_count:analytics.customerCount},invoices,payments,canInvoices,canPayments,...analytics};
  },{snapshot:true}));
 }catch(error){return apiError(error);}
}
