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
 const [payments,outflows,coverage]=await Promise.all([
  c.query("select p.payment_date::text,sum(p.amount) amount from payments p join invoices i on i.id=p.invoice_id and i.organization_id=p.organization_id where p.organization_id=$1 and p.archived_at is null and p.allocation_status='matched' and i.currency='CHF' group by p.payment_date order by p.payment_date",[organizationId]),
  c.query("select (reimbursed_at at time zone 'Europe/Zurich')::date::text payment_date,sum(quantity*unit_price)::numeric(14,2) amount from expenses where organization_id=$1 and archived_at is null and currency='CHF' and reimbursed_at is not null and status in ('approved','posted') group by (reimbursed_at at time zone 'Europe/Zurich')::date order by payment_date",[organizationId]),
  c.query("select exists(select 1 from operating_costs where organization_id=$1 and scope='tenant' and currency='CHF') or exists(select 1 from payroll_runs where organization_id=$1 and status in ('approved','paid')) incomplete",[organizationId])
 ]);
 return {payments:payments.rows,outflows:outflows.rows,incomplete:Boolean(coverage.rows[0]?.incomplete)};
}
