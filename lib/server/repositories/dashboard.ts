import 'server-only';
import type {PoolClient} from 'pg';
import type {SessionUser} from '../session';
import {tenantCan} from '@/lib/permissions';
import {listApiBusiness} from './business-api';
export async function dashboardAnalytics(c:PoolClient,organizationId:string){
 const invoices=await c.query(`select date_trunc('month',issue_date)::date::text issue_date,sum(total_amount) total,count(*)::int invoice_count,count(distinct customer_id)::int customer_count from invoices where organization_id=$1 and archived_at is null and currency='CHF' and status not in ('draft','cancelled') and issue_date>=date_trunc('year',(now() at time zone 'Europe/Zurich')::date)-interval '1 year' group by date_trunc('month',issue_date) order by issue_date`,[organizationId]);
 const payments=await c.query(`select date_trunc('month',p.payment_date)::date::text paid_on,sum(p.amount) amount from payments p join invoices i on i.id=p.invoice_id and i.organization_id=p.organization_id where p.organization_id=$1 and p.archived_at is null and p.allocation_status='matched' and i.currency='CHF' and p.payment_date>=date_trunc('year',(now() at time zone 'Europe/Zurich')::date)-interval '1 year' group by date_trunc('month',p.payment_date) order by paid_on`,[organizationId]);
 const customers=await c.query('select count(*)::int customer_count from customers where organization_id=$1 and archived_at is null',[organizationId]);
 return {analyticsInvoices:invoices.rows,analyticsPayments:payments.rows,customerCount:Number(customers.rows[0].customer_count)};
}

/** Query the full population before limiting; a recent-list cap cannot hide overdue invoices. */
export async function dashboardAttention(c:PoolClient,s:SessionUser,customerId:string|null=null){
 // The document projection accounts for credits/refunds BEFORE filtering/limiting.
 // RLS and role-specific document selection remain in the shared repository.
 return tenantCan(s.role,'invoices:read')?listApiBusiness(c,s,'documents','kind=eq.invoice&display_status=eq.overdue&order=due_date.asc&limit=5'+(customerId?'&customer_id=eq.'+encodeURIComponent(customerId):'')):[];
}

/** Personal work and independent review queues use the same tenant/RLS boundary. */
export async function dashboardWork(c:PoolClient,s:SessionUser){
 const canTime=tenantCan(s.role,'time:read'),canExpenses=tenantCan(s.role,'expenses:read');
 const reviewer=['owner','admin','project_manager','manager'].includes(s.role);
 const params=[s.organizationId,s.userId];
 const time=canTime?(await c.query(`select coalesce(sum(hours) filter(where created_by_user_id=$2 and work_date>=date_trunc('month',now() at time zone 'Europe/Zurich')::date and work_date<=(now() at time zone 'Europe/Zurich')::date),0) hours,
 count(*) filter(where created_by_user_id=$2 and billable and not approved)::int pending,
 count(*) filter(where created_by_user_id<>$2 and billable and not approved and submitted_at is not null and invoiced_invoice_id is null)::int reviews
 from time_entries where organization_id=$1 and archived_at is null`,params)).rows[0]:null;
 const expenses=canExpenses?(await c.query(`select count(*) filter(where created_by_user_id=$2 and status='submitted')::int pending,
 count(*) filter(where created_by_user_id<>$2 and status='submitted')::int reviews from expenses where organization_id=$1 and archived_at is null`,params)).rows[0]:null;
 return {hours:time?Number(time.hours):null,pending:time?Number(time.pending):null,expenses:expenses?Number(expenses.pending):null,
 timeReviews:reviewer&&tenantCan(s.role,'time:write')?Number(time?.reviews??0):null,
 expenseReviews:reviewer&&tenantCan(s.role,'expenses:write')?Number(expenses?.reviews??0):null};
}
