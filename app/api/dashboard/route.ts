import {cashStatisticsData} from '@/lib/server/repositories/finance';
import {tenantCan} from '@/lib/permissions';
import {dashboardAttention,dashboardWork} from '@/lib/server/repositories/dashboard';
import {listApiBusiness} from '@/lib/server/repositories/business-api';
import {requireModuleEntitlement,getOrganizationPlan} from '@/lib/server/plan-access';
import {planAllowsModule} from '@/config/plan-access';
import {authorize} from '@/lib/server/rbac';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {apiError,json} from '@/lib/server/http';
export async function GET(){
 try{
  const session=await requireSession();
  const plan=await getOrganizationPlan(session.organizationId);
  const canFinance=tenantCan(session.role,'accounting:read');
  const canInvoices=tenantCan(session.role,'invoices:read'),canPayments=tenantCan(session.role,'payments:read');
  if(canInvoices)authorize(session,'documents:read');
  if(canPayments){authorize(session,'payments:read');await requireModuleEntitlement(session.organizationId,'zahlungen');}
  return json(await withTenant(session.organizationId,session.userId,async c=>{
   const attention=await dashboardAttention(c,session);
   const recent=canInvoices?await listApiBusiness(c,session,'documents','kind=eq.invoice&order=updated_at.desc&limit=5'):[];
   const cash=canFinance?await cashStatisticsData(c,session.organizationId):null;
   const work=await dashboardWork(c,session);
   const customerCount=tenantCan(session.role,'customers:read')?Number((await c.query('select count(*) count from customers where organization_id=$1 and archived_at is null',[session.organizationId])).rows[0].count):null;
   const projectCount=tenantCan(session.role,'projects:read')?Number((await c.query("select count(*) count from projects where organization_id=$1 and archived_at is null and status in ('active','in_progress')",[session.organizationId])).rows[0].count):null;
   const employeeCount=tenantCan(session.role,'employees:read')&&planAllowsModule(plan,'personal')?Number((await c.query('select count(*) count from employees where organization_id=$1 and archived_at is null and active',[session.organizationId])).rows[0].count):null;
   return {attention,recent,cash,work,canFinance,stats:{customer_count:customerCount,project_count:projectCount,employee_count:employeeCount},canInvoices,canPayments};
  },{snapshot:true}));
 }catch(error){return apiError(error);}
}
