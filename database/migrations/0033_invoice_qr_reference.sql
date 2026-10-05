-- Persist a stable numeric Swiss QR reference for every invoice, independent of its display number.
create or replace function invoice_qr_reference(document_id uuid) returns text
language plpgsql immutable strict parallel safe as $$
declare
  bytes bytea := decode(replace(document_id::text,'-',''),'hex');
  number_value numeric := 0;
  digits text;
  carry integer := 0;
  lookup integer[] := array[0,9,4,6,8,2,7,1,3,5];
  i integer;
begin
  for i in 0..15 loop
    number_value := number_value * 256 + get_byte(bytes,i);
  end loop;
  digits := lpad(mod(number_value,100000000000000000000000000)::text,26,'0');
  for i in 1..26 loop
    carry := lookup[mod(carry + substring(digits from i for 1)::integer,10)+1];
  end loop;
  return digits || mod(10-carry,10)::text;
end;
$$;
alter table invoices add column if not exists qr_reference text generated always as (invoice_qr_reference(id)) stored;
alter table invoices add constraint invoices_qr_reference_format check (qr_reference ~ '^[0-9]{27}$');
create unique index if not exists invoices_tenant_qr_reference_unique on invoices(organization_id,qr_reference);
