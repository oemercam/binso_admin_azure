import {canConfigureSetup,readSetupGuide} from '@/lib/server/business-readiness';
import {cashStatisticsData} from '@/lib/server/repositories/finance';
import {tenantCan} from '@/lib/permissions';
import {dashboardAttention,dashboardWork} from '@/lib/server/repositories/dashboard';
import {listApiBusiness} from '@/lib/server/repositories/business-api';
import {assertModuleEntitlement,getOrganizationPlan} from '@/lib/server/plan-access';
import {planAllowsModule} from '@/config/plan-access';
import {authorize} from '@/lib/server/rbac';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {apiError,json} from '@/lib/server/http';
export async function GET(){
 try{
  const session=await requireSession();
  if(session.moduleProfile==='time_only')authorize(session,'organization:read');
  const plan=await getOrganizationPlan(session.organizationId);
  const canFinance=tenantCan(session.role,'accounting:read');
  const canInvoices=tenantCan(session.role,'invoices:read'),canPayments=tenantCan(session.role,'payments:read');
  if(canInvoices)authorize(session,'documents:read');
  if(canPayments){authorize(session,'payments:read');assertModuleEntitlement(plan,'zahlungen');}
  return json(await withTenant(session.organizationId,session.userId,async c=>{
   const attention=await dashboardAttention(c,session);
   const recent=canInvoices?await listApiBusiness(c,session,'documents','kind=eq.invoice&order=updated_at.desc&limit=5'):[];
   const cash=canFinance?await cashStatisticsData(c,session.organizationId):null;
   const work=await dashboardWork(c,session);
   // One round trip on the existing tenant/snapshot connection, with unchanged
   // permission gates and predicates. An inaccessible metric remains null.
   const counts=(await c.query<{customer_count:string|null;project_count:string|null;employee_count:string|null}>(`select
    case when $2::boolean then (select count(*) from customers where organization_id=$1 and archived_at is null) end customer_count,
    case when $3::boolean then (select count(*) from projects where organization_id=$1 and archived_at is null and status in ('active','in_progress')) end project_count,
    case when $4::boolean then (select count(*) from employees where organization_id=$1 and archived_at is null and active) end employee_count`,
    [session.organizationId,tenantCan(session.role,'customers:read'),tenantCan(session.role,'projects:read'),tenantCan(session.role,'employees:read')&&planAllowsModule(plan,'personal')])).rows[0];
   const customerCount=counts.customer_count===null?null:Number(counts.customer_count);
   const projectCount=counts.project_count===null?null:Number(counts.project_count);
   const employeeCount=counts.employee_count===null?null:Number(counts.employee_count);
   return {setup:canConfigureSetup(session)?await readSetupGuide(c,session):null,attention,recent,cash,work,canFinance,stats:{customer_count:customerCount,project_count:projectCount,employee_count:employeeCount},canInvoices,canPayments};
  },{snapshot:true}));
 }catch(error){return apiError(error);}
}
