-- Existing supplier owner; only existing bank-capable tenant roles may change it.
create function protect_supplier_bank() returns trigger language plpgsql
set search_path=pg_catalog,public as $$
begin
 if (tg_op='INSERT' and new.iban is not null) or (tg_op='UPDATE' and new.iban is distinct from old.iban) then
  if app_workforce_role() not in ('owner','admin','finance','demo_template') and not exists(select 1 from pg_roles where rolname=current_user and (rolsuper or rolbypassrls)) then
   raise exception 'Bank-capable active membership required' using errcode='42501';
  end if;
 end if;
 return new;
end $$;
create trigger supplier_bank_guard before insert or update of iban on suppliers
 for each row execute function protect_supplier_bank();
