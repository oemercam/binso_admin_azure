import { requireSession } from '@/lib/server/session';
import { authorize } from '@/lib/server/rbac';
import { withTenant } from '@/lib/server/db';
import { apiError,json } from '@/lib/server/http';
export async function GET(){
 try{const s=await requireSession();authorize(s,'billing:read');
 const item=await withTenant(s.organizationId,s.userId,async c=>(await c.query(`select s.organization_id tenant_id,case s.plan when 'starter' then 'start' when 'professional' then 'pro' else s.plan end plan,s.status subscription_status,o.status account_status,s.trial_until trial_ends_at,s.current_period_end current_period_ends_at,e.max_users user_limit,e.max_storage_mb*1048576::bigint storage_limit_bytes,s.billing_customer_id billing_customer_ref,s.billing_subscription_id billing_subscription_ref,s.billing_interval,s.unit_amount_chf,s.cancel_at_period_end,s.updated_at from organization_subscriptions s join organizations o on o.id=s.organization_id left join organization_entitlements e on e.organization_id=s.organization_id where s.organization_id=$1`,[s.organizationId])).rows[0]);
 return item?json({item}):json({error:'not_found'},404)}catch(e){return apiError(e)}
}
