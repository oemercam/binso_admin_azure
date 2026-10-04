import { cookies } from "next/headers";
import { ApiError, apiError, json } from "@/lib/server/http";
import { withPlatform } from "@/lib/server/db";
export async function GET(){
  try{
    if((await cookies()).get('binso_operator_demo')?.value!=='1')throw new ApiError(401,'demo_required','Admin-Demo starten.');
    const data=await withPlatform(async c=>{
      const payments=await c.query("select p.payment_date,p.amount from platform_billing_payments p join organizations o on o.id=p.organization_id where o.id='00000000-0000-4000-8000-000000000099' and o.is_demo and p.provider='demo'");
      const costs=await c.query("select cost_date,amount,category from operating_costs where scope='platform' and is_demo=true");
      return {payments:payments.rows,subscriptions:payments.rows.map(x=>({created_at:x.payment_date,monthly_revenue_chf:x.amount})),operatingCosts:costs.rows,demo:true};
    });return json(data);
  }catch(e){return apiError(e)}
}
