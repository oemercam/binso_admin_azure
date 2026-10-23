-- New issues only. Existing issued invoices are never fabricated/backfilled.
create table invoice_versions (
 organization_id uuid not null references organizations(id) on delete cascade,
 invoice_id uuid not null,
 pdf bytea not null,
 pdf_sha256 text not null check(pdf_sha256 ~ '^[a-f0-9]{64}$'),
 created_by_user_id text not null,
 created_at timestamptz not null default now(),
 primary key(organization_id,invoice_id),
 foreign key(organization_id,invoice_id) references invoices(organization_id,id) on delete cascade
);
alter table invoice_versions enable row level security;
alter table invoice_versions force row level security;
create policy tenant_scope on invoice_versions using(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid) with check(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid);
create function prevent_issued_invoice_pdf_change() returns trigger language plpgsql as $$ begin
 if TG_OP='DELETE' and pg_trigger_depth()>1 then return OLD; end if;
 raise exception 'Issued invoice PDFs are immutable';
end $$;
create trigger immutable_invoice_pdf before update or delete on invoice_versions for each row execute function prevent_issued_invoice_pdf_change();
do $$ begin
 if exists(select 1 from pg_roles where rolname='binso_runtime') then grant select,insert on invoice_versions to binso_runtime; end if;
end $$;
