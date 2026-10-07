import "server-only";
import {createHash} from 'node:crypto';
import type {PoolClient} from 'pg';
import {ApiError} from '../http';
export const demoTemplateId='00000000-0000-4000-8000-000000000099';
// Fixed canonical tables, ordered by their foreign keys. No platform or authentication records are copied.
const tables=['customers','employees','suppliers','products_services','quotes','quote_lines','projects','orders','contracts','invoices','invoice_lines','payments','expenses','time_entries','tasks','absences','payroll_runs','operating_costs','customer_contacts','supplier_invoices','accounting_entries','bank_transactions','vat_periods','business_documents','entity_notes','support_cases','support_messages','in_app_notifications','customer_activities'] as const;
export async function seedDatabaseDemo(c:PoolClient,organizationId:string,userId:string){
 const target=await c.query('select is_demo from organizations where id=$1',[organizationId]);
 if(target.rows[0]?.is_demo!==true||organizationId===demoTemplateId)throw new ApiError(403,'demo_target_invalid','Ungültiger Demo-Mandant.');
 await c.query("select set_config('app.organization_id',$1,true)",[demoTemplateId]);
 const template=await c.query('select is_demo,legal_name,invoice_intro_text,invoice_footer_text,quote_intro_text,quote_footer_text,street,building_number,postal_code,city,country_code,iban,qr_iban from organizations where id=$1',[demoTemplateId]);
 if(template.rows[0]?.is_demo!==true)throw new ApiError(503,'demo_unavailable','Demo-Vorlage ist nicht verfügbar.');
 const source=new Map<string,Record<string,unknown>[]>(),ids=new Map<string,string>();
 for(const table of tables){
  const result=await c.query(table==='support_messages'?`select m.* from support_messages m join support_cases s on s.id=m.case_id where s.organization_id=$1`:`select * from ${table} where organization_id=$1`,[demoTemplateId]);
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
   if(table==='employees')row.email=String(original.name??'mitarbeiter').toLowerCase().replace(/[^a-z]+/g,'.')+'.'+organizationId.slice(0,8)+'@alpenblick-digital.ch';
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
 await c.query(`insert into business_document_counters(organization_id,kind,period,next_value) values($1,'customer','',1) on conflict do nothing`,[organizationId]);
}
