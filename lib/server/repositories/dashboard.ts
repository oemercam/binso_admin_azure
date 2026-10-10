import 'server-only';
import type {PoolClient} from 'pg';
export async function dashboardAnalytics(c:PoolClient,organizationId:string){
 const invoices=await c.query(`select date_trunc('month',issue_date)::date::text issue_date,sum(total_amount) total,count(*)::int invoice_count,count(distinct customer_id)::int customer_count from invoices where organization_id=$1 and archived_at is null and currency='CHF' and status not in ('draft','cancelled') and issue_date>=date_trunc('year',(now() at time zone 'Europe/Zurich')::date)-interval '1 year' group by date_trunc('month',issue_date) order by issue_date`,[organizationId]);
 const payments=await c.query(`select date_trunc('month',p.payment_date)::date::text paid_on,sum(p.amount) amount from payments p join invoices i on i.id=p.invoice_id and i.organization_id=p.organization_id where p.organization_id=$1 and p.archived_at is null and p.allocation_status='matched' and i.currency='CHF' and p.payment_date>=date_trunc('year',(now() at time zone 'Europe/Zurich')::date)-interval '1 year' group by date_trunc('month',p.payment_date) order by paid_on`,[organizationId]);
 const customers=await c.query('select count(*)::int customer_count from customers where organization_id=$1 and archived_at is null',[organizationId]);
 return {analyticsInvoices:invoices.rows,analyticsPayments:payments.rows,customerCount:Number(customers.rows[0].customer_count)};
}

/** Query the full population before limiting; a recent-list cap cannot hide overdue invoices. */
export async function dashboardAttention(c:PoolClient,organizationId:string){
 return (await c.query(`select id from invoices where organization_id=$1 and archived_at is null and status not in ('draft','cancelled') and total_amount>paid_amount and due_date<(now() at time zone 'Europe/Zurich')::date order by due_date,id limit 5`,[organizationId])).rows;
}
