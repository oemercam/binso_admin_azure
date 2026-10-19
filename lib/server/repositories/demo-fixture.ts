import "server-only";
import {createHash} from 'node:crypto';
import type {PoolClient} from 'pg';
import {ApiError} from '../http';
export const demoTemplateId='00000000-0000-4000-8000-000000000099';
// Fixed canonical tables, ordered by their foreign keys. No platform or authentication records are copied.
const tables=['customers','employees','suppliers','products_services','quotes','quote_lines','projects','orders','contracts','invoices','invoice_lines','payments','credit_notes','invoice_refunds','expenses','time_entries','tasks','absences','payroll_runs','operating_costs','customer_contacts','supplier_invoices','accounting_entries','bank_transactions','vat_periods','business_documents','entity_notes','support_cases','support_messages','in_app_notifications','customer_activities'] as const;
export async function seedDatabaseDemo(c:PoolClient,organizationId:string,userId:string,userEmail?:string){
 const target=await c.query('select is_demo from organizations where id=$1',[organizationId]);
 if(target.rows[0]?.is_demo!==true||organizationId===demoTemplateId)throw new ApiError(403,'demo_target_invalid','Ungültiger Demo-Mandant.');
 await c.query("select set_config('app.organization_id',$1,true)",[demoTemplateId]);
 const template=await c.query('select is_demo,legal_name,invoice_intro_text,invoice_footer_text,quote_intro_text,quote_footer_text,street,building_number,postal_code,city,country_code,iban,qr_iban from organizations where id=$1',[demoTemplateId]);
 if(template.rows[0]?.is_demo!==true)throw new ApiError(503,'demo_unavailable','Demo-Vorlage ist nicht verfügbar.');
 const source=new Map<string,Record<string,unknown>[]>(),ids=new Map<string,string>();
 for(const table of tables){
  const result=await c.query(table==='support_messages'?`select m.* from support_messages m join support_cases s on s.id=m.case_id where s.organization_id=$1`:`select * from ${table} where organization_id=$1 order by id`,[demoTemplateId]);
  source.set(table,result.rows);for(const row of result.rows)if(typeof row.id==='string'){const hash=createHash('sha256').update(organizationId+':'+row.id).digest('hex').slice(0,32);ids.set(row.id,[hash.slice(0,8),hash.slice(8,12),hash.slice(12,16),hash.slice(16,20),hash.slice(20)].join('-'));}
 }
 await c.query("select set_config('app.organization_id',$1,true)",[organizationId]);
 await c.query("select set_config('app.user_id',$1,true)",[userId]);
 const company=template.rows[0];
 await c.query("update organizations set street=$2,building_number=$3,postal_code=$4,city=$5,country_code=$6,iban=$7,qr_iban=$8,legal_name=$9,invoice_intro_text=$10,invoice_footer_text=$11,quote_intro_text=$12,quote_footer_text=$13 where id=$1 and is_demo=true and coalesce(street,'')='' and coalesce(iban,'')=''",[organizationId,company.street,company.building_number,company.postal_code,company.city,company.country_code,company.iban,company.qr_iban,company.legal_name,company.invoice_intro_text,company.invoice_footer_text,company.quote_intro_text,company.quote_footer_text]);
 const metadata=await c.query("select relname,attname from pg_attribute a join pg_class t on t.oid=a.attrelid join pg_namespace n on n.oid=t.relnamespace where n.nspname='public' and t.relname=any($1::text[]) and a.attnum>0 and not a.attisdropped and a.attgenerated='' order by t.relname,a.attnum",[[...tables]]);
 for(const table of tables){
  const columns=metadata.rows.filter(row=>row.relname===table).map(row=>'"'+String(row.attname).replaceAll('"','""')+'"').join(',');
  const records=[];
  for(const original of source.get(table)??[]){
   const row={...original};
   for(const [key,value] of Object.entries(row)){
    if(key==='organization_id')row[key]=organizationId;
    else if(['created_by_user_id','author_user_id','assigned_to_user_id','actor_user_id'].includes(key)&&value)row[key]=userId;
    else if(typeof value==='string'&&ids.has(value))row[key]=ids.get(value);
   }
   if(table==='support_cases')row.case_number=String(original.case_number)+'-'+organizationId;
   if(table==='employees')row.user_id=original===(source.get(table)??[])[0]?userId:null;
   if(table==='employees')row.email=original===(source.get(table)??[])[0]&&userEmail?userEmail:String(original.name??'mitarbeiter').toLowerCase().replace(/[^a-z]+/g,'.')+'.'+organizationId.slice(0,8)+'@demo.example.invalid';
   records.push(row);
  }
  if(records.length)await c.query(`insert into ${table}(${columns}) select ${columns} from jsonb_populate_recordset(null::${table},$1::jsonb) on conflict(id) do nothing`,[JSON.stringify(records)]);
 }
 for(const [table,foreign] of [['invoice_line_time_entries','time_entry_id'],['invoice_line_expenses','expense_id']] as const){
  await c.query("select set_config('app.organization_id',$1,true)",[demoTemplateId]);
  const links=(await c.query(`select invoice_line_id,${foreign} from ${table} where organization_id=$1`,[demoTemplateId])).rows;
  await c.query("select set_config('app.organization_id',$1,true)",[organizationId]);
  for(const link of links)await c.query(`insert into ${table}(organization_id,invoice_line_id,${foreign}) values($1,$2,$3) on conflict do nothing`,[organizationId,ids.get(link.invoice_line_id),ids.get(link[foreign])]);
 }
 await seedDemoScenarios(c,organizationId,userId);
 await c.query(`insert into business_document_counters(organization_id,kind,period,next_value) values($1,'customer','',1) on conflict do nothing`,[organizationId]);
}


/** Versioned additive scenarios for a private writable demo only. IDs are stable
 * within tenant/month. Never executes mail, billing, webhooks or production DDL. */
export async function seedDemoScenarios(c:PoolClient,organizationId:string,userId:string){
 const target=await c.query('select is_demo from organizations where id=$1 for update',[organizationId]);
 if(target.rows[0]?.is_demo!==true||organizationId===demoTemplateId)throw new ApiError(403,'demo_target_invalid','Ungültiger Demo-Mandant.');
 const customer=(await c.query("select id from customers where organization_id=$1 and archived_at is null and status='active' order by id limit 1",[organizationId])).rows[0];
 if(!customer)throw new ApiError(503,'demo_unavailable','Demo-Kundendaten fehlen.');
 const today=String((await c.query("select (now() at time zone 'Europe/Zurich')::date::text as as_of")).rows[0].as_of);
 const [year,month]=today.split('-').map(Number);
 const date=(offset:number,day=1)=>new Date(Date.UTC(year,month-1+offset,day)).toISOString().slice(0,10);
 const id=(key:string)=>{const hash=createHash('sha256').update('v24:'+organizationId+':'+key).digest('hex').slice(0,32);return [hash.slice(0,8),hash.slice(8,12),hash.slice(12,16),hash.slice(16,20),hash.slice(20)].join('-')};
 const projectId=id('loss-project');
 await c.query(`insert into projects(id,organization_id,external_id,customer_id,name,budget,hours_budget,progress,start_date,status,created_by_user_id,notes)
 values($1,$2,'v24-loss-project',$3,'Demo: Projekt mit Budgetüberschreitung',1000,8,80,$4,'blocked',$5,'Synthetisch: Aufwand und Spesen übersteigen das Budget.') on conflict(id) do nothing`,[projectId,organizationId,customer.id,date(-12),userId]);
 for(let index=0;index<12;index++){
  const offset=index-12,day=date(offset),period=day.slice(0,7),net=9000-index*500;
  const vat=Math.round(net*100*81/1000)/100,total=Math.round((net+vat)*100)/100;
  for(const scenario of ['paid','partial','overdue'] as const){
   const key=period+'-'+scenario,invoiceId=id('invoice-'+key),paid=scenario==='paid'?total:scenario==='partial'?Math.round(total*0.25*100)/100:0;
   await c.query(`insert into invoices(id,organization_id,external_id,invoice_no,customer_id,project_id,issue_date,due_date,status,subtotal,vat_amount,total_amount,paid_amount)
    values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) on conflict(id) do nothing`,[invoiceId,organizationId,'v24-invoice-'+key,'V24-RE-'+key.toUpperCase(),customer.id,projectId,day,date(offset,15),scenario,net,vat,total,paid]);
   await c.query(`insert into invoice_lines(id,organization_id,external_id,invoice_id,sort_order,description,quantity,unit,unit_price,vat_rate)
    values($1,$2,$3,$4,1,'Demo: IT-Dienstleistungen',1,'Pauschal',$5,8.1) on conflict(id) do nothing`,[id('line-'+key),organizationId,'v24-line-'+key,invoiceId,net]);
   if(paid>0)await c.query(`insert into payments(id,organization_id,external_id,invoice_id,payment_date,amount,method,allocation_status)
    values($1,$2,$3,$4,$5,$6,'bank','matched') on conflict(id) do nothing`,[id('payment-'+key),organizationId,'v24-payment-'+key,invoiceId,date(offset,10),paid]);
  }
  const costs=[3,7,11].includes(index)?100000:Math.round(total*0.2*100)/100;
  await c.query(`insert into expenses(id,organization_id,external_id,customer_id,project_id,expense_date,description,category,quantity,unit_price,billable,status,reimbursed_at,reimbursement_reference,reimbursed_by_user_id,created_by_user_id)
   values($1,$2,$3,$4,$5,$6,$7,'material',1,$8,false,'approved',$6::date::timestamp at time zone 'Europe/Zurich',$9,$10,$10) on conflict(id) do nothing`,[id('expense-'+period),organizationId,'v24-expense-'+period,customer.id,projectId,date(offset,12),costs===100000?'Demo: ausserordentliche Beschaffung / Verlustmonat':'Demo: monatliche Auslagen',costs,'V24-REIMBURSED-'+period,userId]);
  await c.query(`insert into time_entries(id,organization_id,external_id,customer_id,project_id,person_name,worker_type,work_date,hours,description,billable,approved,sales_rate,internal_cost_rate,created_by_user_id)
   values($1,$2,$3,$4,$5,'Demo Team','employee',$6,12,'Demo: Mehraufwand',true,true,100,150,$7) on conflict(id) do nothing`,[id('time-'+period),organizationId,'v24-time-'+period,customer.id,projectId,date(offset,8),userId]);
 }
 // Current open and cancelled invoices complement the overdue historical cohort.
 for(const status of ['sent','cancelled'] as const){
  const net=1000,invoiceId=id('current-'+today.slice(0,7)+'-'+status);
  const due=new Date(Date.parse(today+'T00:00:00Z')+30*86400000).toISOString().slice(0,10);
  await c.query(`insert into invoices(id,organization_id,external_id,invoice_no,customer_id,issue_date,due_date,status,subtotal,vat_amount,total_amount,paid_amount)
   values($1,$2,$3,$4,$5,$6,$7,$8,$9,81,1081,0) on conflict(id) do nothing`,[invoiceId,organizationId,'v24-current-'+today.slice(0,7)+'-'+status,'V24-RE-'+today.slice(0,7)+'-'+status.toUpperCase(),customer.id,today,due,status,net]);
  await c.query(`insert into invoice_lines(id,organization_id,external_id,invoice_id,sort_order,description,quantity,unit,unit_price,vat_rate)
   values($1,$2,$3,$4,1,'Demo: aktuelle Leistung',1,'Pauschal',1000,8.1) on conflict(id) do nothing`,[id('current-line-'+today.slice(0,7)+'-'+status),organizationId,'v24-current-line-'+today.slice(0,7)+'-'+status,invoiceId]);
 }
 for(const status of ['declined','expired'] as const){
  const quoteId=id('quote-'+status);
  await c.query(`insert into quotes(id,organization_id,external_id,quote_no,customer_id,title,issue_date,valid_until,status)
   values($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict(id) do nothing`,[quoteId,organizationId,'v24-quote-'+status,'V24-AN-'+status.toUpperCase(),customer.id,'Demo: '+status,date(-1),date(-1,15),status]);
  await c.query(`insert into quote_lines(id,organization_id,external_id,quote_id,sort_order,description,quantity,unit,unit_price,vat_rate)
   values($1,$2,$3,$4,1,'Demo: geplante Leistung',8,'Stunde',150,8.1) on conflict(id) do nothing`,[id('quote-line-'+status),organizationId,'v24-quote-line-'+status,quoteId]);
 }
 await c.query(`insert into credit_notes(id,organization_id,external_id,credit_no,invoice_id,customer_id,credit_date,amount,reason)
  values($1,$2,'v24-credit-note','V24-GS-001',$3,$4,$5,100,'Demo: Gutschrift nach Zahlung, Rückerstattung offen') on conflict(id) do nothing`,[id('credit-note'),organizationId,id('invoice-'+date(-1).slice(0,7)+'-paid'),customer.id,date(-1,20)]);
 await c.query(`insert into invoice_refunds(id,organization_id,external_id,invoice_id,customer_id,refund_date,amount,reason,created_by_user_id)
  values($1,$2,'v24-refund',$3,$4,$5,60,'Demo: erfasste Teilrückerstattung nach Gutschrift',$6) on conflict(id) do nothing`,[id('refund'),organizationId,id('invoice-'+date(-1).slice(0,7)+'-paid'),customer.id,date(-1,22),userId]);
 await c.query(`insert into document_deliveries(id,organization_id,kind,document_id,recipient,status,request_key,created_by_user_id,purpose,reminder_stage,balance_amount,payment_deadline,created_at,completed_at)
  select $1,$2,'invoice',i.id,'simulated-reminder@demo.example.invalid','sent',$3,$4,'reminder',1,i.total_amount-i.paid_amount,$5,$6::date::timestamp at time zone 'Europe/Zurich',$6::date::timestamp at time zone 'Europe/Zurich'
  from invoices i where i.organization_id=$2 and i.id=$7 on conflict(id) do nothing`,[id('reminder'),organizationId,'v24-simulated-reminder',userId,date(-1,28),date(-1,20),id('invoice-'+date(-1).slice(0,7)+'-overdue')]);
 await c.query(`insert into customers(id,organization_id,external_id,customer_no,name,email,status)
  values($1,$2,'v24-inactive-customer','V24-K-001','Demo: inaktiver Kunde','inactive@demo.example.invalid','inactive') on conflict(id) do nothing`,[id('inactive-customer'),organizationId]);
 await c.query(`insert into support_cases(id,organization_id,case_number,created_by_user_id,category,subject,status,internal_priority,created_at,updated_at)
  values($1,$2,$3,$4,'technical','Demo: lange offene Support-Anfrage','open','high',now()-interval '30 days',now()-interval '30 days') on conflict(id) do nothing`,[id('stale-ticket'),organizationId,'V24-SUP-'+organizationId,userId]);
}
