-- Generated report copies, not changes to underlying financial/time records.
create table report_exports(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references organizations(id) on delete cascade,
 created_by_user_id text not null,
 kind text not null check(kind in ('summary','time')),
 locale text not null check(locale in ('de','fr','it','en')),
 query_text text not null check(length(query_text)<=4096),
 scope_hash text not null check(scope_hash ~ '^[a-f0-9]{64}$'),
 data_as_of timestamptz not null,
 pdf bytea not null check(octet_length(pdf)<=10000000 and substring(pdf from 1 for 5)=decode('255044462d','hex')),
 pdf_sha256 text not null check(pdf_sha256 ~ '^[a-f0-9]{64}$'),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '7 days',
 unique(organization_id,id)
);
create index report_exports_owner on report_exports(organization_id,created_by_user_id,created_at desc);
alter table report_exports enable row level security;
alter table report_exports force row level security;
create policy tenant_scope on report_exports using(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid) with check(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid);
create function protect_report_export_content() returns trigger language plpgsql as $$ begin
 raise exception 'Report export content is immutable';
end $$;
-- Existing approved company-erasure/retention paths must still be able to
-- delete derived copies. No report API exposes deletion or content updates.
create trigger report_export_immutable before update on report_exports for each row execute function protect_report_export_content();
do $$ begin
 if exists(select 1 from pg_roles where rolname='binso_runtime') then grant select,insert,delete on report_exports to binso_runtime; end if;
end $$;
