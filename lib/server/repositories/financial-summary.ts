import "server-only";
import type {PoolClient} from 'pg';
import type {SessionUser} from '../session';
import {tenantCan,ownRecordOnly} from '@/lib/permissions';
export async function financialSummary(c:PoolClient,s:SessionUser,customerId:string|null){
 const values=[s.organizationId,customerId];
 const invoices=tenantCan(s.role,'invoices:read')?(await c.query(`select currency,
 count(*) filter(where status not in ('draft','cancelled') and total_amount>paid_amount)::int open_count,
 count(*) filter(where status not in ('draft','cancelled') and total_amount>paid_amount and due_date<(now() at time zone 'Europe/Zurich')::date)::int overdue_count,
 count(*) filter(where status='draft')::int draft_count,
 coalesce(sum(greatest(0,total_amount-paid_amount)) filter(where status not in ('draft','cancelled')),0) open_amount,
 coalesce(sum(total_amount) filter(where status not in ('draft','cancelled') and extract(year from issue_date)=extract(year from (now() at time zone 'Europe/Zurich')::date)),0) revenue
 from invoices where organization_id=$1 and archived_at is null and ($2::uuid is null or customer_id=$2) group by currency`,values)).rows:[];
 const offers=tenantCan(s.role,'sales:read')?(await c.query(`select count(*) filter(where status='draft')::int draft_count,count(*) filter(where status in ('draft','accepted') or status='sent' and valid_until>=(now() at time zone 'Europe/Zurich')::date)::int actionable_count from quotes where organization_id=$1 and archived_at is null and ($2::uuid is null or customer_id=$2)`,values)).rows[0]:null;
 const time=tenantCan(s.role,'time:read')?(await c.query(`select coalesce(sum(hours),0) hours,coalesce(sum(hours) filter(where billable and approved and invoiced_invoice_id is null),0) ready_hours,coalesce(sum(hours) filter(where invoiced_invoice_id is not null),0) invoiced_hours from time_entries where organization_id=$1 and archived_at is null and ($2::uuid is null or customer_id=$2) and ($3::boolean=false or created_by_user_id=$4)`,[...values,ownRecordOnly(s.role,'zeiterfassung'),s.userId])).rows[0]:null;
 return {invoices,offers,time};
}
