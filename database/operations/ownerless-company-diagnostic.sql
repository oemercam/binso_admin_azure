-- Metadata only. No names, emails, credentials, business records or repairs.
begin read only;
set local row_security=off;
select o.id::text as organization_id, o.status,
       (o.id='00000000-0000-4000-8000-000000000001' and o.slug='binso' and o.name='Binso GmbH') as matches_legacy_seed_identity,
       (select count(*) from public.organization_memberships m where m.organization_id=o.id) as memberships,
       (select count(*) from public.organization_memberships m where m.organization_id=o.id and m.status='active') as active_memberships,
       (select count(*) from public.organization_memberships m where m.organization_id=o.id and m.role='owner') as owner_memberships
from public.organizations o
where o.status in ('active','trial','grace_period') and not o.is_demo
  and not exists(select 1 from public.organization_memberships m where m.organization_id=o.id and m.role='owner' and m.status='active')
order by o.id
limit 26;
rollback;
