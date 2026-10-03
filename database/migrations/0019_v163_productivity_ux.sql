-- Binso One v1.6.3 — productivity UX, persistent time tracking and user preferences.

alter table app_users add column if not exists theme text not null default 'system';
alter table app_users drop constraint if exists app_users_theme_check;
alter table app_users add constraint app_users_theme_check check (theme in ('system','light','dark'));

create table if not exists active_time_trackers (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id text not null references app_users(id) on delete cascade,
  state text not null default 'running' check (state in ('running','paused')),
  started_at timestamptz not null default now(),
  active_since timestamptz,
  accumulated_seconds integer not null default 0 check (accumulated_seconds >= 0),
  project_external_id text,
  project_label text,
  activity_label text not null default 'Arbeitszeit',
  billable boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (organization_id,user_id)
);
create index if not exists idx_active_time_trackers_user on active_time_trackers(user_id,updated_at desc);
alter table active_time_trackers enable row level security;
alter table active_time_trackers force row level security;
drop policy if exists active_time_trackers_tenant on active_time_trackers;
create policy active_time_trackers_tenant on active_time_trackers
  using (organization_id = nullif(current_setting('app.organization_id',true),'')::uuid and user_id = nullif(current_setting('app.user_id',true),''))
  with check (organization_id = nullif(current_setting('app.organization_id',true),'')::uuid and user_id = nullif(current_setting('app.user_id',true),''));

alter table platform_announcements add column if not exists release_version text;

-- Canonical support values are language-neutral. Translation belongs to the UI.
do $$
declare r record;
begin
  for r in select c.conname from pg_constraint c join pg_class t on t.oid=c.conrelid where t.relname='support_cases' and c.contype='c' and pg_get_constraintdef(c.oid) ilike '%category%'
  loop execute format('alter table support_cases drop constraint %I',r.conname); end loop;
end $$;
alter table support_cases add constraint support_cases_category_check check (category in ('question','technical','usage','billing','account','security','idea','other'));
