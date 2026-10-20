-- Read-only production preflight, to be run only with separately authorized
-- access. No emails, names, membership deletion or automatic remediation.
begin read only;
-- Fail rather than returning policy-filtered false zero counts. No RLS bypass.
set local row_security=off;
select count(*) as ambiguous_active_identities from (
 select user_id from public.organization_memberships where status='active'
 group by user_id having count(*)>1
) identities;
select count(*) as foreign_pending_invitations from public.organization_invitations i
join public.app_users u on lower(u.email)=lower(i.email)
where i.status='pending' and i.expires_at>now() and exists(
 select 1 from public.organization_memberships m where m.user_id=u.id and m.organization_id<>i.organization_id
);
select count(*) as active_companies_without_owner from public.organizations o
where o.status in ('active','trial','grace_period') and not o.is_demo and not exists(
 select 1 from public.organization_memberships m where m.organization_id=o.id and m.role='owner' and m.status='active'
);
rollback;

-- Old provider checkout URLs are an unresolved rollout dependency. Count only;
-- never expire a checkout or alter an existing subscription from this preflight.
begin read only;
-- Fail rather than returning policy-filtered false zero counts. No RLS bypass.
set local row_security=off;
select count(*) as existing_checkouts_during_free_trial
from public.billing_checkout_sessions b join public.organization_subscriptions s on s.organization_id=b.organization_id
where b.expires_at>now() and s.status='trial' and (s.trial_until is null or s.trial_until>now());
rollback;
