-- Microsoft Entra ID is the source of truth for internal Binso operator identity and roles.
alter table platform_operator_assignments add column if not exists entra_object_id text;
alter table platform_operator_assignments add column if not exists entra_tenant_id text;
alter table platform_operator_assignments add column if not exists auth_source text not null default 'legacy'
  check (auth_source in ('legacy','entra'));
alter table platform_operator_assignments add column if not exists last_entra_sync_at timestamptz;

create unique index if not exists uq_platform_operator_entra_identity
  on platform_operator_assignments(entra_tenant_id,entra_object_id)
  where entra_tenant_id is not null and entra_object_id is not null;

create index if not exists idx_platform_operator_auth_source
  on platform_operator_assignments(auth_source,status);

comment on column platform_operator_assignments.password_hash is
  'Legacy only. Production internal Binso operator authentication is Microsoft Entra ID.';
