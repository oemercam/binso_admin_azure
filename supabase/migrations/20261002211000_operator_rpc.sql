create or replace function public.operator_dashboard_stats()
returns jsonb
language sql
stable
security invoker
set search_path=public
as $$
  select jsonb_build_object(
    'tenants_total',(select count(*) from public.tenants),
    'tenants_active',(select count(*) from public.tenant_accounts where account_status='active'),
    'tenants_restricted',(select count(*) from public.tenant_accounts where account_status in ('restricted','suspended')),
    'tickets_open',(select count(*) from public.support_tickets where status in ('new','open','in_progress','waiting_customer')),
    'tickets_in_progress',(select count(*) from public.support_tickets where status='in_progress'),
    'subscriptions_active',(select count(*) from public.tenant_accounts where subscription_status='active'),
    'subscriptions_past_due',(select count(*) from public.tenant_accounts where subscription_status='past_due'),
    'restrictions_active',(select count(*) from public.tenant_restrictions where active=true),
    'payments_30d_total',(select coalesce(sum(amount),0) from public.payments where status='booked' and paid_on>=current_date-30),
    'documents_30d_total',(select coalesce(sum(total),0) from public.documents where kind='invoice' and issue_date>=current_date-30)
  );
$$;

grant execute on function public.operator_dashboard_stats() to authenticated;

create or replace function public.operator_customer_overview(p_tenant_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path=public
as $$
  select jsonb_build_object(
    'tenant',(select to_jsonb(t) from (
      select id,name,uid,street,postal_code,city,email,phone,created_at
      from public.tenants where id=p_tenant_id
    ) t),
    'account',(select to_jsonb(a) from (
      select plan,subscription_status,account_status,trial_ends_at,current_period_ends_at,user_limit,updated_at
      from public.tenant_accounts where tenant_id=p_tenant_id
    ) a),
    'users',(select count(*) from public.tenant_memberships where tenant_id=p_tenant_id),
    'customers',(select count(*) from public.customers where tenant_id=p_tenant_id),
    'open_tickets',(select count(*) from public.support_tickets where tenant_id=p_tenant_id and status in ('new','open','in_progress','waiting_customer')),
    'invoices_total',(select coalesce(sum(total),0) from public.documents where tenant_id=p_tenant_id and kind='invoice'),
    'payments_total',(select coalesce(sum(amount),0) from public.payments where tenant_id=p_tenant_id and status='booked'),
    'active_restrictions',(select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at desc),'[]'::jsonb) from (
      select id,scope,reason,note,starts_at,ends_at,active,created_at
      from public.tenant_restrictions where tenant_id=p_tenant_id and active=true
    ) r)
  );
$$;

grant execute on function public.operator_customer_overview(uuid) to authenticated;
