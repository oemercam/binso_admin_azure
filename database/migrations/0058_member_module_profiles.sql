-- Additive, opt-in restriction. Existing memberships keep their standard profile.
alter table organization_memberships add column module_profile text not null default 'standard';
alter table organization_memberships add constraint membership_module_profile
 check(module_profile='standard' or module_profile='time_only' and role='member');
alter table organization_invitations add column module_profile text not null default 'standard';
alter table organization_invitations add constraint invitation_module_profile
 check(module_profile='standard' or module_profile='time_only' and role='member');

-- File contents already require an RLS-visible file_objects parent.
create function app_member_module_profile() returns text language sql stable
set search_path=pg_catalog,public as $$
 select coalesce((select module_profile from organization_memberships where organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and user_id=current_setting('app.user_id',true) and status='active'),'standard')
$$;
create policy file_module_profile_read on file_objects as restrictive for select using(
 app_member_module_profile()<>'time_only' or
 (purpose='profile_avatar' and created_by=current_setting('app.user_id',true)) or
 (purpose='time_report' and exists(select 1 from time_entries t where t.id=time_entry_id and t.organization_id=file_objects.organization_id and t.created_by_user_id=current_setting('app.user_id',true))) or
 (purpose='support_attachment' and exists(select 1 from support_cases t where t.id=support_case_id and t.organization_id=file_objects.organization_id and t.created_by_user_id=current_setting('app.user_id',true)))
);
