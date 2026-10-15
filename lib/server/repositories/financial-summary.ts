import "server-only";
import {financialMetricsData} from "./finance";
import {sumMoney} from "@/lib/money";
import type {PoolClient} from 'pg';
import type {SessionUser} from '../session';
import {tenantCan,ownRecordOnly} from '@/lib/permissions';
export async function financialSummary(c:PoolClient,s:SessionUser,customerId:string|null){
 const values=[s.organizationId,customerId];
 const invoices=tenantCan(s.role,'invoices:read')?(await c.query(`select currency,count(*) filter(where status='draft')::int draft_count
 from invoices where organization_id=$1 and archived_at is null and ($2::uuid is null or customer_id=$2) group by currency`,values)).rows:[];
 const offers=tenantCan(s.role,'sales:read')?(await c.query(`select count(*) filter(where status='draft')::int draft_count,count(*) filter(where status in ('draft','accepted') or status='sent' and valid_until>=(now() at time zone 'Europe/Zurich')::date)::int actionable_count from quotes where organization_id=$1 and archived_at is null and ($2::uuid is null or customer_id=$2)`,values)).rows[0]:null;
 const time=tenantCan(s.role,'time:read')?(await c.query(`select coalesce(sum(hours),0) hours,coalesce(sum(hours) filter(where billable and approved and invoiced_invoice_id is null),0) ready_hours,coalesce(sum(hours) filter(where invoiced_invoice_id is not null),0) invoiced_hours from time_entries where organization_id=$1 and archived_at is null and ($2::uuid is null or customer_id=$2) and ($3::boolean=false or created_by_user_id=$4)`,[...values,ownRecordOnly(s.role,'zeiterfassung'),s.userId])).rows[0]:null;
 // Summary rows share the same credit/date/settlement definitions as charts.
 for(const invoice of invoices){
  const metric=await financialMetricsData(c,s.organizationId,{currency:String(invoice.currency),customerId});
  invoice.open_count=metric.snapshot.open_count;invoice.overdue_count=metric.snapshot.overdue_count;
  invoice.open_amount=metric.snapshot.receivables;
  const year=String(metric.snapshot.as_of).slice(0,4);
  invoice.revenue=sumMoney(metric.revenueEvents.filter(row=>String(row.date).startsWith(year+'-')).map(row=>row.amount));
 }
 return {invoices,offers,time};
}
