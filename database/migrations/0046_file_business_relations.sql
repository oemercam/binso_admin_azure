-- Add optional associations; preserve every existing file and business record.
alter table file_objects add column if not exists customer_id uuid;
alter table file_objects add column if not exists invoice_id uuid;
alter table file_objects add column if not exists quote_id uuid;
alter table file_objects add column if not exists project_id uuid;
alter table file_objects add constraint file_customer_tenant_fk foreign key(organization_id,customer_id) references customers(organization_id,id);
alter table file_objects add constraint file_invoice_tenant_fk foreign key(organization_id,invoice_id) references invoices(organization_id,id);
alter table file_objects add constraint file_quote_tenant_fk foreign key(organization_id,quote_id) references quotes(organization_id,id);
alter table file_objects add constraint file_project_tenant_fk foreign key(organization_id,project_id) references projects(organization_id,id);
create index file_customer_lookup on file_objects(organization_id,customer_id) where customer_id is not null;
create index file_invoice_lookup on file_objects(organization_id,invoice_id) where invoice_id is not null;
create index file_quote_lookup on file_objects(organization_id,quote_id) where quote_id is not null;
create index file_project_lookup on file_objects(organization_id,project_id) where project_id is not null;
