-- Minimal child dossier and separately reviewed authority decisions. No automatic allowance.
-- Replay snapshots contain the same protected fields as the domain response.
create policy sensitive_business_replay on business_idempotency_keys as restrictive for all using(
 (operation not in ('wage_definition.create','wage_definition.revise','employee_child.create','employee_child.revise','allowance_claim.create','allowance_claim.revise'))
 or (operation in ('wage_definition.create','wage_definition.revise') and app_has_sensitive_capability('hr_sensitive:read'))
 or (operation in ('employee_child.create','employee_child.revise','allowance_claim.create','allowance_claim.revise') and app_has_sensitive_capability('family:read'))
) with check(
 (operation not in ('wage_definition.create','wage_definition.revise','employee_child.create','employee_child.revise','allowance_claim.create','allowance_claim.revise'))
 or (operation in ('wage_definition.create','wage_definition.revise') and app_has_sensitive_capability('hr_sensitive:write'))
 or (operation in ('employee_child.create','employee_child.revise','allowance_claim.create','allowance_claim.revise') and app_has_sensitive_capability('family:write'))
);
create table employee_children(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null,employee_id uuid not null,
 child_id uuid not null default gen_random_uuid(),revision integer not null default 1 check(revision>0),is_current boolean not null default true,
 display_name text not null check(length(btrim(display_name)) between 1 and 160),birth_date date not null,active boolean not null,
 created_by_user_id text not null,created_at timestamptz not null default now(),
 foreign key(organization_id,employee_id) references employees(organization_id,id),
 unique(organization_id,employee_id,child_id,revision),unique(organization_id,employee_id,id)
);
create unique index employee_child_current on employee_children(organization_id,employee_id,child_id) where is_current;
create table employee_allowance_claims(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null,employee_id uuid not null,
 claim_id uuid not null default gen_random_uuid(),revision integer not null default 1 check(revision>0),is_current boolean not null default true,
 child_revision_id uuid not null,employment_revision_id uuid not null,
 allowance_type text not null check(allowance_type in ('child','education')),
 starts_on date not null,ends_on date not null check(ends_on>=starts_on),
 authority text not null check(length(btrim(authority)) between 1 and 180),
 canton text not null check(canton in ('AG','AI','AR','BE','BL','BS','FR','GE','GL','GR','JU','LU','NE','NW','OW','SG','SH','SO','SZ','TG','TI','UR','VD','VS','ZG','ZH')),
 decision_reference text not null check(length(btrim(decision_reference)) between 1 and 180),
 monthly_amount numeric(12,2) not null check(monthly_amount>0),currency text not null default 'CHF' check(currency='CHF'),
 status text not null default 'draft' check(status in ('draft','verified','rejected','revoked')),
 requested_by_user_id text not null,created_by_user_id text not null,reviewed_by_user_id text,reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 foreign key(organization_id,employee_id,child_revision_id) references employee_children(organization_id,employee_id,id),
 foreign key(organization_id,employee_id,employment_revision_id) references employee_employment_periods(organization_id,employee_id,id),
 unique(organization_id,employee_id,claim_id,revision),
 check((status='draft' and reviewed_by_user_id is null and reviewed_at is null) or (status<>'draft' and reviewed_by_user_id is not null and reviewed_at is not null))
);
create unique index employee_allowance_current on employee_allowance_claims(organization_id,employee_id,claim_id) where is_current;
do $$ declare t text;begin foreach t in array array['employee_children','employee_allowance_claims'] loop
 execute format('alter table %I enable row level security',t);execute format('alter table %I force row level security',t);
 execute format('create policy family_read on %I for select using(organization_id=nullif(current_setting(''app.organization_id'',true),'''')::uuid and app_has_sensitive_capability(''family:read''))',t);
 execute format('create policy family_insert on %I for insert with check(organization_id=nullif(current_setting(''app.organization_id'',true),'''')::uuid and app_has_sensitive_capability(''family:write'') and created_by_user_id=current_setting(''app.user_id'',true))',t);
 execute format('create policy family_supersede on %I for update using(organization_id=nullif(current_setting(''app.organization_id'',true),'''')::uuid and app_has_sensitive_capability(''family:write'')) with check(organization_id=nullif(current_setting(''app.organization_id'',true),'''')::uuid and app_has_sensitive_capability(''family:write''))',t);
 if exists(select 1 from pg_roles where rolname='binso_runtime') then execute format('grant select,insert,update on %I to binso_runtime',t);end if;
end loop;end $$;
create function protect_employee_child_revision() returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text||':family:'||new.employee_id::text,0));
 if tg_op='UPDATE' then
  if not old.is_current or new.is_current or (to_jsonb(new)-'is_current') is distinct from (to_jsonb(old)-'is_current') then raise exception 'Child history is immutable' using errcode='23514';end if;
 else
  if new.birth_date>current_date or not new.is_current or new.revision<>coalesce((select max(c.revision)+1 from employee_children c where c.organization_id=new.organization_id and c.employee_id=new.employee_id and c.child_id=new.child_id),1) or exists(select 1 from employee_children c where c.organization_id=new.organization_id and c.employee_id=new.employee_id and c.child_id=new.child_id and c.is_current) then raise exception 'Child revision conflict or future birth date' using errcode='23514';end if;
 end if;return new;
end $$;
create trigger employee_child_revision before insert or update on employee_children for each row execute function protect_employee_child_revision();
create function protect_employee_allowance_revision() returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare previous employee_allowance_claims%rowtype;child employee_children%rowtype;employment employee_employment_periods%rowtype;
begin
 perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text||':family:'||new.employee_id::text,0));
 if tg_op='UPDATE' then
  if not old.is_current or new.is_current or (to_jsonb(new)-'is_current') is distinct from (to_jsonb(old)-'is_current') then raise exception 'Allowance history is immutable' using errcode='23514';end if;
 else
  select * into previous from employee_allowance_claims where organization_id=new.organization_id and employee_id=new.employee_id and claim_id=new.claim_id order by revision desc limit 1;
  if not new.is_current or new.revision<>coalesce(previous.revision+1,1) or previous.is_current then raise exception 'Allowance revision conflict' using errcode='23514';end if;
  if previous.id is null then
   if new.status<>'draft' or new.requested_by_user_id is distinct from current_setting('app.user_id',true) then raise exception 'New claims must be drafts' using errcode='23514';end if;
  else
   if new.requested_by_user_id is distinct from previous.requested_by_user_id then raise exception 'Claim origin is immutable' using errcode='23514';end if;
   if not ((previous.status='draft' and new.status in ('draft','verified','rejected')) or (previous.status='verified' and new.status='revoked')) then raise exception 'Invalid allowance transition' using errcode='23514';end if;
   if new.status<>'draft' then
    if row(new.child_revision_id,new.employment_revision_id,new.allowance_type,new.starts_on,new.ends_on,new.authority,new.canton,new.decision_reference,new.monthly_amount,new.currency) is distinct from row(previous.child_revision_id,previous.employment_revision_id,previous.allowance_type,previous.starts_on,previous.ends_on,previous.authority,previous.canton,previous.decision_reference,previous.monthly_amount,previous.currency) then raise exception 'Review may not change claim inputs' using errcode='23514';end if;
    if new.reviewed_by_user_id is distinct from current_setting('app.user_id',true) or new.reviewed_at is null or new.reviewed_at>now() or new.reviewed_by_user_id=new.requested_by_user_id or (new.status in ('verified','rejected') and new.reviewed_by_user_id=previous.created_by_user_id) then raise exception 'Independent claim review required' using errcode='42501';end if;
   end if;
  end if;
  if new.status in ('draft','verified') then
   select * into child from employee_children where organization_id=new.organization_id and employee_id=new.employee_id and id=new.child_revision_id and is_current and active;
   select * into employment from employee_employment_periods where organization_id=new.organization_id and employee_id=new.employee_id and id=new.employment_revision_id and is_current;
   if child.id is null or employment.id is null or new.starts_on<greatest(child.birth_date,employment.starts_on) or (employment.ends_on is not null and new.ends_on>employment.ends_on) then raise exception 'Current child and employment revisions with matching dates required' using errcode='23514';end if;
   if new.status='verified' and exists(select 1 from employee_allowance_claims c join employee_children ch on ch.organization_id=c.organization_id and ch.employee_id=c.employee_id and ch.id=c.child_revision_id where c.organization_id=new.organization_id and c.employee_id=new.employee_id and c.is_current and c.status='verified' and ch.child_id=child.child_id and daterange(c.starts_on,c.ends_on,'[]')&&daterange(new.starts_on,new.ends_on,'[]')) then raise exception 'Verified child allowance periods overlap' using errcode='23514';end if;
  end if;
 end if;return new;
end $$;
create trigger employee_allowance_revision before insert or update on employee_allowance_claims for each row execute function protect_employee_allowance_revision();
