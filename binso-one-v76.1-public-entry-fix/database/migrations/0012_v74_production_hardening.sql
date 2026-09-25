-- V74 production hardening: unified cases, pilot/demo metadata, safer RLS checks and public lead intake.

-- Support/feedback case model.
alter table support_cases add column if not exists case_type text not null default 'support'
  check (case_type in ('support','feedback','feature_request','billing'));
alter table support_cases add column if not exists classification text
  check (classification is null or classification in ('blocker','friction','request'));
alter table support_cases add column if not exists is_pilot_related boolean not null default false;
create index if not exists idx_support_cases_type_status_updated on support_cases(case_type,status,updated_at desc);

-- Race-safe human-readable case numbering.
create sequence if not exists support_case_number_seq start with 1042;
do $$
declare max_existing bigint;
begin
  select coalesce(max(nullif(regexp_replace(case_number,'[^0-9]','','g'),'')::bigint),1041)
    into max_existing
    from support_cases;
  perform setval('support_case_number_seq', greatest(max_existing,1041), true);
end $$;

-- Pilot/demo metadata belongs to the organisation, not to client-side state.
alter table organizations add column if not exists is_demo boolean not null default false;
alter table organizations add column if not exists is_pilot_customer boolean not null default false;
alter table organizations add column if not exists pilot_group text;
alter table organizations add column if not exists pilot_started_at timestamptz;
alter table organizations add column if not exists pilot_ends_at timestamptz;
alter table organizations add column if not exists pilot_status text
  check (pilot_status is null or pilot_status in ('active_pilot','pilot_review','pilot_completed','converted','not_converted','extended'));
alter table organizations add column if not exists pilot_outcome_reason text;
create index if not exists idx_organizations_pilot on organizations(is_pilot_customer,pilot_status) where is_pilot_customer=true;
create index if not exists idx_organizations_demo on organizations(is_demo) where is_demo=true;

-- Lightweight public sales/contact intake. No support conversations belong here.
create table if not exists public_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  company text,
  email text not null check (char_length(email) between 5 and 320),
  topic text not null default 'general' check (topic in ('general','sales','pilot','partnership')),
  message text not null check (char_length(message) between 5 and 2000),
  status text not null default 'new' check (status in ('new','contacted','qualified','pilot','converted','closed')),
  source text not null default 'website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_public_leads_status_created on public_leads(status,created_at desc);

-- Explicit WITH CHECK prevents tenant-id substitution on INSERT/UPDATE.
drop policy if exists support_cases_tenant_policy on support_cases;
create policy support_cases_tenant_policy on support_cases
  using (organization_id = nullif(current_setting('app.organization_id', true),'')::uuid)
  with check (organization_id = nullif(current_setting('app.organization_id', true),'')::uuid);

drop policy if exists support_messages_tenant_policy on support_messages;
create policy support_messages_tenant_policy on support_messages
  using (
    exists(select 1 from support_cases c where c.id=case_id and c.organization_id = nullif(current_setting('app.organization_id', true),'')::uuid)
  )
  with check (
    exists(select 1 from support_cases c where c.id=case_id and c.organization_id = nullif(current_setting('app.organization_id', true),'')::uuid)
  );

drop policy if exists notifications_tenant_policy on in_app_notifications;
create policy notifications_tenant_policy on in_app_notifications
  using (organization_id = nullif(current_setting('app.organization_id', true),'')::uuid)
  with check (organization_id = nullif(current_setting('app.organization_id', true),'')::uuid);

insert into platform_feature_flags(key,description,enabled) values
 ('unified_support_feedback','Gemeinsame Case Engine für Support und Feedback',true),
 ('pilot_program','Pilotkunden und Pilotfeedback',true),
 ('public_contact_leads','Öffentliche Kontaktanfragen als Leads',true)
on conflict (key) do nothing;
