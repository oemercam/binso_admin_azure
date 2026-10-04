import { apiError, json } from "@/lib/server/http";
import { authorize } from "@/lib/server/rbac";
import { requireSession } from "@/lib/server/session";
import { withTenant } from "@/lib/server/db";

export async function GET(){
  try{
    const s=await requireSession();authorize(s,"accounting:read");
    const data=await withTenant(s.organizationId,s.userId,async c=>{
      const [payments,invoices,expenses,payroll,operating]=await Promise.all([
        c.query("select p.payment_date,sum(p.amount) amount from payments p join invoices i on i.id=p.invoice_id and i.organization_id=p.organization_id where p.organization_id=$1 and p.archived_at is null and p.allocation_status='matched' and i.currency='CHF' group by p.payment_date order by p.payment_date desc",[s.organizationId]),
        c.query("select issue_date,sum(total_amount) total_amount,status from invoices where organization_id=$1 and archived_at is null group by issue_date,status order by issue_date desc",[s.organizationId]),
        c.query("select expense_date,sum(quantity*unit_price)::numeric(14,2) amount,category,status from expenses where organization_id=$1 and archived_at is null and currency='CHF' and status in ('approved','posted') group by expense_date,category,status order by expense_date desc",[s.organizationId]),
        c.query("select period,sum(gross_amount) gross_amount,sum(deduction_amount) deduction_amount,sum(net_amount) net_amount,status from payroll_runs where organization_id=$1 and status in ('approved','paid') group by period,status order by period desc",[s.organizationId]),
        c.query("select cost_date,category,sum(amount) amount from operating_costs where organization_id=$1 and scope='tenant' and currency='CHF' group by cost_date,category order by cost_date desc",[s.organizationId])
      ]);
      return {payments:payments.rows,invoices:invoices.rows,expenses:expenses.rows,payroll:payroll.rows,operatingCosts:operating.rows};
    });
    return json(data);
  }catch(error){return apiError(error);}
}
