import { apiError, json } from "@/lib/server/http";
import { requireOperatorSession } from "@/lib/server/operator/session";
import { authorizeOperator } from "@/lib/server/operator/rbac";
import { withPlatform } from "@/lib/server/db";

export async function GET(){
  try{
    const s=await requireOperatorSession();authorizeOperator(s,"subscriptions:read");
    const data=await withPlatform(async c=>{
      const [payments,subscriptions,costs]=await Promise.all([
        c.query("select p.payment_date,sum(p.amount) amount from platform_billing_payments p join organizations o on o.id=p.organization_id where not o.is_demo and p.provider<>'demo' and p.currency='CHF' group by p.payment_date order by p.payment_date desc"),
        c.query("select p.payment_date created_at,sum(p.amount) monthly_revenue_chf from platform_billing_payments p join organizations o on o.id=p.organization_id where not o.is_demo and p.provider<>'demo' and p.currency='CHF' group by p.payment_date order by p.payment_date desc"),
        c.query("select cost_date,category,provider,description,amount from operating_costs where scope='platform' and not is_demo and currency='CHF' order by cost_date desc")
      ]);
      return {payments:payments.rows,subscriptions:subscriptions.rows,operatingCosts:costs.rows};
    });
    return json(data);
  }catch(error){return apiError(error);}
}
