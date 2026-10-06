alter table app_users drop constraint if exists app_users_status_check;
alter table app_users add constraint app_users_status_check check (status in ('active','suspended','invited'));
create table organization_invitations (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references organizations(id) on delete cascade,
 email text not null,
 role text not null check(role in ('admin','finance','hr','project_manager','manager','member','reader')),
 status text not null default 'pending' check(status in ('pending','accepted','revoked')),
 expires_at timestamptz not null,
 created_by_user_id text not null,
 created_at timestamptz not null default now()
);
create index organization_invitations_org on organization_invitations(organization_id);
alter table organization_invitations enable row level security;
alter table organization_invitations force row level security;
create policy invitation_scope on organization_invitations using (
 organization_id=nullif(current_setting('app.organization_id',true),'')::uuid or current_setting('app.platform_operator',true)='true'
) with check (organization_id=nullif(current_setting('app.organization_id',true),'')::uuid or current_setting('app.platform_operator',true)='true');

alter table expenses add column reviewed_by_user_id text;
alter table expenses add column reviewed_at timestamptz;
alter table expenses add column review_note text;
alter table expenses add column reimbursed_at timestamptz;
alter table expenses add column reimbursement_reference text;
alter table expenses add column reimbursed_by_user_id text;
alter table expenses add constraint expenses_reimbursement_approved check (reimbursed_at is null or status in ('approved','posted'));

alter table quotes add column decision_note text;
alter table quotes add column decision_at timestamptz;
alter table quotes add column decision_by_user_id text;
create table document_deliveries (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references organizations(id) on delete cascade,
 kind text not null check(kind in ('invoice','offer')),
 document_id uuid not null,
 recipient text not null,
 status text not null check(status in ('sending','sent','failed')),
 request_key text not null,
 created_by_user_id text not null,
 created_at timestamptz not null default now(),
 completed_at timestamptz,
 unique(organization_id,request_key)
);
alter table document_deliveries enable row level security;
alter table document_deliveries force row level security;
create policy delivery_scope on document_deliveries using (organization_id=nullif(current_setting('app.organization_id',true),'')::uuid) with check (organization_id=nullif(current_setting('app.organization_id',true),'')::uuid);

alter table invoices add column if not exists source_quote_id uuid;
create unique index invoice_source_quote_once on invoices(organization_id,source_quote_id) where source_quote_id is not null and archived_at is null and status<>'cancelled';
