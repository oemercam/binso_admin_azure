import { apiError, json } from "@/lib/server/http";
import { requireOperatorSession } from "@/lib/server/operator/session";
import { authorizeOperator } from "@/lib/server/operator/rbac";
import { withPlatform } from "@/lib/server/db";

export async function GET(){
  try{
    const s=await requireOperatorSession();authorizeOperator(s,"platform:read");
    const data=await withPlatform(async c=>{
      const [payments,subscriptions,costs]=await Promise.all([
        c.query("select p.payment_date,p.amount from payments p order by p.payment_date desc limit 2000"),
        c.query("select monthly_revenue_chf,platform_status,created_at from platform_tenants order by created_at desc limit 1000"),
        c.query("select cost_date,category,provider,description,amount from operating_costs where scope='platform' order by cost_date desc limit 1000")
      ]);
      return {payments:payments.rows,subscriptions:subscriptions.rows,operatingCosts:costs.rows};
    });
    return json(data);
  }catch(error){return apiError(error);}
}
