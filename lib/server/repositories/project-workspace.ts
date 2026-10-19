import 'server-only';
import type {PoolClient} from 'pg';
import {tenantCan,ownRecordOnly} from '@/lib/permissions';
import type {SessionUser} from '@/lib/server/session';
import {ApiError} from '@/lib/server/http';
import {authorize} from '@/lib/server/rbac';
import {audit} from '@/lib/server/audit';
import {projectStatuses} from '@/lib/projects';
export async function projectWorkspace(c:PoolClient,s:SessionUser,id:string){
 authorize(s,'projects:read');
 const item=(await c.query(`select p.id,p.name,p.customer_id,p.status,p.source_quote_id,p.hours_budget,p.progress,p.start_date,p.end_date,p.notes,p.version,p.updated_at,c.name customer_name,${tenantCan(s.role,'sales:read')?'q.quote_no':'null::text'} source_offer from projects p left join customers c on c.id=p.customer_id and c.organization_id=p.organization_id left join quotes q on q.id=p.source_quote_id and q.organization_id=p.organization_id where p.organization_id=$1 and p.id::text=$2 and p.archived_at is null`,[s.organizationId,id])).rows[0];
 if(!item)throw new ApiError(404,'project_not_found','Auftrag wurde nicht gefunden.');
 const canTime=tenantCan(s.role,'time:read');
 const time=canTime?(await c.query(`select t.id,t.work_date,t.hours,t.description,t.billable,t.approved,t.invoiced_invoice_id from time_entries t where t.organization_id=$1 and t.project_id::text=$2 and t.archived_at is null and ($4::boolean=false or t.created_by_user_id=$3) order by t.work_date desc,t.created_at desc limit 100`,[s.organizationId,id,s.userId,ownRecordOnly(s.role,'zeiterfassung')])).rows:null;
 const totals=canTime?(await c.query(`select coalesce(sum(hours),0) hours,coalesce(sum(hours) filter(where invoiced_invoice_id is not null),0) invoiced_hours,count(*) entries from time_entries where organization_id=$1 and project_id::text=$2 and archived_at is null and ($4::boolean=false or created_by_user_id=$3)`,[s.organizationId,id,s.userId,ownRecordOnly(s.role,'zeiterfassung')])).rows[0]:null;
 const invoices=tenantCan(s.role,'invoices:read')?(await c.query(`select distinct i.invoice_no number,i.status,i.currency,i.total_amount from invoices i where i.organization_id=$1 and i.archived_at is null and (i.project_id::text=$2 or exists(select 1 from time_entries t where t.organization_id=i.organization_id and t.project_id::text=$2 and t.invoiced_invoice_id=i.id and t.archived_at is null)) order by i.invoice_no desc limit 100`,[s.organizationId,id])).rows:null;
 return {item,time,totals,invoices};
}
export async function updateProject(c:PoolClient,s:SessionUser,id:string,body:Record<string,unknown>){
 authorize(s,'projects:write');
 const name=typeof body.name==='string'?body.name.trim():'';
 const status=typeof body.status==='string'?body.status:'';
 const notes=typeof body.notes==='string'?body.notes:'';
 const hoursBudget=Number(body.hoursBudget),version=Number(body.version);
 if(name.length<2||name.length>200||notes.length>10000||!projectStatuses.includes(status as typeof projectStatuses[number])||!Number.isFinite(hoursBudget)||hoursBudget<0||hoursBudget>1000000||!Number.isInteger(version)||version<1)throw new ApiError(400,'invalid_project','Bitte die Auftragangaben prüfen.');
 const locked=(await c.query('select id,version,status from projects where organization_id=$1 and id::text=$2 and archived_at is null for update',[s.organizationId,id])).rows[0];
 if(!locked)throw new ApiError(404,'project_not_found','Auftrag wurde nicht gefunden.');
 if(Number(locked.version)!==version)throw new ApiError(409,'project_changed','Der Auftrag wurde inzwischen geändert. Bitte neu laden.');
 if(['blocked','completed','cancelled'].includes(status)&&status!==locked.status&&(await c.query("select 1 from active_time_trackers where organization_id=$1 and project_id::text=$2 and (state='running' or accumulated_seconds>0) limit 1",[s.organizationId,id])).rows.length)throw new ApiError(409,'project_timer_active','Bitte zuerst die laufenden oder pausierten Zeitmessungen diesen Auftrags abschliessen.');
 const item=(await c.query(`update projects set name=$3,status=$4,notes=$5,hours_budget=$6,version=version+1,updated_at=now() where organization_id=$1 and id::text=$2 returning id,name,status,notes,hours_budget,version`,[s.organizationId,id,name,status,notes,hoursBudget])).rows[0];
 await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'project.updated',entityType:'project',entityId:item.id,metadata:{status}});
 return item;
}
export async function listProjects(c:PoolClient,s:SessionUser,params:URLSearchParams){
 authorize(s,'projects:read');
 const q=(params.get('q')??'').trim().slice(0,200),status=params.get('status')??'';
 const limit=Number(params.get('limit')??1000),offset=Number(params.get('offset')??0);
 const order=params.get('order')??'name.asc',orders:Record<string,string>={'name.asc':'p.name asc,p.id','name.desc':'p.name desc,p.id','customer_name.asc':'c.name asc nulls last,p.id','customer_name.desc':'c.name desc nulls last,p.id','hours.asc':'hours asc,p.id','hours.desc':'hours desc,p.id','status.asc':'p.status asc,p.id','status.desc':'p.status desc,p.id'};
 if(!Number.isInteger(limit)||limit<1||limit>1000||!Number.isInteger(offset)||offset<0||offset>1000000||status&&!projectStatuses.includes(status as typeof projectStatuses[number])||!orders[order])throw new ApiError(400,'invalid_project_filter','Ungültiger Auftragfilter.');
 const where="p.organization_id=$1 and p.archived_at is null and ($2='' or p.name ilike '%'||$2||'%' or c.name ilike '%'||$2||'%') and ($3='' or p.status=$3 or $3='active' and p.status='in_progress')";
 const canTime=tenantCan(s.role,'time:read'),canInvoices=tenantCan(s.role,'invoices:read');
 const rows=(await c.query(`with input_context as(select $4::boolean own_only,$5::text actor_id) select p.id,p.name,p.customer_id,p.status,p.progress,c.name customer_name,${tenantCan(s.role,'sales:read')?'q.quote_no':'null::text'} source_offer,
 ${canTime?`coalesce((select sum(t.hours) from time_entries t where t.organization_id=p.organization_id and t.project_id=p.id and t.archived_at is null and ($4::boolean=false or t.created_by_user_id=$5)),0)`:'null::numeric'} hours,
 ${canTime?`coalesce((select sum(t.hours) from time_entries t where t.organization_id=p.organization_id and t.project_id=p.id and t.archived_at is null and t.invoiced_invoice_id is not null and ($4::boolean=false or t.created_by_user_id=$5)),0)`:'null::numeric'} invoiced_hours,
 ${canInvoices?`coalesce((select json_agg(distinct i.invoice_no) from time_entries t join invoices i on i.id=t.invoiced_invoice_id and i.organization_id=t.organization_id where t.organization_id=p.organization_id and t.project_id=p.id and t.archived_at is null),'[]'::json)`:`'[]'::json`} invoice_numbers,
 count(*) over() total_count from projects p left join customers c on c.id=p.customer_id and c.organization_id=p.organization_id left join quotes q on q.id=p.source_quote_id and q.organization_id=p.organization_id where ${where} order by ${orders[order]} limit $6 offset $7`,[s.organizationId,q,status,ownRecordOnly(s.role,'zeiterfassung'),s.userId,limit,offset])).rows;
 const total=rows.length?Number(rows[0].total_count):offset?(await c.query(`select count(*) total from projects p left join customers c on c.id=p.customer_id and c.organization_id=p.organization_id where ${where}`,[s.organizationId,q,status])).rows[0].total:0;
 return {items:rows,total:Number(total)};
}
