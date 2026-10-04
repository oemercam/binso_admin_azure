import { apiError, json } from "@/lib/server/http";
import { requireSession } from "@/lib/server/session";
import { withTenant } from "@/lib/server/db";

export async function GET(){
  try{
    const s=await requireSession();
    const data=await withTenant(s.organizationId,s.userId,async c=>{
      const [payments,invoices,expenses,payroll,operating]=await Promise.all([
        c.query("select payment_date,amount from payments where organization_id=$1 and archived_at is null order by payment_date desc limit 1000",[s.organizationId]),
        c.query("select issue_date,total_amount,status from invoices where organization_id=$1 and archived_at is null order by issue_date desc limit 1000",[s.organizationId]),
        c.query("select expense_date,(quantity*unit_price)::numeric(14,2) amount,category,status from expenses where organization_id=$1 and archived_at is null order by expense_date desc limit 1000",[s.organizationId]),
        c.query("select period,gross_amount,deduction_amount,net_amount,status from payroll_runs where organization_id=$1 order by period desc limit 1000",[s.organizationId]),
        c.query("select cost_date,category,provider,description,amount from operating_costs where organization_id=$1 and scope='tenant' order by cost_date desc limit 1000",[s.organizationId])
      ]);
      return {payments:payments.rows,invoices:invoices.rows,expenses:expenses.rows,payroll:payroll.rows,operatingCosts:operating.rows};
    });
    return json(data);
  }catch(error){return apiError(error);}
}
