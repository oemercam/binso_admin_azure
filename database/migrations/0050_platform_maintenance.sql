-- Platform-wide switch, never exposed through tenant business-table APIs.
create table platform_maintenance (
 id integer primary key check (id=1),
 enabled boolean not null default false,
 ends_at timestamptz,
 updated_at timestamptz not null default now(),
 updated_by_user_id uuid,
 check (not enabled or ends_at is not null)
);
insert into platform_maintenance(id,enabled) values(1,false);

alter table platform_maintenance enable row level security;
alter table platform_maintenance force row level security;
create policy maintenance_read on platform_maintenance for select using (true);
create policy maintenance_operator_update on platform_maintenance for update
 using (current_setting('app.platform_operator',true)='true')
 with check (current_setting('app.platform_operator',true)='true');
