-- V75 complete product foundation: operator separation, support/pilot/leads workflows,
-- help centre, analytics, billing reconciliation, data lifecycle, incidents and releases.

-- Functional operator roles are application data. Entra remains the eligibility/authentication boundary.
create table if not exists platform_operator_assignments (
  user_id text primary key,
  email text not null,
  role text not null check (role in ('platform_owner','platform_admin','platform_support','platform_billing','platform_auditor')),
  status text not null default 'active' check (status in ('active','suspended')),
  created_by_user_id text,
  updated_by_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_platform_operator_email_ci on platform_operator_assignments(lower(email));

-- Operator/customer detail notes already exist since V73 with tenant_id.
-- Keep that column for backward compatibility because production migrations run before the slot swap.
create index if not exists idx_platform_internal_notes_tenant_created on platform_internal_notes(tenant_id, created_at desc);

-- Support/feedback workflow maturity.
alter table support_cases add column if not exists priority text not null default 'normal'
  check (priority in ('low','normal','high','urgent'));
alter table support_cases add column if not exists assigned_to_user_id text;
alter table support_cases add column if not exists first_response_at timestamptz;
alter table support_cases add column if not exists resolved_at timestamptz;
alter table support_cases add column if not exists merged_into_case_id uuid references support_cases(id) on delete set null;
alter table support_messages add column if not exists visibility text not null default 'customer'
  check (visibility in ('customer','internal'));
create index if not exists idx_support_cases_queue on support_cases(status,priority,updated_at desc);
create index if not exists idx_support_cases_assignee on support_cases(assigned_to_user_id,status) where assigned_to_user_id is not null;

-- Public lead workflow.
alter table public_leads add column if not exists assigned_to_user_id text;
alter table public_leads add column if not exists internal_notes text;
alter table public_leads add column if not exists converted_organization_id uuid references organizations(id) on delete set null;
alter table public_leads add column if not exists updated_at timestamptz not null default now();
create index if not exists idx_public_leads_status_updated on public_leads(status,updated_at desc);

-- Pilot goals/outcomes and lightweight product-success metrics.
alter table organizations add column if not exists pilot_goal text;
alter table organizations add column if not exists pilot_outcome text;
alter table organizations add column if not exists pilot_completed_at timestamptz;

create table if not exists organization_milestones (
  organization_id uuid not null references organizations(id) on delete cascade,
  milestone text not null check (milestone in ('onboarding_completed','first_customer','first_quote','first_order','first_time_entry','first_invoice','first_payment')),
  occurred_at timestamptz not null default now(),
  source text not null default 'system',
  primary key (organization_id,milestone)
);

create table if not exists product_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id text,
  event_name text not null,
  route text,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists idx_product_events_org_occurred on product_events(organization_id,occurred_at desc);
create index if not exists idx_product_events_name_occurred on product_events(event_name,occurred_at desc);

-- Help centre, intentionally content-only and not a support-system replacement.
create table if not exists help_center_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists help_center_articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references help_center_categories(id) on delete set null,
  slug text not null unique,
  title text not null,
  summary text,
  body text not null,
  keywords text[] not null default '{}',
  published boolean not null default false,
  updated_by_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_help_articles_published on help_center_articles(published,updated_at desc);

create table if not exists help_center_feedback (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references help_center_articles(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  user_id text,
  helpful boolean not null,
  created_at timestamptz not null default now()
);

-- Data lifecycle requests make destructive actions explicit, reviewable and auditable.
create table if not exists data_lifecycle_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  requested_by_user_id text not null,
  request_type text not null check (request_type in ('export','cancel','delete')),
  status text not null default 'requested' check (status in ('requested','approved','processing','completed','rejected','cancelled')),
  reason text,
  retention_until timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_data_lifecycle_org_status on data_lifecycle_requests(organization_id,status,created_at desc);

-- Billing reconciliation and durable webhook retry/dead-letter state.
alter table billing_webhook_events add column if not exists next_retry_at timestamptz;
alter table billing_webhook_events add column if not exists dead_lettered_at timestamptz;
create table if not exists billing_reconciliation_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'running' check (status in ('running','completed','failed')),
  checked_subscriptions integer not null default 0,
  repaired_subscriptions integer not null default 0,
  failed_subscriptions integer not null default 0,
  detail text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Operator-visible release and incident history.
create table if not exists platform_release_events (
  id uuid primary key default gen_random_uuid(),
  build_id text not null,
  environment text not null check (environment in ('staging','production')),
  status text not null check (status in ('started','healthy','failed','rolled_back')),
  commit_sha text,
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists idx_platform_release_created on platform_release_events(created_at desc);

create table if not exists platform_incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  severity text not null check (severity in ('minor','major','critical')),
  status text not null default 'investigating' check (status in ('investigating','identified','monitoring','resolved')),
  public_message text,
  internal_detail text,
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  updated_by_user_id text,
  updated_at timestamptz not null default now()
);
create index if not exists idx_platform_incidents_status_started on platform_incidents(status,started_at desc);

-- Distributed rate-limit buckets backed by PostgreSQL. This avoids per-instance memory limits.
create table if not exists rate_limit_buckets (
  bucket_key text primary key,
  count integer not null,
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);
create index if not exists idx_rate_limit_reset on rate_limit_buckets(reset_at);

-- RLS for tenant-owned workflow/analytics records.
do $$
declare t text;
begin
  foreach t in array array['organization_milestones','product_events','data_lifecycle_requests']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists tenant_isolation on %I', t);
    execute format(
      'create policy tenant_isolation on %I using (organization_id = nullif(current_setting(''app.organization_id'', true), '''')::uuid) with check (organization_id = nullif(current_setting(''app.organization_id'', true), '''')::uuid)',
      t
    );
  end loop;
end $$;

-- Seed a small, useful help centre without marketing filler.
insert into help_center_categories(slug,title,description,sort_order) values
  ('erste-schritte','Erste Schritte','Einrichtung und erste produktive Schritte.',10),
  ('abrechnung','Abrechnung','Abonnement, Rechnungen und Zahlungsstatus.',20),
  ('support','Support','Supportfälle, Diagnosekontext und Zugriff.',30)
on conflict (slug) do nothing;

insert into help_center_articles(category_id,slug,title,summary,body,keywords,published)
select c.id,'erste-schritte-kunde','Ersten Kunden erfassen','Kunden können mit den wichtigsten Angaben erfasst und später ergänzt werden.',
       'Öffne Kunden und wähle Neuer Kunde. Für den ersten Schritt genügt der Name. Weitere Angaben kannst du später ergänzen.',
       array['kunden','erfassen','erste schritte'],true
from help_center_categories c where c.slug='erste-schritte'
on conflict (slug) do nothing;

insert into help_center_articles(category_id,slug,title,summary,body,keywords,published)
select c.id,'supportfall-erstellen','Supportfall erstellen','Support und Feedback können direkt in Binso One erfasst werden.',
       'Öffne Support, wähle das passende Anliegen und beschreibe kurz das Problem. Binso One ergänzt sicheren technischen Kontext wie Route und Build-Version.',
       array['support','feedback','hilfe'],true
from help_center_categories c where c.slug='support'
on conflict (slug) do nothing;
