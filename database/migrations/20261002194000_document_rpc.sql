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
  subtotal_value numeric(14,2):=0;
  vat_value numeric(14,2):=0;
  total_value numeric(14,2):=0;
  position_value int:=0;
  quantity_value numeric(14,3);
  unit_price_value numeric(14,2);
begin
  if not public.is_tenant_member(p_tenant_id) then
    raise exception 'tenant access denied';
  end if;

  if p_kind not in ('offer','invoice') then
    raise exception 'invalid document kind';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items)=0 then
    raise exception 'document requires at least one item';
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
    p_tenant_id,p_customer_id,p_kind,trim(p_number),'draft',p_issue_date,p_due_date,p_valid_until,
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

grant execute on function public.create_document_atomic(uuid,uuid,public.document_kind,text,date,date,date,numeric,text,char,jsonb) to authenticated;
