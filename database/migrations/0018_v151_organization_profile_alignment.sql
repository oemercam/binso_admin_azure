-- Binso One v1.5.1 - align organization profile/runtime queries with the canonical schema.
-- Applied as a forward-only repair. Do not modify previously applied migrations.

alter table company_profile add column if not exists uid text;
alter table company_profile add column if not exists industry text;
alter table company_profile add column if not exists employee_range text;
alter table company_profile add column if not exists settings jsonb not null default '{}'::jsonb;

create unique index if not exists uq_company_profile_org on company_profile(organization_id);

-- Preserve a profile row for every existing organization. Required fields receive
-- neutral values and can be completed through onboarding/settings later.
insert into company_profile(organization_id,name,address,zip,city,country,email,phone,uid,iban,bank_name,website,industry,employee_range,settings)
select o.id,o.name,'','','',coalesce(nullif(o.country,''),'Schweiz'),'','','','','','',null,null,'{}'::jsonb
from organizations o
where not exists (select 1 from company_profile p where p.organization_id=o.id);
