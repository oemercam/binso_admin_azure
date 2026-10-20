-- Keep historical notifications and read_at unchanged. Shared notifications now
-- have a per-user receipt; an old shared read cannot be attributed to a person.
create unique index notification_tenant_identity on in_app_notifications(organization_id,id);
create table notification_reads (
 organization_id uuid not null,
 notification_id uuid not null,
 user_id text not null references app_users(id) on delete cascade,
 read_at timestamptz not null default now(),
 primary key(notification_id,user_id),
 foreign key(organization_id,notification_id) references in_app_notifications(organization_id,id) on delete cascade
);
alter table notification_reads enable row level security;
alter table notification_reads force row level security;
create index notification_reads_user_scope on notification_reads(user_id,organization_id,notification_id);
create policy own_notification_receipt on notification_reads
 using (organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and user_id=current_setting('app.user_id',true))
 with check (organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and user_id=current_setting('app.user_id',true)
  and exists(select 1 from in_app_notifications n where n.id=notification_id and n.organization_id=notification_reads.organization_id and (n.user_id is null or n.user_id=notification_reads.user_id)));
do $$ begin
 if exists(select 1 from pg_roles where rolname='binso_runtime') then
  grant select,insert on notification_reads to binso_runtime;
 end if;
end $$;
