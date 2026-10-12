import 'server-only';
import type {PoolClient} from 'pg';
import type {OperatorSession} from '../operator/session';
import {operatorCan} from '@/lib/permissions';
/** Permission-aware overview. Missing permission is null, never a successful zero. */
export async function operatorCustomerReadings(c:PoolClient,s:OperatorSession,organizationId:string){
 const access={billing:operatorCan(s.role,'subscriptions:read'),support:operatorCan(s.role,'support:manage'),restrictions:operatorCan(s.role,'restrictions:manage'),audit:operatorCan(s.role,'platform_audit:read')};
 const users=(await c.query("select count(*)::int n from organization_memberships where organization_id=$1 and status='active'",[organizationId])).rows[0].n;
 const openTickets=access.support?(await c.query("select count(*)::int n from support_cases where organization_id=$1 and status not in ('resolved','closed')",[organizationId])).rows[0].n:null;
 const payments=access.billing?(await c.query("select coalesce(sum(amount),0)::numeric amount from platform_billing_payments where organization_id=$1 and provider<>'demo' and currency='CHF' and payment_date<=current_date",[organizationId])).rows[0].amount:null;
 const monthly=access.billing?(await c.query("select case when status='active' then unit_amount_chf/case when billing_interval='yearly' then 12 else 1 end else 0 end amount from organization_subscriptions where organization_id=$1",[organizationId])).rows[0]?.amount??null:null;
 const restrictions=access.restrictions?(await c.query("select scope,reason,starts_at,ends_at from organization_restrictions where organization_id=$1 and active and starts_at<=now() and (ends_at is null or ends_at>now()) order by starts_at desc",[organizationId])).rows:null;
 return {users,open_tickets:openTickets,payments_total:payments,monthly_contract_value:monthly,active_restrictions:restrictions,access};
}
