-- Optional, own-user presentation preference; no business configuration is changed.
create table user_setup_preferences (
 organization_id uuid not null references organizations(id) on delete cascade,
 user_id text not null references app_users(id) on delete cascade,
 dismissed boolean not null default false,
 updated_at timestamptz not null default now(),
 primary key(organization_id,user_id)
);
alter table user_setup_preferences enable row level security;
alter table user_setup_preferences force row level security;
create policy own_setup_preference on user_setup_preferences
 using(organization_id::text=nullif(current_setting('app.organization_id',true),'') and user_id=nullif(current_setting('app.user_id',true),''))
 with check(organization_id::text=nullif(current_setting('app.organization_id',true),'') and user_id=nullif(current_setting('app.user_id',true),''));
do $$ begin
 if exists(select 1 from pg_roles where rolname='binso_runtime') then
  grant select,insert,update on user_setup_preferences to binso_runtime;
 end if;
end $$;
