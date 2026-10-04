create table organization_restrictions (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references organizations(id) on delete cascade,
 scope text not null check(scope in ('all','write')),
 reason text not null,
 note text not null,
 starts_at timestamptz not null default now(),
 ends_at timestamptz,
 active boolean not null default true,
 created_by_user_id text not null,
 removed_at timestamptz,
 removed_by_user_id text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(ends_at is null or ends_at>starts_at)
);
create index idx_org_restrictions_active on organization_restrictions(organization_id,starts_at,ends_at) where active;
alter table organization_restrictions enable row level security;
alter table organization_restrictions force row level security;
create policy restrictions_operator on organization_restrictions
 using(current_setting('app.platform_operator',true)='true')
 with check(current_setting('app.platform_operator',true)='true');
