begin;

alter table organizations add column if not exists terms_version text;
alter table organizations add column if not exists terms_accepted_at timestamptz;
alter table organizations add column if not exists privacy_version text;

create table if not exists support_tickets(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references organizations(id) on delete cascade,
 created_by uuid not null references users(id) on delete restrict,
 ticket_number text not null unique,
 category text not null,
 subject text not null,
 description text not null,
 priority text not null default 'Normal',
 status text not null default 'Neu',
 assigned_operator_id uuid references platform_users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists support_org_time_idx on support_tickets(organization_id,updated_at desc);

create table if not exists support_messages(
 id uuid primary key default gen_random_uuid(),
 ticket_id uuid not null references support_tickets(id) on delete cascade,
 author_type text not null check(author_type in ('tenant','operator','system')),
 author_user_id uuid,
 author_name text not null,
 message text not null,
 internal boolean not null default false,
 created_at timestamptz not null default now()
);
create index if not exists support_messages_ticket_idx on support_messages(ticket_id,created_at);

create table if not exists feedback_entries(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references organizations(id) on delete cascade,
 user_id uuid references users(id) on delete set null,
 rating integer not null check(rating between 1 and 5),
 category text not null,
 feedback_text text not null,
 may_contact boolean not null default false,
 context_path text,
 status text not null default 'Neu',
 created_at timestamptz not null default now()
);
create index if not exists feedback_time_idx on feedback_entries(created_at desc);

create table if not exists feature_flags(
 id uuid primary key default gen_random_uuid(),
 flag_key text not null,
 organization_id uuid references organizations(id) on delete cascade,
 enabled boolean not null default false,
 description text,
 updated_at timestamptz not null default now(),
 unique(flag_key,organization_id)
);

create table if not exists announcements(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid references organizations(id) on delete cascade,
 title text not null,
 message text not null,
 kind text not null default 'info' check(kind in ('info','success','warning')),
 active boolean not null default true,
 starts_at timestamptz not null default now(),
 ends_at timestamptz,
 created_at timestamptz not null default now()
);

alter table support_tickets enable row level security;
alter table support_messages enable row level security;
alter table feedback_entries enable row level security;

drop policy if exists support_tickets_tenant on support_tickets;
create policy support_tickets_tenant on support_tickets using (organization_id::text=current_setting('app.organization_id',true)) with check (organization_id::text=current_setting('app.organization_id',true));

drop policy if exists support_messages_tenant on support_messages;
create policy support_messages_tenant on support_messages using (exists(select 1 from support_tickets t where t.id=ticket_id and t.organization_id::text=current_setting('app.organization_id',true))) with check (exists(select 1 from support_tickets t where t.id=ticket_id and t.organization_id::text=current_setting('app.organization_id',true)));

drop policy if exists feedback_tenant on feedback_entries;
create policy feedback_tenant on feedback_entries using (organization_id::text=current_setting('app.organization_id',true)) with check (organization_id::text=current_setting('app.organization_id',true));

insert into feature_flags(flag_key,organization_id,enabled,description)
select 'pilot_feedback',null,true,'Pilot feedback prompt'
where not exists(select 1 from feature_flags where flag_key='pilot_feedback' and organization_id is null);

insert into feature_flags(flag_key,organization_id,enabled,description)
select 'announcements',null,true,'In-app announcements'
where not exists(select 1 from feature_flags where flag_key='announcements' and organization_id is null);

insert into announcements(title,message,kind,active)
select 'Willkommen in der Pilotphase','Hilf uns, Binso One zu verbessern. Feedback kannst du jederzeit direkt in der Anwendung senden.','info',true
where not exists(select 1 from announcements where title='Willkommen in der Pilotphase');

commit;
