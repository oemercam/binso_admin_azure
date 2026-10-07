-- Enrich only the canonical synthetic template. Existing tenant data is untouched.
do $$
declare org uuid:='00000000-0000-4000-8000-000000000099'; original_scope text:=current_setting('app.organization_id',true);
begin
 perform set_config('app.organization_id',org::text,true);
 if exists(select 1 from organizations where id=org and is_demo=true) then
  update customers c set contact_name=v.contact,email=v.email,phone=v.phone,address=v.address,zip=v.zip,city=v.city,sector=v.sector
  from (values
   ('demo-customer-acme','Alex Muster','alex.muster@acme.ch','+41 31 555 10 20','Spitalgasse 24','3011','Bern','Dienstleistungen'),
   ('demo-customer-alpin','Sandra Keller','sandra.keller@alpin-systems.ch','+41 44 555 20 30','Technoparkstrasse 1','8005','Zürich','Technologie'),
   ('demo-customer-nova','Marco Weber','marco.weber@nova-digital.ch','+41 61 555 30 40','Aeschenplatz 6','4052','Basel','Kommunikation')
  ) as v(external_id,contact,email,phone,address,zip,city,sector)
  where c.organization_id=org and c.external_id=v.external_id;
  update customer_contacts cc set email=c.email,phone=c.phone,first_name=split_part(cc.name,' ',1),last_name=substring(cc.name from position(' ' in cc.name)+1)
  from customers c where cc.organization_id=org and c.organization_id=org and cc.customer_id=c.id and cc.external_id='demo-contact-1';
  insert into customer_contacts(organization_id,external_id,customer_id,name,first_name,last_name,email,phone,role_label,is_primary)
  select org,'profile-contact-'||c.external_id,c.id,c.contact_name,split_part(c.contact_name,' ',1),substring(c.contact_name from position(' ' in c.contact_name)+1),c.email,c.phone,'Geschäftsleitung',true
  from customers c where c.organization_id=org and c.external_id in ('demo-customer-alpin','demo-customer-nova') and not exists(select 1 from customer_contacts cc where cc.organization_id=org and cc.customer_id=c.id and cc.is_primary and cc.archived_at is null)
  on conflict(organization_id,external_id) do nothing;
 end if;
 perform set_config('app.organization_id',coalesce(original_scope,''),true);
end $$;
