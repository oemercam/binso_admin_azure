-- Extended synthetic fixture. Every row belongs to the explicit demo organization.
select set_config('app.organization_id','00000000-0000-4000-8000-000000000099',true);
insert into customer_contacts(organization_id,external_id,customer_id,name,email,phone,role_label,is_primary)
values('00000000-0000-4000-8000-000000000099','demo-contact-1','10000000-0000-4000-8000-000000000001','Alex Muster','alex@example.invalid',null,'Projektleitung',true)
on conflict(organization_id,external_id) do nothing;
insert into suppliers(id,organization_id,external_id,supplier_no,name,email,status)
values('e0000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000099','demo-supplier-1','DEMO-L-001','Demo IT Services','supplier@example.invalid','active')
on conflict(id) do nothing;
insert into orders(organization_id,external_id,customer_id,project_id,name,billing_model,status,amount,start_date,end_date)
values('00000000-0000-4000-8000-000000000099','demo-order-1','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','Modern Workplace Rollout','time','active',48000,'2026-08-01','2026-12-15')
on conflict(organization_id,external_id) do nothing;
insert into supplier_invoices(organization_id,external_id,supplier_id,supplier_invoice_no,invoice_date,due_date,net_amount,vat_amount,total_amount,status)
values('00000000-0000-4000-8000-000000000099','demo-supplier-invoice-1','e0000000-0000-4000-8000-000000000001','DEMO-LRE-001','2026-09-01','2026-10-01',900,72.90,972.90,'paid')
on conflict(organization_id,external_id) do nothing;
insert into contracts(organization_id,external_id,contract_no,customer_id,name,start_date,end_date,status,billing_interval)
values('00000000-0000-4000-8000-000000000099','demo-contract-1','DEMO-V-001','10000000-0000-4000-8000-000000000001','IT Wartung','2026-01-01','2026-12-31','active','monthly')
on conflict(organization_id,external_id) do nothing;
insert into absences(organization_id,external_id,employee_id,absence_type,start_date,end_date,days,status)
values('00000000-0000-4000-8000-000000000099','demo-absence-1','20000000-0000-4000-8000-000000000001','vacation','2026-10-19','2026-10-23',5,'approved')
on conflict(organization_id,external_id) do nothing;
insert into accounting_entries(organization_id,external_id,entry_date,document_ref,account_no,contra_account_no,amount,status)
values('00000000-0000-4000-8000-000000000099','demo-accounting-1','2026-10-02','RE-2026-019','1020','1100',13512.50,'posted')
on conflict(organization_id,external_id) do nothing;
insert into bank_transactions(organization_id,external_id,booking_date,account_label,description,amount,status,invoice_id)
values('00000000-0000-4000-8000-000000000099','demo-bank-1','2026-10-02','Demo Bank CHF','Zahlung Acme AG',13512.50,'matched','60000000-0000-4000-8000-000000000001')
on conflict(organization_id,external_id) do nothing;
insert into vat_periods(organization_id,external_id,period,output_vat,input_vat,payable,status)
values('00000000-0000-4000-8000-000000000099','demo-vat-2026-Q3','2026-Q3',1600,420,1180,'prepared')
on conflict(organization_id,external_id) do nothing;
insert into business_documents(organization_id,external_id,name,document_type,customer_id,document_date,status)
values('00000000-0000-4000-8000-000000000099','demo-document-1','Demo Projektbeschreibung','project','10000000-0000-4000-8000-000000000001','2026-09-01','current')
on conflict(organization_id,external_id) do nothing;
insert into entity_notes(id,organization_id,entity_type,entity_external_id,note_text)
values('e0000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000099','projekte','demo-project-1','Demo: Rollout mit dem Kunden abgestimmt.')
on conflict(id) do nothing;
insert into support_cases(id,organization_id,case_number,created_by_user_id,category,subject,status,description)
values('e0000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000099','DEMO-5832','demo-readonly','question','Demo: Frage zur Rechnung','open','Wie kann ich eine Rechnung exportieren?')
on conflict(id) do nothing;
insert into support_messages(id,case_id,author_type,author_user_id,message)
values('e0000000-0000-4000-8000-000000000004','e0000000-0000-4000-8000-000000000003','customer','demo-readonly','Dies ist ein synthetischer Demo-Supportfall.')
on conflict(id) do nothing;
insert into in_app_notifications(id,organization_id,kind,title,body,href)
values('e0000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000099','system','Demo-Daten bereit','Die Demo enthält synthetische Geschäftsdaten.','/dashboard')
on conflict(id) do nothing;
insert into customer_activities(id,organization_id,external_id,customer_id,activity_type,title,detail)
values('e0000000-0000-4000-8000-000000000006','00000000-0000-4000-8000-000000000099','demo-activity-1','10000000-0000-4000-8000-000000000001','note','Demo Projektbesprechung','Rollout geplant.')
on conflict(id) do nothing;
