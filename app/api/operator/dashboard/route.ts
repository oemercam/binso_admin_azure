import {operatorCan} from '@/lib/permissions';
import { requireOperatorSession } from '@/lib/server/operator/session';
import { authorizeOperator } from '@/lib/server/operator/rbac';
import { withPlatform } from '@/lib/server/db';
import { apiError,json } from '@/lib/server/http';
export async function GET(){
 try{const s=await requireOperatorSession();authorizeOperator(s,'platform:read');
 const support=operatorCan(s.role,'support:manage'),billingAccess=operatorCan(s.role,'subscriptions:read');
 const result=await withPlatform(async c=>{
  const stats=support?await c.query(`select count(*) filter(where t.status='open')::int tickets_open,count(*) filter(where t.status='in_progress')::int tickets_in_progress,count(*) filter(where t.status='resolved')::int tickets_resolved from support_cases t join organizations o on o.id=t.organization_id where not o.is_demo`):{rows:[{tickets_open:null,tickets_in_progress:null,tickets_resolved:null}]};
  const users=await c.query("select count(distinct a.user_id)::int users_active from auth_sessions a join organizations o on o.id=a.organization_id where not o.is_demo and a.expires_at>now() and a.last_seen_at>now()-interval '15 minutes'");
  const business=await c.query(`select
    count(*) filter(where not o.is_demo)::int customers_total,
    count(*) filter(where not o.is_demo and s.status='trial')::int trials_active,
    count(*) filter(where not o.is_demo and s.status='active')::int subscriptions_active,
    coalesce(sum(case when not o.is_demo and s.status='active' then s.unit_amount_chf / case when s.billing_interval='yearly' then 12 else 1 end else 0 end),0)::numeric monthly_contract_value
    from organizations o left join organization_subscriptions s on s.organization_id=o.id`);
  const billing=await c.query(`select coalesce(sum(p.amount),0)::numeric payments_30d from platform_billing_payments p join organizations o on o.id=p.organization_id where not o.is_demo and p.provider<>'demo' and p.currency='CHF' and p.payment_date>=current_date-29 and p.payment_date<=current_date`);
  const tickets=await c.query("select t.id,t.subject,t.status,json_build_object('name',o.name) tenant from support_cases t join organizations o on o.id=t.organization_id where not o.is_demo order by t.updated_at desc limit 6");
  const incidents=await c.query("select id,title,status,started_at,'Plattform' service from platform_incidents where status<>'resolved' order by started_at desc limit 5");
  return {stats:{...stats.rows[0],...users.rows[0],...business.rows[0],...billing.rows[0],subscriptions_active:billingAccess?business.rows[0].subscriptions_active:null,trials_active:billingAccess?business.rows[0].trials_active:null,monthly_contract_value:billingAccess?business.rows[0].monthly_contract_value:null,payments_30d:billingAccess?billing.rows[0].payments_30d:null},tickets:support?tickets.rows:[],incidents:incidents.rows};
 });return json(result)}catch(e){return apiError(e)}
}
