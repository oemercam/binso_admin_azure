alter table file_objects add column contract_id uuid;
alter table file_objects add constraint file_contract_tenant_fk foreign key(organization_id,contract_id) references contracts(organization_id,id);
alter table file_objects add constraint file_contract_owner check((purpose='contract_document')=(contract_id is not null) and (contract_id is null or num_nonnulls(expense_id,support_case_id,employee_id,customer_id,invoice_id,quote_id,project_id,time_entry_id,supplier_invoice_id)=0));
create index file_contract_lookup on file_objects(organization_id,contract_id) where contract_id is not null;
create policy contract_file_read on file_objects as restrictive for select using(purpose<>'contract_document' or exists(select 1 from contracts c where c.organization_id=file_objects.organization_id and c.id=contract_id and app_commercial_access(c.customer_id,c.supplier_id,c.project_id)));
do $$ declare previous text;begin
 select pg_get_expr(polqual,polrelid) into strict previous from pg_policy where polrelid='file_objects'::regclass and polname='file_workforce_scope';
 execute 'alter policy file_workforce_scope on file_objects using (('||previous||') or (purpose=''contract_document'' and exists(select 1 from contracts c where c.organization_id=file_objects.organization_id and c.id=contract_id and app_commercial_access(c.customer_id,c.supplier_id,c.project_id))))';
end $$;
create policy contract_file_no_delete on file_objects as restrictive for delete using(purpose<>'contract_document');
-- Stored byte operations require the same visible owner; contract bytes are immutable.
create policy file_content_owner_insert on file_contents as restrictive for insert with check(exists(select 1 from file_objects f where f.organization_id=file_contents.organization_id and f.id=file_id));
create policy contract_content_no_update on file_contents as restrictive for update using(exists(select 1 from file_objects f where f.organization_id=file_contents.organization_id and f.id=file_id and f.purpose<>'contract_document')) with check(exists(select 1 from file_objects f where f.organization_id=file_contents.organization_id and f.id=file_id and f.purpose<>'contract_document'));
create policy contract_content_no_delete on file_contents as restrictive for delete using(exists(select 1 from file_objects f where f.organization_id=file_contents.organization_id and f.id=file_id and f.purpose<>'contract_document'));
create policy file_upload_replay_scope on business_idempotency_keys as restrictive for all using(operation<>'file-upload' or exists(select 1 from file_objects f where f.organization_id=business_idempotency_keys.organization_id and f.id::text=response_json->>'id')) with check(operation<>'file-upload' or exists(select 1 from file_objects f where f.organization_id=business_idempotency_keys.organization_id and f.id::text=response_json->>'id'));
create table contract_review_snapshots(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null,contract_id uuid not null,
 contract_version integer not null check(contract_version>0),document_manifest text not null check(document_manifest~'^[0-9a-f]{64}$'),
 documents jsonb not null check(jsonb_typeof(documents)='array'),reviewed_by_user_id text not null,reviewed_at timestamptz not null default now(),
 foreign key(organization_id,contract_id) references contracts(organization_id,id),unique(organization_id,contract_id,contract_version)
);
alter table contract_review_snapshots enable row level security;
alter table contract_review_snapshots force row level security;
create policy contract_review_snapshot_read on contract_review_snapshots for select using(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and exists(select 1 from contracts c where c.organization_id=contract_review_snapshots.organization_id and c.id=contract_id and app_commercial_access(c.customer_id,c.supplier_id,c.project_id)));
create policy contract_review_snapshot_insert on contract_review_snapshots for insert with check(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and reviewed_by_user_id=current_setting('app.user_id',true) and exists(select 1 from contracts c where c.organization_id=contract_review_snapshots.organization_id and c.id=contract_id and app_commercial_access(c.customer_id,c.supplier_id,c.project_id,true)));
create function contract_document_manifest(p_contract uuid) returns text language sql stable set search_path=pg_catalog,public as $$
 select encode(digest(coalesce(string_agg(f.id::text||':'||f.sha256||':'||f.scan_status,E'\n' order by f.id),''),'sha256'),'hex') from file_objects f where f.organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and f.contract_id=p_contract and f.purpose='contract_document' and f.archived_at is null
$$;
create function protect_contract_file() returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare parent contracts%rowtype;
begin
 if tg_op='UPDATE' and (old.purpose='contract_document' or new.purpose='contract_document') and (to_jsonb(new)-'scan_status'-'scan_evidence'-'archived_at'-'archived_by_user_id'-'updated_at') is distinct from (to_jsonb(old)-'scan_status'-'scan_evidence'-'archived_at'-'archived_by_user_id'-'updated_at') then raise exception 'Contract file identity and bytes metadata are immutable' using errcode='23514';end if;
 if new.purpose='contract_document' and (tg_op='INSERT' or row(new.archived_at,new.archived_by_user_id) is distinct from row(old.archived_at,old.archived_by_user_id)) then
  select * into parent from contracts where organization_id=new.organization_id and id=new.contract_id and is_v26_contract and archived_at is null for update;
  if parent.id is null or parent.status not in ('draft','paused') or not app_commercial_access(parent.customer_id,parent.supplier_id,parent.project_id,true) then raise exception 'Contract document editing is locked' using errcode='42501';end if;
  if tg_op='INSERT' and new.created_by is distinct from current_setting('app.user_id',true) then raise exception 'Contract document creator mismatch' using errcode='42501';end if;
  if not exists(select 1 from auth_sessions a where a.id::text=current_setting('app.contract_review_session',true) and a.organization_id=new.organization_id and a.user_id=current_setting('app.user_id',true) and a.expires_at>now() and a.step_up_at>now()-interval '5 minutes' and a.step_up_at<=now()) then raise exception 'Fresh contract file proof required' using errcode='42501';end if;
  if tg_op='UPDATE' and (old.archived_at is not null or new.archived_at is null or new.archived_by_user_id is distinct from current_setting('app.user_id',true) or exists(select 1 from contract_review_snapshots r where r.organization_id=new.organization_id and r.contract_id=new.contract_id and r.documents@>jsonb_build_array(jsonb_build_object('fileId',new.id::text)))) then raise exception 'Reviewed contract documents must be retained' using errcode='23514';end if;
 end if;return new;
end $$;
create trigger contract_file_guard before insert or update on file_objects for each row execute function protect_contract_file();
create function bump_contract_document_version() returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 if new.purpose='contract_document' and (tg_op='INSERT' or new.archived_at is distinct from old.archived_at) then update contracts set updated_at=now() where organization_id=new.organization_id and id=new.contract_id;end if;return new;
end $$;
create trigger contract_document_version after insert or update on file_objects for each row execute function bump_contract_document_version();
create function validate_contract_file_bytes() returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare f file_objects%rowtype;
begin
 select * into f from file_objects where organization_id=new.organization_id and id=new.file_id;
 if f.purpose='contract_document' and (encode(digest(new.body,'sha256'),'hex') is distinct from f.sha256 or octet_length(new.body)<>f.size_bytes) then raise exception 'Contract file bytes do not match their immutable hash' using errcode='23514';end if;return new;
end $$;
create trigger contract_file_bytes before insert on file_contents for each row execute function validate_contract_file_bytes();
create function protect_contract_review_snapshot() returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare parent contracts%rowtype;actual jsonb;
begin
 select * into parent from contracts where organization_id=new.organization_id and id=new.contract_id for update;
 if parent.status is distinct from 'active' or parent.version is distinct from new.contract_version or parent.reviewed_by_user_id is distinct from new.reviewed_by_user_id or parent.reviewed_at is distinct from new.reviewed_at or current_setting('app.contract_document_manifest',true) is distinct from new.document_manifest or new.document_manifest is distinct from contract_document_manifest(new.contract_id) then raise exception 'Contract review snapshot does not match released version' using errcode='23514';end if;
 if not exists(select 1 from auth_sessions a where a.id::text=current_setting('app.contract_review_session',true) and a.organization_id=new.organization_id and a.user_id=current_setting('app.user_id',true) and a.expires_at>now() and a.step_up_at>now()-interval '5 minutes' and a.step_up_at<=now()) then raise exception 'Fresh contract snapshot proof required' using errcode='42501';end if;
 select coalesce(jsonb_agg(jsonb_build_object('fileId',id::text,'sha256',sha256) order by id),'[]'::jsonb) into actual from file_objects where organization_id=new.organization_id and contract_id=new.contract_id and purpose='contract_document' and archived_at is null;
 if actual is distinct from new.documents or exists(select 1 from file_objects where organization_id=new.organization_id and contract_id=new.contract_id and purpose='contract_document' and archived_at is null and scan_status<>'clean') then raise exception 'Contract review documents are changed or quarantined' using errcode='23514';end if;return new;
end $$;
create trigger contract_review_snapshot_guard before insert on contract_review_snapshots for each row execute function protect_contract_review_snapshot();
create function require_contract_document_review() returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 if not new.is_v26_contract then return new;end if;
 if tg_op='UPDATE' then
  if new.status='active' and old.status<>'active' then
   if nullif(current_setting('app.contract_document_manifest',true),'') is distinct from contract_document_manifest(new.id) or exists(select 1 from file_objects where organization_id=new.organization_id and contract_id=new.id and purpose='contract_document' and archived_at is null and scan_status<>'clean') then raise exception 'Current clean document manifest required' using errcode='23514';end if;
  end if;
 end if;return new;
end $$;
create trigger contract_document_review_guard before insert or update on contracts for each row execute function require_contract_document_review();
create function require_contract_review_snapshot() returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 if new.is_v26_contract and new.status='active' and old.status<>'active' and not exists(select 1 from contract_review_snapshots r where r.organization_id=new.organization_id and r.contract_id=new.id and r.contract_version=new.version) then raise exception 'Released contract requires its immutable review snapshot' using errcode='23514';end if;return new;
end $$;
create constraint trigger contract_review_snapshot_required after update on contracts deferrable initially deferred for each row execute function require_contract_review_snapshot();
do $$ begin if exists(select 1 from pg_roles where rolname='binso_runtime') then grant select,insert on contract_review_snapshots to binso_runtime;end if;end $$;
