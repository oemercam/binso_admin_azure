-- Existing AP aggregate, additive draft state; do not infer historical currency.
alter table supplier_invoices add column currency text check(currency in ('CHF','EUR'));
alter table supplier_invoices drop constraint supplier_invoices_status_check;
alter table supplier_invoices add constraint supplier_invoices_status_check check(status in ('draft','open','review','paid'));
alter table supplier_invoices alter column supplier_invoice_no drop not null;
alter table supplier_invoices alter column invoice_date drop not null;
alter table supplier_invoices alter column due_date drop not null;
alter table supplier_invoices alter column net_amount drop not null;
alter table supplier_invoices alter column vat_amount drop not null;
alter table supplier_invoices alter column vat_amount drop default;
alter table supplier_invoices alter column total_amount drop not null;
alter table supplier_invoices add constraint supplier_invoice_nondraft_complete check(status='draft' or
 (supplier_invoice_no is not null and invoice_date is not null and due_date is not null and net_amount is not null and vat_amount is not null and total_amount is not null));
alter table supplier_invoices add constraint supplier_invoice_draft_amounts check(status<>'draft' or
 ((net_amount is null or net_amount>=0) and (vat_amount is null or vat_amount>=0) and (total_amount is null or total_amount>=0)
 and (net_amount is null or vat_amount is null or total_amount is null or net_amount+vat_amount=total_amount)
 and (invoice_date is null or due_date is null or due_date>=invoice_date)));
create policy supplier_invoice_draft_read on supplier_invoices as restrictive for select using(
 status<>'draft' or app_workforce_role() in ('owner','admin','finance','demo_template'));

create function protect_supplier_invoice_draft() returns trigger language plpgsql
set search_path=pg_catalog,public as $$
declare reference_key text;
begin
 if new.status='draft' or (tg_op='UPDATE' and old.status='draft') then
  if app_workforce_role() not in ('owner','admin','finance','demo_template') and not exists(select 1 from pg_roles where rolname=current_user and (rolsuper or rolbypassrls)) then
   raise exception 'Purchasing membership required' using errcode='42501';
  end if;
  if tg_op='UPDATE' and (new.status is distinct from old.status or new.supplier_id is distinct from old.supplier_id
   or new.organization_id is distinct from old.organization_id or new.created_by_user_id is distinct from old.created_by_user_id) then
   raise exception 'Draft identity is immutable; AP review is not enabled here' using errcode='23514';
  end if;
  reference_key=nullif(upper(btrim(new.supplier_invoice_no)),'');
  if reference_key is not null then
   perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text||':ap-reference:'||new.supplier_id::text||':'||reference_key,0));
   if exists(select 1 from supplier_invoices i where i.organization_id=new.organization_id and i.supplier_id=new.supplier_id and i.id<>new.id and i.archived_at is null and upper(btrim(i.supplier_invoice_no))=reference_key) then
    raise exception 'Supplier invoice reference already exists' using errcode='23505';
   end if;
  end if;
 end if;
 return new;
end $$;
create trigger supplier_invoice_draft_guard before insert or update on supplier_invoices
 for each row execute function protect_supplier_invoice_draft();
