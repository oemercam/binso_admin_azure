-- Refresh synthetic document presentation only. Keep IDs, amounts and relations.
-- Existing customer organizations and customized demo company fields are untouched.
do $$
declare tenant record; original_scope text:=current_setting('app.organization_id',true);
begin
  for tenant in select id from organizations where is_demo=true loop
    perform set_config('app.organization_id',tenant.id::text,true);
    update organizations set
      name=case when name in ('Binso One Demo','Binso Demo AG') then 'Alpenblick Digital AG' else name end,
      legal_name=case when legal_name='Binso Demo AG' or (coalesce(legal_name,'')='' and name in ('Binso One Demo','Binso Demo AG')) then 'Alpenblick Digital AG' else legal_name end,
      updated_at=now()
    where id=tenant.id and is_demo=true;
    update organizations set street='Seefeldstrasse',building_number='73',postal_code='8008',city='Zürich'
    where id=tenant.id and is_demo=true and street='Musterstrasse' and city='Musterstadt';

    update invoices i set invoice_no=regexp_replace(i.invoice_no,'^DEMO-',''),updated_at=now()
    where i.organization_id=tenant.id and i.invoice_no like 'DEMO-%'
      and not exists(select 1 from invoices other where other.organization_id=i.organization_id
        and other.invoice_no=regexp_replace(i.invoice_no,'^DEMO-','') and other.id<>i.id);
    update quotes q set quote_no=regexp_replace(q.quote_no,'^DEMO-',''),updated_at=now()
    where q.organization_id=tenant.id and q.quote_no like 'DEMO-%'
      and not exists(select 1 from quotes other where other.organization_id=q.organization_id
        and other.quote_no=regexp_replace(q.quote_no,'^DEMO-','') and other.id<>q.id);
  end loop;
  perform set_config('app.organization_id',coalesce(original_scope,''),true);
end $$;
