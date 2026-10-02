-- Private file metadata and storage policies for receipts, company assets and support attachments.

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  purpose text not null check (purpose in ('company_logo','expense_receipt','support_attachment')),
  entity_id text,
  bucket text not null check (bucket in ('company-assets','expense-receipts','support-files')),
  storage_path text not null,
  original_name text not null,
  content_type text not null,
  size_bytes bigint not null check (size_bytes >= 0 and size_bytes <= 10485760),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(bucket,storage_path)
);

create index if not exists idx_files_tenant_purpose on public.files(tenant_id,purpose,entity_id,created_at desc);

alter table public.files enable row level security;

drop policy if exists files_member_select on public.files;
create policy files_member_select on public.files for select using(public.is_tenant_member(tenant_id));
drop policy if exists files_member_insert on public.files;
create policy files_member_insert on public.files for insert with check(public.is_tenant_member(tenant_id) and created_by=auth.uid());
drop policy if exists files_admin_delete on public.files;
create policy files_admin_delete on public.files for delete using(public.is_tenant_admin(tenant_id));
drop policy if exists files_operator_select on public.files;
create policy files_operator_select on public.files for select using(public.is_operator());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
  ('company-assets','company-assets',false,5242880,array['image/png','image/jpeg','image/webp','image/svg+xml']),
  ('expense-receipts','expense-receipts',false,10485760,array['image/png','image/jpeg','image/webp','application/pdf']),
  ('support-files','support-files',false,10485760,array['image/png','image/jpeg','image/webp','application/pdf','text/plain'])
on conflict(id) do update set
  public=excluded.public,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

-- Paths always begin with tenant UUID. Storage authorization is therefore tenant-aware without public buckets.
drop policy if exists binso_storage_member_select on storage.objects;
create policy binso_storage_member_select on storage.objects
for select to authenticated
using(
  bucket_id in ('company-assets','expense-receipts','support-files')
  and exists(
    select 1 from public.tenant_memberships m
    where m.user_id=auth.uid()
      and m.tenant_id::text=(storage.foldername(name))[1]
  )
);

drop policy if exists binso_storage_member_insert on storage.objects;
create policy binso_storage_member_insert on storage.objects
for insert to authenticated
with check(
  bucket_id in ('company-assets','expense-receipts','support-files')
  and exists(
    select 1 from public.tenant_memberships m
    where m.user_id=auth.uid()
      and m.tenant_id::text=(storage.foldername(name))[1]
  )
);

drop policy if exists binso_storage_admin_delete on storage.objects;
create policy binso_storage_admin_delete on storage.objects
for delete to authenticated
using(
  bucket_id in ('company-assets','expense-receipts','support-files')
  and exists(
    select 1 from public.tenant_memberships m
    where m.user_id=auth.uid()
      and m.role in ('owner','admin')
      and m.tenant_id::text=(storage.foldername(name))[1]
  )
);
