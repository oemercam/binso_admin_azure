-- Cross-tenant integrity hardening.
-- RLS protects row visibility, while composite foreign keys prevent references across tenants even when UUIDs are guessed.

create unique index if not exists uq_customers_tenant_id on public.customers(tenant_id,id);
create unique index if not exists uq_employees_tenant_id on public.employees(tenant_id,id);
create unique index if not exists uq_documents_tenant_id on public.documents(tenant_id,id);
create unique index if not exists uq_support_tickets_tenant_id on public.support_tickets(tenant_id,id);

do $$ begin
  if not exists(select 1 from pg_constraint where conname='documents_customer_tenant_fk') then
    alter table public.documents
      add constraint documents_customer_tenant_fk
      foreign key(tenant_id,customer_id) references public.customers(tenant_id,id) on delete restrict;
  end if;

  if not exists(select 1 from pg_constraint where conname='document_items_document_tenant_fk') then
    alter table public.document_items
      add constraint document_items_document_tenant_fk
      foreign key(tenant_id,document_id) references public.documents(tenant_id,id) on delete cascade;
  end if;

  if not exists(select 1 from pg_constraint where conname='payments_invoice_tenant_fk') then
    alter table public.payments
      add constraint payments_invoice_tenant_fk
      foreign key(tenant_id,invoice_id) references public.documents(tenant_id,id) on delete restrict;
  end if;

  if not exists(select 1 from pg_constraint where conname='payments_customer_tenant_fk') then
    alter table public.payments
      add constraint payments_customer_tenant_fk
      foreign key(tenant_id,customer_id) references public.customers(tenant_id,id) on delete restrict;
  end if;

  if not exists(select 1 from pg_constraint where conname='expenses_employee_tenant_fk') then
    alter table public.expenses
      add constraint expenses_employee_tenant_fk
      foreign key(tenant_id,employee_id) references public.employees(tenant_id,id) on delete set null (employee_id);
  end if;

  if not exists(select 1 from pg_constraint where conname='time_entries_customer_tenant_fk') then
    alter table public.time_entries
      add constraint time_entries_customer_tenant_fk
      foreign key(tenant_id,customer_id) references public.customers(tenant_id,id) on delete set null (customer_id);
  end if;

  if not exists(select 1 from pg_constraint where conname='support_messages_ticket_tenant_fk') then
    alter table public.support_messages
      add constraint support_messages_ticket_tenant_fk
      foreign key(tenant_id,ticket_id) references public.support_tickets(tenant_id,id) on delete cascade;
  end if;

  if not exists(select 1 from pg_constraint where conname='customer_contacts_customer_tenant_fk') then
    alter table public.customer_contacts
      add constraint customer_contacts_customer_tenant_fk
      foreign key(tenant_id,customer_id) references public.customers(tenant_id,id) on delete cascade;
  end if;
end $$;
