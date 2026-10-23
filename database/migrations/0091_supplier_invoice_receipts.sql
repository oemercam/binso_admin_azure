alter table file_objects add column supplier_invoice_id uuid;
alter table file_objects add constraint file_supplier_invoice_tenant_fk foreign key(organization_id,supplier_invoice_id) references supplier_invoices(organization_id,id);
alter table file_objects add constraint file_supplier_invoice_owner check(
 (purpose='supplier_invoice_receipt')=(supplier_invoice_id is not null)
 and (supplier_invoice_id is null or num_nonnulls(expense_id,support_case_id,employee_id,customer_id,invoice_id,quote_id,project_id,time_entry_id)=0));
create index file_supplier_invoice_lookup on file_objects(organization_id,supplier_invoice_id) where supplier_invoice_id is not null;
create policy file_supplier_invoice_read on file_objects as restrictive for select using(
 purpose<>'supplier_invoice_receipt' or app_workforce_role() in ('owner','admin','finance','demo_template'));
create function protect_supplier_invoice_receipt() returns trigger language plpgsql
set search_path=pg_catalog,public as $$
declare state text;
begin
 if tg_op='UPDATE' and (old.purpose='supplier_invoice_receipt' or new.purpose='supplier_invoice_receipt') and
  (new.purpose is distinct from old.purpose or new.supplier_invoice_id is distinct from old.supplier_invoice_id or new.organization_id is distinct from old.organization_id
   or new.created_by is distinct from old.created_by or new.id is distinct from old.id) then
  raise exception 'Receipt owner is immutable' using errcode='23514';
 end if;
 if new.purpose='supplier_invoice_receipt' and (tg_op='INSERT' or
  row(new.archived_at,new.original_name,new.content_type,new.size_bytes,new.sha256,new.object_key,new.blob_url)
  is distinct from row(old.archived_at,old.original_name,old.content_type,old.size_bytes,old.sha256,old.object_key,old.blob_url)) then
  if app_workforce_role() not in ('owner','admin','finance','demo_template') or (tg_op='INSERT' and new.created_by is distinct from current_setting('app.user_id',true)) then
   raise exception 'Purchasing membership required' using errcode='42501';
  end if;
  select status into state from supplier_invoices where organization_id=new.organization_id and id=new.supplier_invoice_id and archived_at is null for update;
  if state is distinct from 'draft' then raise exception 'Only draft AP attachments can be changed' using errcode='23514'; end if;
 end if;
 return new;
end $$;
create trigger supplier_invoice_receipt_guard before insert or update on file_objects
 for each row execute function protect_supplier_invoice_receipt();
