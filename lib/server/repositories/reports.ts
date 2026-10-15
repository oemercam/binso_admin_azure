import 'server-only';
import type {PoolClient} from 'pg';
import {tenantCan,ownRecordOnly} from '@/lib/permissions';
import {planAllowsModule,type PlanId} from '@/config/plan-access';
import {authorize} from '@/lib/server/rbac';
import type {SessionUser} from '@/lib/server/session';
import type {ReportSummary} from '@/lib/report-export';
export async function reportSummary(c:PoolClient,s:SessionUser,period:{from:string;to:string},plan:PlanId):Promise<ReportSummary>{
 authorize(s,'reports:read');
 const args=[s.organizationId,period.from,period.to];
 const customers=tenantCan(s.role,'customers:read')&&planAllowsModule(plan,'kunden')?(await c.query(`select count(*)::text total,count(*) filter(where (created_at at time zone 'Europe/Zurich')::date between $2::date and $3::date)::text added from customers where organization_id=$1 and archived_at is null`,args)).rows[0]:null;
 const projects=tenantCan(s.role,'projects:read')&&planAllowsModule(plan,'projekte')?(await c.query(`select status,count(*)::text count from projects where organization_id=$1 and archived_at is null group by status order by status`,[s.organizationId])).rows:null;
 const time=tenantCan(s.role,'time:read')&&planAllowsModule(plan,'zeiterfassung')?(await c.query(`select coalesce(sum(hours),0)::text hours,coalesce(sum(hours) filter(where billable),0)::text billable_hours,coalesce(sum(hours) filter(where invoiced_invoice_id is not null),0)::text invoiced_hours from time_entries where organization_id=$1 and archived_at is null and work_date between $2::date and $3::date and ($4::boolean=false or created_by_user_id=$5)`,[...args,ownRecordOnly(s.role,'zeiterfassung'),s.userId])).rows[0]:null;
 const payments=tenantCan(s.role,'payments:read')&&planAllowsModule(plan,'zahlungen')?(await c.query(`select i.currency,sum(p.amount)::text amount from payments p join invoices i on i.id=p.invoice_id and i.organization_id=p.organization_id where p.organization_id=$1 and p.archived_at is null and p.allocation_status='matched' and p.payment_date between $2::date and $3::date group by i.currency order by i.currency`,args)).rows:null;
 const expenses=tenantCan(s.role,'expenses:read')&&planAllowsModule(plan,'spesen')?(await c.query(`select currency,sum(quantity*unit_price)::text amount from expenses where organization_id=$1 and archived_at is null and status in ('approved','posted') and reimbursed_at is not null and (reimbursed_at at time zone 'Europe/Zurich')::date between $2::date and $3::date group by currency order by currency`,args)).rows:null;
 const employees=tenantCan(s.role,'employees:read')&&planAllowsModule(plan,'personal')?(await c.query(`select count(*)::text total,count(*) filter(where active)::text active from employees where organization_id=$1 and archived_at is null`,[s.organizationId])).rows[0]:null;
 return {period,asOf:new Date().toISOString(),customers,projects,time,payments,expenses,employees} as ReportSummary;
}
