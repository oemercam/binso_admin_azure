-- Automatic tenant-safe document numbering.
-- Numbers are reserved transactionally to avoid duplicate invoice/offer numbers under concurrency.

create table if not exists public.document_counters (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  kind public.document_kind not null,
  year int not null check (year between 2000 and 9999),
  next_number int not null check (next_number > 0),
  updated_at timestamptz not null default now(),
  primary key (tenant_id,kind,year)
);

alter table public.document_counters enable row level security;

drop policy if exists document_counters_member_select on public.document_counters;
create policy document_counters_member_select on public.document_counters
for select using(public.tenant_can_read(tenant_id));

drop policy if exists document_counters_member_insert on public.document_counters;
create policy document_counters_member_insert on public.document_counters
for insert with check(public.tenant_can_write(tenant_id));

drop policy if exists document_counters_member_update on public.document_counters;
create policy document_counters_member_update on public.document_counters
for update using(public.tenant_can_write(tenant_id)) with check(public.tenant_can_write(tenant_id));

drop policy if exists document_counters_operator_select on public.document_counters;
create policy document_counters_operator_select on public.document_counters
for select using(public.is_operator());

create or replace function public.reserve_document_number(
  p_tenant_id uuid,
  p_kind public.document_kind,
  p_year int default extract(year from current_date)::int
)
returns text
language plpgsql
security invoker
set search_path=public
as $$
declare
  current_value int;
  max_existing int;
  prefix text;
begin
  if not public.tenant_can_write(p_tenant_id) then
    raise exception 'tenant write access denied';
  end if;

  if p_year < 2000 or p_year > 9999 then
    raise exception 'invalid year';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text || ':' || p_kind::text || ':' || p_year::text,0));

  select next_number into current_value
  from public.document_counters
  where tenant_id=p_tenant_id and kind=p_kind and year=p_year
  for update;

  if current_value is null then
    select coalesce(max(
      case
        when number ~ ('^(RE|AN)-' || p_year::text || '-[0-9]+$')
        then substring(number from '([0-9]+)$')::int
        else null
      end
    ),0)
    into max_existing
    from public.documents
    where tenant_id=p_tenant_id and kind=p_kind;

    current_value=max_existing+1;

    insert into public.document_counters(tenant_id,kind,year,next_number)
    values(p_tenant_id,p_kind,p_year,current_value+1);
  else
    update public.document_counters
    set next_number=current_value+1,updated_at=now()
    where tenant_id=p_tenant_id and kind=p_kind and year=p_year;
  end if;

  prefix=case when p_kind='invoice' then 'RE' else 'AN' end;
  return prefix || '-' || p_year::text || '-' || lpad(current_value::text,3,'0');
end $$;

grant execute on function public.reserve_document_number(uuid,public.document_kind,int) to authenticated;

create or replace function public.create_document_atomic(
  p_tenant_id uuid,
  p_customer_id uuid,
  p_kind public.document_kind,
  p_number text,
  p_issue_date date,
  p_due_date date,
  p_valid_until date,
  p_vat_rate numeric,
  p_note text,
  p_currency char(3),
  p_items jsonb
)
returns public.documents
language plpgsql
security invoker
set search_path=public
as $$
declare
  doc public.documents;
  item jsonb;
  resolved_number text;
  subtotal_value numeric(14,2):=0;
  vat_value numeric(14,2):=0;
  total_value numeric(14,2):=0;
  position_value int:=0;
  quantity_value numeric(14,3);
  unit_price_value numeric(14,2);
begin
  if not public.tenant_can_write(p_tenant_id) then
    raise exception 'tenant write access denied';
  end if;

  if p_kind not in ('offer','invoice') then
    raise exception 'invalid document kind';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items)=0 then
    raise exception 'document requires at least one item';
  end if;

  resolved_number=nullif(trim(coalesce(p_number,'')),'');
  if resolved_number is null then
    resolved_number=public.reserve_document_number(
      p_tenant_id,
      p_kind,
      extract(year from coalesce(p_issue_date,current_date))::int
    );
  end if;

  for item in select value from jsonb_array_elements(p_items)
  loop
    quantity_value:=coalesce((item->>'quantity')::numeric,0);
    unit_price_value:=coalesce((item->>'unit_price')::numeric,0);
    if quantity_value < 0 or unit_price_value < 0 then
      raise exception 'negative values are not allowed';
    end if;
    subtotal_value:=subtotal_value + round(quantity_value*unit_price_value,2);
  end loop;

  vat_value:=round(subtotal_value * coalesce(p_vat_rate,0) / 100,2);
  total_value:=subtotal_value + vat_value;

  insert into public.documents(
    tenant_id,customer_id,kind,number,status,issue_date,due_date,valid_until,vat_rate,note,currency,
    subtotal,vat_amount,total,created_by
  ) values(
    p_tenant_id,p_customer_id,p_kind,resolved_number,'draft',p_issue_date,p_due_date,p_valid_until,
    coalesce(p_vat_rate,0),nullif(trim(coalesce(p_note,'')),''),coalesce(p_currency,'CHF'),
    subtotal_value,vat_value,total_value,auth.uid()
  ) returning * into doc;

  for item in select value from jsonb_array_elements(p_items)
  loop
    position_value:=position_value+1;
    insert into public.document_items(
      tenant_id,document_id,position,description,quantity,unit_price
    ) values(
      p_tenant_id,doc.id,position_value,
      trim(coalesce(item->>'description','')),
      coalesce((item->>'quantity')::numeric,0),
      coalesce((item->>'unit_price')::numeric,0)
    );
  end loop;

  insert into public.audit_log(tenant_id,user_id,action,entity_type,entity_id,metadata)
  values(p_tenant_id,auth.uid(),'document.created','document',doc.id::text,jsonb_build_object('kind',doc.kind,'number',doc.number,'total',doc.total));

  return doc;
end $$;
