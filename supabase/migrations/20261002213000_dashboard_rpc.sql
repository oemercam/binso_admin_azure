create or replace function public.tenant_dashboard_stats(p_tenant_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path=public
as $$
  select jsonb_build_object(
    'customers_total',(select count(*) from public.customers where tenant_id=p_tenant_id and status='active'),
    'invoice_open_total',(select coalesce(sum(total),0) from public.documents where tenant_id=p_tenant_id and kind='invoice' and status in ('draft','open','sent','overdue')),
    'invoice_open_count',(select count(*) from public.documents where tenant_id=p_tenant_id and kind='invoice' and status in ('draft','open','sent','overdue')),
    'invoice_overdue_total',(select coalesce(sum(total),0) from public.documents where tenant_id=p_tenant_id and kind='invoice' and status='overdue'),
    'payments_month_total',(select coalesce(sum(amount),0) from public.payments where tenant_id=p_tenant_id and status='booked' and date_trunc('month',paid_on::timestamp)=date_trunc('month',now())),
    'time_week_minutes',(select coalesce(sum(duration_minutes),0) from public.time_entries where tenant_id=p_tenant_id and created_at>=date_trunc('week',now())),
    'expenses_month_total',(select coalesce(sum(amount),0) from public.expenses where tenant_id=p_tenant_id and status in ('submitted','approved') and date_trunc('month',expense_date::timestamp)=date_trunc('month',now()))
  );
$$;

grant execute on function public.tenant_dashboard_stats(uuid) to authenticated;
