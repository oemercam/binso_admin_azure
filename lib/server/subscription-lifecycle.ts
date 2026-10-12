import "server-only";
import {query,withTenant} from "@/lib/server/db";

export async function expireUnpaidTrials(organizationId?:string,userId?:string){
  const sql=`
    with expired as (
      update organization_subscriptions s
         set status='expired', updated_at=now()
        from organizations o
       where o.id=s.organization_id
         and o.is_demo=false
         and ($1::uuid is null or o.id=$1)
         and s.status='trial'
         and s.trial_until is not null
         and s.trial_until<=now()
         and s.billing_subscription_id is null
      returning s.organization_id
    ),
    orgs as (
      update organizations o
         set status='read_only', updated_at=now()
       where o.id in (select organization_id from expired)
         and o.status not in ('suspended','archived')
      returning o.id
    )
    , platform as (update platform_tenants p
       set platform_status='read_only', monthly_revenue_chf=0
     where p.organization_id in (select organization_id from expired)
    returning p.organization_id)
    select organization_id from expired
  `;
  if(organizationId&&userId)return withTenant(organizationId,userId,client=>client.query(sql,[organizationId]));
  return query(sql,[organizationId??null]);
}
