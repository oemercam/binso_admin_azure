create table if not exists public.files (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id) on delete cascade,
 purpose text not null check(purpose in ('company_logo','expense_receipt','support_attachment')),entity_id text,
 bucket text not null check(bucket in ('company-assets','expense-receipts','support-files')),storage_path text not null,
 original_name text not null,content_type text not null,size_bytes bigint not null check(size_bytes>=0 and size_bytes<=10485760),
 created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),unique(bucket,storage_path)
);
create index if not exists idx_files_tenant_purpose on public.files(tenant_id,purpose,entity_id,created_at desc);
alter table public.files enable row level security;
create policy files_member_select on public.files for select using(public.is_tenant_member(tenant_id));
create policy files_member_insert on public.files for insert with check(public.is_tenant_member(tenant_id) and created_by=auth.uid());
create policy files_admin_delete on public.files for delete using(public.is_tenant_admin(tenant_id));
create policy files_operator_select on public.files for select using(public.is_operator());
