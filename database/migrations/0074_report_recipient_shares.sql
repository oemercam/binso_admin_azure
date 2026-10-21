create table report_public_links(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references organizations(id) on delete cascade,
 export_id uuid not null,
 created_by_user_id text not null,
 recipient text not null check(length(recipient)<=254),
 token_hash text not null unique check(token_hash ~ '^[a-f0-9]{64}$'),
 token_enc text not null,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null,
 revoked_at timestamptz,
 foreign key(organization_id,export_id) references report_exports(organization_id,id) on delete cascade,
 unique(organization_id,id)
);
create index report_share_owner on report_public_links(organization_id,created_by_user_id,export_id,created_at desc);
create table report_recipient_codes(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references organizations(id) on delete cascade,
 link_id uuid not null,
 code_hash text not null check(code_hash ~ '^[a-f0-9]{64}$'),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '10 minutes',
 attempts integer not null default 0 check(attempts between 0 and 5),
 consumed_at timestamptz,
 request_key text check(length(request_key) between 8 and 128),
 foreign key(organization_id,link_id) references report_public_links(organization_id,id) on delete cascade
);
create index report_code_current on report_recipient_codes(organization_id,link_id,created_at desc);
do $$ declare t text; begin
 foreach t in array array['report_public_links','report_recipient_codes'] loop
  execute format('alter table %I enable row level security',t);
  execute format('alter table %I force row level security',t);
  execute format('create policy tenant_scope on %I using(organization_id=nullif(current_setting(''app.organization_id'',true),'''')::uuid) with check(organization_id=nullif(current_setting(''app.organization_id'',true),'''')::uuid)',t);
 end loop;
end $$;
-- The existing restricted runtime can identify only the one hashed capability.
-- PDF data remains in the tenant table and is never exposed by this policy.
create policy capability_lookup on report_public_links for select using(token_hash=nullif(current_setting('app.report_token_hash',true),''));
create function protect_report_share_identity() returns trigger language plpgsql as $$ begin
 if (to_jsonb(new)-'revoked_at') is distinct from (to_jsonb(old)-'revoked_at') or old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at then raise exception 'Report share identity is immutable'; end if;
 return new;
end $$;
create trigger report_share_identity before update on report_public_links for each row execute function protect_report_share_identity();
do $$ begin
 if exists(select 1 from pg_roles where rolname='binso_runtime') then grant select,insert,update on report_public_links,report_recipient_codes to binso_runtime; end if;
end $$;
