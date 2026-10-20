-- No backfill/rewrite of approved history. Normal approvals require an earlier
-- submit transaction; setting submitted_at and approved together is not enough.
create function guard_submitted_time_review() returns trigger language plpgsql
set search_path=pg_catalog,public as $$
begin
 if tg_op='INSERT' then
  if new.approved and app_workforce_role()<>'demo_template'
   -- Trusted isolated QA copies approved historical fixture rows. The target
   -- must already be marked demo in the database; live tenants never qualify.
   and not exists(select 1 from organizations where id=new.organization_id and is_demo)
   and not (new.created_by_user_id=current_setting('app.user_id',true) and app_is_solo_owner())
   and not exists(select 1 from pg_roles where rolname=current_user and (rolsuper or rolbypassrls))
  then raise exception 'Independent submitted time review required' using errcode='42501'; end if;
 elsif new.approved and not old.approved and old.submitted_at is null
  and app_workforce_role()<>'demo_template'
  and not (new.created_by_user_id=current_setting('app.user_id',true) and app_is_solo_owner()) then
  raise exception 'Time must be submitted before approval' using errcode='42501';
 end if;
 return new;
end $$;
create trigger submitted_time_review before insert or update of approved on time_entries
 for each row execute function guard_submitted_time_review();
