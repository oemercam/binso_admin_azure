-- Add synthetic examples only to the explicitly marked demo template.
-- No real tenant is selected and no existing business record is replaced.
do $$
declare org uuid:='00000000-0000-4000-8000-000000000099'; original_scope text:=current_setting('app.organization_id',true);
begin
 perform set_config('app.organization_id',org::text,true);
 if exists(select 1 from organizations where id=org and is_demo=true) then
  update employees set email=lower(replace(name,' ','.'))||'@alpenblick-digital.ch' where organization_id=org and email like '%@example.invalid';
  update time_entries t set customer_id=p.customer_id from projects p where t.organization_id=org and p.organization_id=org and t.project_id=p.id and t.customer_id is null and t.external_id in ('demo-time-1','demo-time-2');
  insert into quotes(id,organization_id,external_id,quote_no,customer_id,title,issue_date,valid_until,status,decision_at)
  values('51000000-0000-4000-8000-000000000001',org,'process-offer','AN-2026-014','10000000-0000-4000-8000-000000000001','Managed IT Services',current_date-10,current_date+20,'accepted',now()-interval '7 days') on conflict(id) do nothing;
  insert into quote_lines(id,organization_id,external_id,quote_id,sort_order,description,quantity,unit,unit_price,vat_rate)
  values('52000000-0000-4000-8000-000000000001',org,'process-offer-line','51000000-0000-4000-8000-000000000001',1,'Monatliche IT-Dienstleistungen',1,'Pauschale',8150,8.1) on conflict(id) do nothing;
  insert into projects(id,organization_id,external_id,name,customer_id,status,source_quote_id)
  values('31000000-0000-4000-8000-000000000001',org,'process-project','Managed IT Services','10000000-0000-4000-8000-000000000001','active','51000000-0000-4000-8000-000000000001') on conflict(id) do nothing;
  insert into invoices(id,organization_id,external_id,invoice_no,customer_id,issue_date,due_date,status,subtotal,vat_amount,total_amount,paid_amount)
  values
  ('61000000-0000-4000-8000-000000000001',org,'process-partial','RE-2026-021','10000000-0000-4000-8000-000000000001',current_date-10,current_date+20,'partial',2370,191.97,2561.97,1000),
  ('61000000-0000-4000-8000-000000000002',org,'process-overdue','RE-2026-022','10000000-0000-4000-8000-000000000003',current_date-38,current_date-8,'sent',1000,81,1081,0),
  ('61000000-0000-4000-8000-000000000003',org,'process-draft','RE-2026-023','10000000-0000-4000-8000-000000000001',current_date,current_date+30,'draft',8150,660.15,8810.15,0)
  on conflict(id) do nothing;
  insert into invoice_lines(id,organization_id,external_id,invoice_id,sort_order,description,quantity,unit,unit_price,vat_rate) values
  ('62000000-0000-4000-8000-000000000001',org,'process-hours','61000000-0000-4000-8000-000000000001',1,'IT-Support und Betreuung der Arbeitsplatzumgebung',12.5,'Std.',180,8.1),
  ('62000000-0000-4000-8000-000000000002',org,'process-pieces','61000000-0000-4000-8000-000000000001',2,'USB-C Adapter',2,'Stück',60,8.1),
  ('62000000-0000-4000-8000-000000000003',org,'process-overdue-line','61000000-0000-4000-8000-000000000002',1,'Sicherheitsprüfung',1,'Pauschale',1000,8.1),
  ('62000000-0000-4000-8000-000000000004',org,'process-fixed','61000000-0000-4000-8000-000000000003',1,'Monatliche IT-Dienstleistungen',1,'Pauschale',8150,8.1)
  on conflict(id) do nothing;
  insert into payments(id,organization_id,external_id,invoice_id,payer_customer_id,payment_date,amount,method,allocation_status) values
  ('71000000-0000-4000-8000-000000000001',org,'process-payment','61000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',current_date-2,1000,'bank','matched') on conflict(id) do nothing;
  insert into time_entries(id,organization_id,external_id,customer_id,project_id,project_label,person_name,worker_type,work_date,hours,description,billable,approved,sales_rate,invoiced_invoice_id) values
  ('c1000000-0000-4000-8000-000000000001',org,'process-time-invoiced','10000000-0000-4000-8000-000000000001','31000000-0000-4000-8000-000000000001','Managed IT Services','David Schmid','employee',current_date-11,12.5,'IT-Support',true,true,180,'61000000-0000-4000-8000-000000000001'),
  ('c1000000-0000-4000-8000-000000000002',org,'process-time-ready','10000000-0000-4000-8000-000000000001','31000000-0000-4000-8000-000000000001','Managed IT Services','David Schmid','employee',current_date-1,12.5,'Bereit zur Verrechnung',true,true,180,null),
  ('c1000000-0000-4000-8000-000000000003',org,'process-time-internal',null,null,'Administration','Nina Müller','employee',current_date,1.5,'Interne Administration',false,false,0,null)
  on conflict(id) do nothing;
  insert into invoice_line_time_entries(organization_id,invoice_line_id,time_entry_id) values(org,'62000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001') on conflict do nothing;
 end if;
 perform set_config('app.organization_id',coalesce(original_scope,''),true);
end $$;
