import { cookies } from "next/headers";
import { ApiError, apiError, json } from "@/lib/server/http";
import { withTenant } from "@/lib/server/db";
export async function GET(){
  try{
    if((await cookies()).get('binso_demo')?.value!=='1')throw new ApiError(401,'demo_required','Demo starten.');
    const id='00000000-0000-4000-8000-000000000099';
    const data=await withTenant(id,'demo-readonly',async c=>{
      const organization=await c.query('select id from organizations where id=$1 and is_demo=true',[id]);
      if(!organization.rowCount)throw new ApiError(503,'demo_unavailable','Demo-Daten sind noch nicht verfügbar.');
      const payments=await c.query("select payment_date,amount from payments where organization_id=$1 and archived_at is null and allocation_status='matched'",[id]);
      const expenses=await c.query("select expense_date,quantity*unit_price amount from expenses where organization_id=$1 and archived_at is null and status in ('approved','posted')",[id]);
      const payroll=await c.query("select period,gross_amount from payroll_runs where organization_id=$1 and status in ('approved','paid')",[id]);
      const costs=await c.query("select cost_date,amount,category from operating_costs where organization_id=$1 and scope='tenant'",[id]);
      return {payments:payments.rows,expenses:expenses.rows,payroll:payroll.rows,operatingCosts:costs.rows,demo:true};
    });return json(data);
  }catch(e){return apiError(e)}
}
