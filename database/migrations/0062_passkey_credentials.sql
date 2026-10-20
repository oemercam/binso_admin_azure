-- Public keys only. Biometric/PIN data stays on the authenticator.
create table auth_passkeys (
 credential_id text primary key,
 user_id text not null references app_users(id),
 organization_id uuid not null references organizations(id),
 public_key bytea not null,
 counter bigint not null default 0 check(counter>=0),
 label text not null check(length(label) between 1 and 100),
 transports text[] not null default '{}',
 device_type text not null,
 backed_up boolean not null,
 created_at timestamptz not null default now(),
 last_used_at timestamptz,
 revoked_at timestamptz,
 foreign key(organization_id,user_id) references organization_memberships(organization_id,user_id)
);
create table auth_passkey_challenges (
 token_hash text primary key,
 challenge text not null,
 purpose text not null check(purpose in ('register','authenticate')),
 user_id text references app_users(id),
 organization_id uuid references organizations(id),
 session_id uuid references auth_sessions(id) on delete cascade,
 auth_snapshot text,
 label text,
 expires_at timestamptz not null,
 created_at timestamptz not null default now(),
 foreign key(organization_id,user_id) references organization_memberships(organization_id,user_id)
);
create index passkey_challenge_expiry on auth_passkey_challenges(expires_at);
alter table auth_passkeys enable row level security;
alter table auth_passkey_challenges enable row level security;
create policy passkey_identity_scope on auth_passkeys using (
 current_setting('app.platform_operator',true)='true' or
 (user_id=current_setting('app.user_id',true) and organization_id=nullif(current_setting('app.organization_id',true),'')::uuid)
) with check (
 current_setting('app.platform_operator',true)='true' or
 (user_id=current_setting('app.user_id',true) and organization_id=nullif(current_setting('app.organization_id',true),'')::uuid)
);
create policy passkey_challenge_scope on auth_passkey_challenges using (
 current_setting('app.platform_operator',true)='true' or
 (user_id=current_setting('app.user_id',true) and organization_id=nullif(current_setting('app.organization_id',true),'')::uuid)
) with check (
 current_setting('app.platform_operator',true)='true' or
 (user_id=current_setting('app.user_id',true) and organization_id=nullif(current_setting('app.organization_id',true),'')::uuid)
);
alter table mail_outbox drop constraint mail_outbox_kind_check;
alter table mail_outbox add constraint mail_outbox_kind_check check(kind in ('quote','invoice','reminder','invitation','security'));
do $$ begin
 if exists(select 1 from pg_roles where rolname='binso_runtime') then
  grant select,insert,update,delete on auth_passkeys,auth_passkey_challenges to binso_runtime;
 end if;
end $$;
