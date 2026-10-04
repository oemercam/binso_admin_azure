-- Preserve every editable business field without changing the canonical ledger.
alter table customers add column if not exists sector text;
alter table employees add column if not exists first_name text;
alter table employees add column if not exists last_name text;
update employees set first_name=split_part(name,' ',1),last_name=substring(name from position(' ' in name)+1)
where first_name is null;
alter table expenses add column if not exists category_label text;
alter table expenses drop constraint if exists expenses_status_check;
alter table expenses add constraint expenses_status_check check (status in ('open','draft','submitted','approved','posted','rejected'));
alter table time_entries add column if not exists project_label text;
alter table time_entries add column if not exists customer_id uuid;
alter table time_entries add constraint time_entries_customer_tenant_fk foreign key (organization_id,customer_id) references customers(organization_id,id);
alter table active_time_trackers add column if not exists project_id uuid;
alter table active_time_trackers add constraint active_time_trackers_project_tenant_fk
foreign key (organization_id,project_id) references projects(organization_id,id);
create index if not exists time_entries_employee_date_idx on time_entries(organization_id,employee_id,work_date) where archived_at is null;

create unique index if not exists support_cases_tenant_id_unique on support_cases(organization_id,id);

-- File content remains in private Azure Blob Storage; ownership and relationships are relational.
alter table file_objects add column if not exists expense_id uuid;
alter table file_objects add column if not exists support_case_id uuid;
alter table file_objects add column if not exists employee_id uuid;
alter table file_objects add constraint file_expense_tenant_fk foreign key (organization_id,expense_id) references expenses(organization_id,id);
alter table file_objects add constraint file_support_tenant_fk foreign key (organization_id,support_case_id) references support_cases(organization_id,id);
alter table file_objects add constraint file_employee_tenant_fk foreign key (organization_id,employee_id) references employees(organization_id,id);
alter table file_objects add constraint file_single_business_owner check (num_nonnulls(expense_id,support_case_id,employee_id)<=1);
alter table file_objects force row level security;
create index if not exists file_expense_owner_idx on file_objects(organization_id,expense_id) where expense_id is not null;
create index if not exists file_support_owner_idx on file_objects(organization_id,support_case_id) where support_case_id is not null;
create index if not exists file_employee_owner_idx on file_objects(organization_id,employee_id) where employee_id is not null;
-- Existing numeric customer numbers determine the next tenant-local sequence.
insert into business_document_counters(organization_id,kind,period,next_value)
select organization_id,'customer','',coalesce(max(substring(customer_no from '^K-([0-9]+)$')::bigint),0)+1 from customers group by organization_id
on conflict(organization_id,kind,period) do update set next_value=greatest(business_document_counters.next_value,excluded.next_value);

-- Bounded application attachments are persisted with their metadata in Azure PostgreSQL.
-- Existing Azure Blob references remain readable through the legacy download path.
create unique index if not exists file_objects_tenant_id_unique on file_objects(organization_id,id);
create table if not exists file_contents(
 file_id uuid primary key,
 organization_id uuid not null references organizations(id) on delete cascade,
 body bytea not null check (octet_length(body) between 1 and 10485760),
 foreign key (organization_id,file_id) references file_objects(organization_id,id) on delete cascade
);
alter table file_contents enable row level security;
alter table file_contents force row level security;
create policy file_contents_tenant on file_contents using (organization_id=nullif(current_setting('app.organization_id',true),'')::uuid) with check (organization_id=nullif(current_setting('app.organization_id',true),'')::uuid);
alter table app_users add column if not exists avatar_url text;
-- Validate all existing tenant foreign keys against the actual canonical data.
do $$ declare item record; begin
 for item in select conrelid::regclass as table_name,conname from pg_constraint where contype='f' and not convalidated and connamespace='public'::regnamespace loop
  execute format('alter table %s validate constraint %I',item.table_name,item.conname);
 end loop;
end $$;

create or replace function validate_file_content_integrity() returns trigger language plpgsql as $$
declare metadata record;
begin
 select size_bytes,sha256 into metadata from file_objects where id=new.file_id and organization_id=new.organization_id;
 if not found or metadata.size_bytes<>octet_length(new.body) or metadata.sha256<>encode(digest(new.body,'sha256'),'hex') then
  raise exception 'File content does not match its metadata' using errcode='23514';
 end if;
 return new;
end $$;
create trigger file_content_integrity before insert or update on file_contents for each row execute function validate_file_content_integrity();
