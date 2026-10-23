-- Additive offer history. Existing quotes, numbers and financial links stay intact.
alter table quotes add column offer_version integer not null default 1 check(offer_version>0);
create table offer_versions (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references organizations(id) on delete cascade,
 quote_id uuid not null references quotes(id) on delete cascade,
 version integer not null check(version>0),
 number text not null,
 document jsonb not null,
 company jsonb not null,
 pdf bytea not null,
 pdf_sha256 text not null check(pdf_sha256 ~ '^[a-f0-9]{64}$'),
 created_by_user_id text not null,
 created_at timestamptz not null default now(),
 unique(organization_id,quote_id,version),unique(organization_id,id)
);
create table offer_public_links (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references organizations(id) on delete cascade,
 version_id uuid not null,
 token_hash text not null unique check(token_hash ~ '^[a-f0-9]{64}$'),
 token_enc text not null,
 recipient text not null,
 locale text not null default 'de' check(locale in ('de','en','fr','it')),
 created_by_user_id text not null,
 expires_at timestamptz not null,
 revoked_at timestamptz,
 created_at timestamptz not null default now(),
 foreign key(organization_id,version_id) references offer_versions(organization_id,id) on delete cascade
);
create index offer_links_version on offer_public_links(organization_id,version_id);
create table offer_public_events (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references organizations(id) on delete cascade,
 link_id uuid not null references offer_public_links(id) on delete cascade,
 kind text not null check(kind in ('link_requested','view_reported','pdf_requested','question','reply','accepted','declined','code_requested','provider_accepted','provider_unconfirmed')),
 body text not null default '' check(length(body)<=4000),
 actor text not null check(actor in ('recipient','employee','unverified_client','provider')),
 created_by_user_id text,
 request_key text not null,
 created_at timestamptz not null default now(),
 unique(link_id,request_key)
);
create index offer_events_link on offer_public_events(organization_id,link_id,created_at);
create table offer_recipient_codes (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references organizations(id) on delete cascade,
 link_id uuid not null references offer_public_links(id) on delete cascade,
 action text not null check(action in ('accept','decline','question')),
 code_hash text not null,
 expires_at timestamptz not null,
 attempts integer not null default 0 check(attempts between 0 and 5),
 consumed_at timestamptz,
 created_at timestamptz not null default now()
);
create index offer_codes_link on offer_recipient_codes(organization_id,link_id,created_at desc);
alter table document_deliveries add column offer_version_id uuid references offer_versions(id) on delete set null;
alter table document_deliveries add column public_link_id uuid references offer_public_links(id) on delete set null;
alter table document_deliveries add column subject text;
alter table document_deliveries add column message text;
do $$ declare t text; begin
 foreach t in array array['offer_versions','offer_public_links','offer_public_events','offer_recipient_codes'] loop
  execute format('alter table %I enable row level security',t);
  execute format('alter table %I force row level security',t);
  execute format('create policy tenant_scope on %I using(organization_id=nullif(current_setting(''app.organization_id'',true),'''')::uuid) with check(organization_id=nullif(current_setting(''app.organization_id'',true),'''')::uuid)',t);
 end loop;
end $$;
-- Capability lookup reveals only the one link identified by an unguessable token.
-- No capability grants public SQL writes or broad tenant reads.
create policy capability_lookup on offer_public_links for select using(token_hash=nullif(current_setting('app.offer_token_hash',true),''));
create function prevent_offer_version_change() returns trigger language plpgsql as $$ begin
 -- Preserve the existing explicitly controlled tenant-erasure cascade. Ordinary
 -- application DELETE/UPDATE cannot alter an issued version.
 if TG_OP='DELETE' and pg_trigger_depth()>1 then return OLD; end if;
 raise exception 'Issued offer versions are immutable';
end $$;
create trigger immutable_offer_version before update or delete on offer_versions for each row execute function prevent_offer_version_change();
-- Existing restricted runtime only; no new login, ownership or bypass privilege.
do $$ begin
 if exists(select 1 from pg_roles where rolname='binso_runtime') then
  grant select,insert on offer_versions to binso_runtime;
  grant select,insert,update on offer_public_links,offer_recipient_codes to binso_runtime;
  grant select,insert on offer_public_events to binso_runtime;
 end if;
end $$;
