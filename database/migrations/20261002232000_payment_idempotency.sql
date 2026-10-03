-- Idempotent financial write protection for payment creation.
-- Concurrent retries return the same payment. Reusing a key with different payment data is rejected.

alter table public.payments
  add column if not exists idempotency_key text;

create unique index if not exists uq_payments_tenant_idempotency
  on public.payments(tenant_id,idempotency_key);

create or replace function public.create_payment_idempotent(
  p_tenant_id uuid,
  p_invoice_id uuid,
  p_customer_id uuid,
  p_paid_on date,
  p_amount numeric,
  p_method text,
  p_note text,
  p_idempotency_key text
)
returns public.payments
language plpgsql
security invoker
set search_path=public
as $$
declare
  payment public.payments;
  normalized_method text;
  normalized_note text;
  normalized_date date;
begin
  if not public.tenant_can_write(p_tenant_id) then raise exception 'tenant write denied'; end if;
  if p_amount is null or p_amount<=0 then raise exception 'invalid amount'; end if;
  if p_idempotency_key is null or char_length(trim(p_idempotency_key))<8 or char_length(p_idempotency_key)>128 then
    raise exception 'invalid idempotency key';
  end if;

  normalized_method:=coalesce(nullif(trim(p_method),''),'bank');
  normalized_note:=nullif(trim(coalesce(p_note,'')),'');
  normalized_date:=coalesce(p_paid_on,current_date);

  insert into public.payments(
    tenant_id,invoice_id,customer_id,paid_on,amount,method,note,status,idempotency_key
  ) values(
    p_tenant_id,p_invoice_id,p_customer_id,normalized_date,p_amount,
    normalized_method,normalized_note,'booked',trim(p_idempotency_key)
  )
  on conflict(tenant_id,idempotency_key) do nothing
  returning * into payment;

  if payment.id is not null then return payment; end if;

  select * into payment
  from public.payments
  where tenant_id=p_tenant_id and idempotency_key=trim(p_idempotency_key)
  limit 1;

  if payment.id is null then raise exception 'idempotency conflict without existing payment'; end if;

  if payment.invoice_id is distinct from p_invoice_id
     or payment.customer_id is distinct from p_customer_id
     or payment.paid_on is distinct from normalized_date
     or payment.amount is distinct from p_amount
     or payment.method is distinct from normalized_method
     or payment.note is distinct from normalized_note then
    raise exception 'idempotency key reused with different payload';
  end if;

  return payment;
end $$;

revoke all on function public.create_payment_idempotent(uuid,uuid,uuid,date,numeric,text,text,text) from public;
grant execute on function public.create_payment_idempotent(uuid,uuid,uuid,date,numeric,text,text,text) to authenticated;
