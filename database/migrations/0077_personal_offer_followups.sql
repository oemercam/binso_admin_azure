-- Personal opt-in only. No mail sender, scheduler, provider or role is created.
create table offer_followups (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references organizations(id) on delete cascade,
 version_id uuid not null,
 user_id text not null references app_users(id) on delete cascade,
 due_date date not null,
 state text not null default 'scheduled' check(state in ('scheduled','notified','cancelled','skipped')),
 notification_id uuid references in_app_notifications(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 foreign key(organization_id,version_id) references offer_versions(organization_id,id) on delete cascade,
 unique(organization_id,version_id,user_id)
);
create index offer_followups_due on offer_followups(organization_id,user_id,due_date) where state='scheduled';
alter table offer_followups enable row level security;
alter table offer_followups force row level security;
create policy personal_offer_followups on offer_followups
 using(organization_id::text=nullif(current_setting('app.organization_id',true),'') and user_id=nullif(current_setting('app.user_id',true),''))
 with check(organization_id::text=nullif(current_setting('app.organization_id',true),'') and user_id=nullif(current_setting('app.user_id',true),''));
do $$ begin
 if exists(select 1 from pg_roles where rolname='binso_runtime') then grant select,insert,update on offer_followups to binso_runtime; end if;
end $$;
