-- Persist fields used by the current product forms in their canonical business tables.
alter table products_services add column if not exists sku text;
alter table products_services add column if not exists description text;
alter table expenses add column if not exists merchant text;
alter table expenses add column if not exists currency text not null default 'CHF' check(currency in ('CHF','EUR'));
alter table expenses add column if not exists vat_rate numeric(5,2) not null default 8.1 check(vat_rate between 0 and 100);
alter table quotes add column if not exists note text;
alter table quotes add column if not exists currency text not null default 'CHF' check(currency in ('CHF','EUR'));
alter table invoices add column if not exists note text;
alter table invoices add column if not exists currency text not null default 'CHF' check(currency in ('CHF','EUR'));

-- Enforce tenant ownership on the relationships added by 0017.
do $$
declare r record;
begin
 for r in select * from (values
 ('projects','customer_id','customers'),('projects','manager_employee_id','employees'),
 ('quotes','project_id','projects'),('invoices','project_id','projects'),('orders','project_id','projects'),
 ('time_entries','project_id','projects'),('time_entries','product_service_id','products_services'),
 ('expenses','employee_id','employees'),('expenses','project_id','projects'),('payments','payer_customer_id','customers'),
 ('tasks','customer_id','customers'),('tasks','project_id','projects'),('tasks','invoice_id','invoices'),('tasks','assignee_employee_id','employees'),
 ('absences','employee_id','employees'),('payroll_runs','employee_id','employees'),
 ('business_documents','customer_id','customers'),('business_documents','project_id','projects'),
 ('business_documents','employee_id','employees'),('business_documents','supplier_id','suppliers'),('contracts','supplier_id','suppliers')
 ) as relationships(child,column_name,parent)
 loop
  execute format('create unique index if not exists %I on %I(organization_id,id)','uq_'||r.parent||'_tenant_id',r.parent);
  execute format('alter table %I add constraint %I foreign key(organization_id,%I) references %I(organization_id,id) not valid',r.child,'fk_'||r.child||'_'||r.column_name||'_tenant',r.column_name,r.parent);
  execute format('create index if not exists %I on %I(organization_id,%I)','idx_'||r.child||'_'||r.column_name||'_tenant',r.child,r.column_name);
 end loop;
end $$;
