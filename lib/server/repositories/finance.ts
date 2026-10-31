import 'server-only';
import type {PoolClient} from 'pg';
/** Cash-based CHF reporting. Other invoice currencies are returned separately by financialSummary. */
export async function financeData(c:PoolClient,organizationId:string){
 const [payments,invoices,expenses,payroll,operating]=await Promise.all([
  c.query("select p.payment_date::text,sum(p.amount) amount from payments p join invoices i on i.id=p.invoice_id and i.organization_id=p.organization_id where p.organization_id=$1 and p.archived_at is null and p.allocation_status='matched' and i.currency='CHF' group by p.payment_date order by p.payment_date desc",[organizationId]),
  c.query("select issue_date::text,sum(total_amount) total_amount,status from invoices where organization_id=$1 and archived_at is null and currency='CHF' group by issue_date,status order by issue_date desc",[organizationId]),
  c.query("select expense_date::text,sum(quantity*unit_price)::numeric(14,2) amount,category,status from expenses where organization_id=$1 and archived_at is null and currency='CHF' and status in ('approved','posted') group by expense_date,category,status order by expense_date desc",[organizationId]),
  c.query("select period,sum(gross_amount) gross_amount,sum(deduction_amount) deduction_amount,sum(net_amount) net_amount,status from payroll_runs where organization_id=$1 and status in ('approved','paid') group by period,status order by period desc",[organizationId]),
  c.query("select cost_date::text,category,sum(amount) amount from operating_costs where organization_id=$1 and scope='tenant' and currency='CHF' group by cost_date,category order by cost_date desc",[organizationId])
 ]);
 return {payments:payments.rows,invoices:invoices.rows,expenses:expenses.rows,payroll:payroll.rows,operatingCosts:operating.rows};
}

/** Exact cash dates only. Legacy costs/payroll have no payment-date evidence. */
export async function cashStatisticsData(c:PoolClient,organizationId:string){
 const [payments,outflows,coverage,refunds]=await Promise.all([
  c.query("select p.payment_date::text,sum(p.amount) amount from payments p join invoices i on i.id=p.invoice_id and i.organization_id=p.organization_id where p.organization_id=$1 and p.archived_at is null and p.allocation_status='matched' and i.currency='CHF' group by p.payment_date order by p.payment_date",[organizationId]),
  c.query("select reimbursement_paid_on::text payment_date,sum(reimbursement_amount)::numeric(14,2) amount from expenses where organization_id=$1 and archived_at is null and reimbursement_currency='CHF' and reimbursed_at is not null and reimbursement_paid_on is not null and reimbursement_amount is not null and status in ('approved','posted') group by reimbursement_paid_on order by payment_date",[organizationId]),
  c.query("select exists(select 1 from operating_costs where organization_id=$1 and scope='tenant' and currency='CHF') or exists(select 1 from payroll_runs where organization_id=$1 and status in ('approved','paid')) or exists(select 1 from expenses where organization_id=$1 and archived_at is null and currency='CHF' and reimbursed_at is not null and (reimbursement_paid_on is null or reimbursement_amount is null or reimbursement_currency is null)) incomplete",[organizationId]),
  c.query("select r.refund_date::text payment_date,sum(r.amount) amount from invoice_refunds r join invoices i on i.organization_id=r.organization_id and i.id=r.invoice_id where r.organization_id=$1 and i.currency='CHF' and r.refund_date<=(now() at time zone 'Europe/Zurich')::date group by r.refund_date order by r.refund_date",[organizationId])
 ]);
 return {payments:payments.rows,outflows:outflows.rows,refunds:refunds.rows,incomplete:Boolean(coverage.rows[0]?.incomplete),financial:await financialMetricsData(c,organizationId)};
}


/** One CHF metric definition: issued gross revenue by document date, cash by
 * actual payment date, and current receivables after recorded credit notes.
 * Call in the caller's tenant-scoped repeatable-read transaction. */
export async function financialMetricsData(c:PoolClient,organizationId:string,options:{currency?:string;customerId?:string|null}={}){
 const params=[organizationId,options.currency??'CHF',options.customerId??null];
 const scope=`select i.* from invoices i where i.organization_id=$1 and i.archived_at is null and i.currency=$2 and ($3::uuid is null or i.customer_id=$3) and i.status not in ('draft','cancelled') and i.issue_date<=(now() at time zone 'Europe/Zurich')::date`;
 const [revenue,snapshot]=await Promise.all([
  c.query(`with issued as (${scope}), events as (
   select issue_date date,total_amount amount from issued
   union all select n.credit_date,-n.amount from credit_notes n join issued i on i.id=n.invoice_id and i.organization_id=n.organization_id where n.organization_id=$1 and n.credit_date<=(now() at time zone 'Europe/Zurich')::date
  ) select date::text,sum(amount) amount from events group by date order by date`,params),
  c.query(`with issued as (${scope}), credits as (
   select n.invoice_id,sum(n.amount) amount from credit_notes n join issued i on i.id=n.invoice_id and i.organization_id=n.organization_id where n.organization_id=$1 and n.credit_date<=(now() at time zone 'Europe/Zurich')::date group by n.invoice_id
  ), refunds as (
   select r.invoice_id,sum(r.amount) amount from invoice_refunds r join issued i on i.id=r.invoice_id and i.organization_id=r.organization_id where r.organization_id=$1 and r.refund_date<=(now() at time zone 'Europe/Zurich')::date group by r.invoice_id
  ), adjusted as (
   select i.*,greatest(0,i.total_amount-coalesce(n.amount,0)) gross,greatest(0,i.paid_amount-coalesce(r.amount,0)) settled_amount from issued i left join credits n on n.invoice_id=i.id left join refunds r on r.invoice_id=i.id
  ) select (now() at time zone 'Europe/Zurich')::date::text as_of,
   coalesce(sum(least(settled_amount,gross)),0) paid,
   coalesce(sum(greatest(0,gross-settled_amount)) filter(where due_date>=(now() at time zone 'Europe/Zurich')::date),0) open,
   coalesce(sum(greatest(0,gross-settled_amount)) filter(where due_date<(now() at time zone 'Europe/Zurich')::date),0) overdue,
   coalesce(sum(greatest(0,gross-settled_amount)),0) receivables,
   count(*) filter(where gross>settled_amount)::int open_count,
   count(*) filter(where gross>settled_amount and due_date<(now() at time zone 'Europe/Zurich')::date)::int overdue_count,
   coalesce(sum(greatest(0,settled_amount-gross)),0) credit_balance
   from adjusted`,params)
 ]);
 return {revenueEvents:revenue.rows,snapshot:snapshot.rows[0]};
}
