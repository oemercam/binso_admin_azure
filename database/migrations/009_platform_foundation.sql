begin;

create table if not exists notification_preferences(
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  kind text not null,
  in_app boolean not null default true,
  email boolean not null default true,
  push boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key(user_id,kind)
);
create index if not exists notification_preferences_org_user_idx on notification_preferences(organization_id,user_id);
alter table notification_preferences enable row level security;
alter table notification_preferences force row level security;
drop policy if exists notification_preferences_tenant on notification_preferences;
create policy notification_preferences_tenant on notification_preferences
 using (organization_id::text=current_setting('app.organization_id',true) and user_id::text=current_setting('app.user_id',true))
 with check (organization_id::text=current_setting('app.organization_id',true) and user_id::text=current_setting('app.user_id',true));

create table if not exists idempotency_keys(
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  scope text not null,
  key text not null,
  request_hash text not null,
  response_status integer,
  response_body jsonb,
  expires_at timestamptz not null default (now()+interval '24 hours'),
  created_at timestamptz not null default now(),
  primary key(organization_id,scope,key)
);
create index if not exists idempotency_exp_idx on idempotency_keys(expires_at);
alter table idempotency_keys enable row level security;
alter table idempotency_keys force row level security;
drop policy if exists idempotency_keys_tenant on idempotency_keys;
create policy idempotency_keys_tenant on idempotency_keys
 using (organization_id::text=current_setting('app.organization_id',true))
 with check (organization_id::text=current_setting('app.organization_id',true));

create index if not exists users_org_active_idx on users(organization_id,active);
create index if not exists notifications_unread_idx on notifications(organization_id,user_id,created_at desc) where read_at is null;
create index if not exists records_org_module_created_idx on records(organization_id,module,created_at desc);
create index if not exists audit_actor_time_idx on audit_logs(organization_id,user_id,created_at desc);

commit;
