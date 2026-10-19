import {cashStatisticsData} from '@/lib/server/repositories/finance';
import {tenantCan} from '@/lib/permissions';
import {dashboardAnalytics,dashboardAttention} from '@/lib/server/repositories/dashboard';
import {listApiBusiness} from '@/lib/server/repositories/business-api';
import {requireModuleEntitlement} from '@/lib/server/plan-access';
import {authorize} from '@/lib/server/rbac';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {apiError,json} from '@/lib/server/http';
export async function GET(){
 try{
  const session=await requireSession();
  const canFinance=tenantCan(session.role,'accounting:read');
  const canInvoices=tenantCan(session.role,'invoices:read'),canPayments=tenantCan(session.role,'payments:read');
  if(canInvoices)authorize(session,'documents:read');
  if(canPayments){authorize(session,'payments:read');await requireModuleEntitlement(session.organizationId,'zahlungen');}
  return json(await withTenant(session.organizationId,session.userId,async c=>{
   const invoices=canInvoices?await listApiBusiness(c,session,'documents','kind=eq.invoice&order=issue_date.desc&limit=5'):[];
   const payments=canPayments?await listApiBusiness(c,session,'payments','order=paid_on.desc&limit=5'):[];
   const analytics=canInvoices&&canPayments?await dashboardAnalytics(c,session.organizationId):{analyticsInvoices:[],analyticsPayments:[],customerCount:0};
   const overdueIds=canInvoices?await dashboardAttention(c,session.organizationId):[];
   const attention=(await Promise.all(overdueIds.map(row=>listApiBusiness(c,session,'documents','kind=eq.invoice&id=eq.'+encodeURIComponent(String(row.id)))))).flat();
   const recent=canInvoices?await listApiBusiness(c,session,'documents','kind=eq.invoice&order=updated_at.desc&limit=5'):[];
   const cash=canFinance?await cashStatisticsData(c,session.organizationId):null;
   const canTime=tenantCan(session.role,'time:read'),canExpenses=tenantCan(session.role,'expenses:read');
   const work=!canFinance&&(canTime||canExpenses)?{
    hours:canTime?Number((await c.query("select coalesce(sum(hours),0) hours from time_entries where organization_id=$1 and created_by_user_id=$2 and archived_at is null and work_date>=date_trunc('month',now() at time zone 'Europe/Zurich')::date and work_date<(date_trunc('month',now() at time zone 'Europe/Zurich')+interval '1 month')::date",[session.organizationId,session.userId])).rows[0].hours):null,
    pending:canTime?Number((await c.query('select count(*) pending from time_entries where organization_id=$1 and created_by_user_id=$2 and archived_at is null and billable and not approved',[session.organizationId,session.userId])).rows[0].pending):null,
    expenses:canExpenses?Number((await c.query("select count(*) pending from expenses where organization_id=$1 and created_by_user_id=$2 and archived_at is null and status='submitted'",[session.organizationId,session.userId])).rows[0].pending):null,
   }:null;
   return {attention,recent,cash,work,canFinance,stats:{customer_count:analytics.customerCount},invoices,payments,canInvoices,canPayments,...analytics};
  },{snapshot:true}));
 }catch(error){return apiError(error);}
}
