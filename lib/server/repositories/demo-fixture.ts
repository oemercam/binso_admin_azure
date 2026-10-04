import "server-only";
import {createHash} from 'node:crypto';
import type {PoolClient} from 'pg';
import {ApiError} from '../http';
export const demoTemplateId='00000000-0000-4000-8000-000000000099';
// Fixed canonical tables, ordered by their foreign keys. No platform or authentication records are copied.
const tables=['customers','employees','suppliers','products_services','projects','orders','contracts','quotes','quote_lines','invoices','invoice_lines','payments','expenses','time_entries','tasks','absences','payroll_runs','operating_costs','customer_contacts','supplier_invoices','accounting_entries','bank_transactions','vat_periods','business_documents','entity_notes','support_cases','support_messages','in_app_notifications','customer_activities'] as const;
export async function seedDatabaseDemo(c:PoolClient,organizationId:string,userId:string){
 const target=await c.query('select is_demo from organizations where id=$1',[organizationId]);
 if(target.rows[0]?.is_demo!==true||organizationId===demoTemplateId)throw new ApiError(403,'demo_target_invalid','Ungültiger Demo-Mandant.');
 await c.query("select set_config('app.organization_id',$1,true)",[demoTemplateId]);
 const template=await c.query('select is_demo from organizations where id=$1',[demoTemplateId]);
 if(template.rows[0]?.is_demo!==true)throw new ApiError(503,'demo_unavailable','Demo-Vorlage ist nicht verfügbar.');
 const source=new Map<string,Record<string,unknown>[]>(),ids=new Map<string,string>();
 for(const table of tables){
  const result=await c.query(table==='support_messages'?`select m.* from support_messages m join support_cases s on s.id=m.case_id where s.organization_id=$1`:`select * from ${table} where organization_id=$1`,[demoTemplateId]);
  source.set(table,result.rows);for(const row of result.rows)if(typeof row.id==='string'){const hash=createHash('sha256').update(organizationId+':'+row.id).digest('hex').slice(0,32);ids.set(row.id,[hash.slice(0,8),hash.slice(8,12),hash.slice(12,16),hash.slice(16,20),hash.slice(20)].join('-'));}
 }
 await c.query("select set_config('app.organization_id',$1,true)",[organizationId]);
 await c.query("select set_config('app.user_id',$1,true)",[userId]);
 for(const table of tables){
  const metadata=await c.query("select attname from pg_attribute where attrelid=$1::regclass and attnum>0 and not attisdropped and attgenerated='' order by attnum",[table]);
  const columns=metadata.rows.map(row=>'"'+String(row.attname).replaceAll('"','""')+'"').join(',');
  for(const original of source.get(table)??[]){
   const row={...original};
   for(const [key,value] of Object.entries(row)){
    if(key==='organization_id')row[key]=organizationId;
    else if(['created_by_user_id','author_user_id','assigned_to_user_id','actor_user_id'].includes(key)&&value)row[key]=userId;
    else if(typeof value==='string'&&ids.has(value))row[key]=ids.get(value);
   }
   if(table==='support_cases')row.case_number=String(original.case_number)+'-'+organizationId;
   if(table==='employees')row.email=(original===(source.get(table)??[])[0]?userId:String(row.id))+'@example.invalid';
   await c.query(`insert into ${table}(${columns}) select ${columns} from jsonb_populate_record(null::${table},$1::jsonb) on conflict(id) do nothing`,[JSON.stringify(row)]);
  }
 }
 await c.query(`insert into business_document_counters(organization_id,kind,period,next_value) values($1,'customer','',1) on conflict do nothing`,[organizationId]);
}
