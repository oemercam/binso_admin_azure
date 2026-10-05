-- Idempotent audit trail for customer-facing invoice/offer delivery.
create table if not exists document_deliveries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  idempotency_key text not null check (length(idempotency_key) between 8 and 200),
  document_kind text not null check (document_kind in ('invoice','offer')),
  document_id uuid not null,
  document_number text not null,
  recipient_email text not null,
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  provider text,
  requested_by_user_id text references app_users(id) on delete set null,
  failure_reason text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (organization_id,idempotency_key)
);

create index if not exists idx_document_deliveries_document
  on document_deliveries(organization_id,document_kind,document_id,created_at desc);

alter table document_deliveries enable row level security;
alter table document_deliveries force row level security;

drop policy if exists tenant_document_deliveries on document_deliveries;
create policy tenant_document_deliveries on document_deliveries
  using (
    organization_id = nullif(current_setting('app.organization_id',true),'')::uuid
  )
  with check (
    organization_id = nullif(current_setting('app.organization_id',true),'')::uuid
  );
