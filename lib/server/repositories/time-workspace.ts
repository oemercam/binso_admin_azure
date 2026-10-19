import 'server-only';
import type {PoolClient} from 'pg';
import type {SessionUser} from '../session';
import {ApiError} from '../http';
import {ownRecordOnly,tenantCan} from '@/lib/permissions';
import {validBusinessDay} from '@/lib/statistics-period';

/** Call within the caller's tenant-scoped repeatable-read transaction. */
export async function timeWorkspace(c:PoolClient,s:SessionUser,params:URLSearchParams){
 if(!tenantCan(s.role,'time:read'))throw new ApiError(403,'forbidden','Keine Berechtigung für Arbeitszeiten.');
 const limit=Number(params.get('limit')??1000),offset=Number(params.get('offset')??0);
 const from=params.get('from')??'',to=params.get('to')??'',query=(params.get('q')??'').trim();
 const status=params.get('status')??'all';
 const statuses:Record<string,string>={all:'true',invoiced:'t.invoiced_invoice_id is not null',approved:'t.billable and t.approved and t.invoiced_invoice_id is null',draft:'t.billable and not t.approved and t.submitted_at is null and t.invoiced_invoice_id is null',submitted:'t.billable and not t.approved and t.submitted_at is not null and t.invoiced_invoice_id is null',unapproved:'t.billable and not t.approved and t.invoiced_invoice_id is null',internal:'not t.billable'};
 if(!Number.isInteger(limit)||limit<1||limit>1000||!Number.isInteger(offset)||offset<0||offset>1000000||query.length>200||from&&!validBusinessDay(from)||to&&!validBusinessDay(to)||from&&to&&from>to||!Object.hasOwn(statuses,status))throw new ApiError(400,'invalid_time_filter','Bitte Suchtext, Zeitraum und Listenseite prüfen.');
 for(const key of ['own','internal','review'])if(params.has(key)&&params.get(key)!=='1')throw new ApiError(400,'invalid_time_filter','Ungültiger Zeitfilter.');
 const review=params.get('review')==='1';
 if(review&&(!tenantCan(s.role,'time:write')||!['owner','admin','project_manager','manager'].includes(s.role)))throw new ApiError(403,'approval_forbidden','Keine Berechtigung für Freigaben.');
 const values:unknown[]=[s.organizationId,s.userId,ownRecordOnly(s.role,'zeiterfassung')||params.get('own')==='1'];
 const where=['t.organization_id=$1','t.archived_at is null','($3::boolean=false or t.created_by_user_id=$2)',statuses[status]];
 const bind=(value:unknown)=>{values.push(value);return '$'+values.length};
 for(const [key,column] of [['employeeId','t.employee_id'],['customerId','t.customer_id'],['projectId','t.project_id']] as const){const value=params.get(key);if(value)where.push(column+'::text='+bind(value))}
 if(from)where.push('t.work_date>='+bind(from)+'::date');if(to)where.push('t.work_date<='+bind(to)+'::date');
 if(review)where.push('t.created_by_user_id<>$2 and t.submitted_at is not null and t.billable and not t.approved and t.invoiced_invoice_id is null');
 if(params.get('internal')==='1')where.push('t.customer_id is null and not t.billable');
 if(params.get('projectLabel'))where.push('coalesce(p.name,t.project_label,t.description)='+bind(params.get('projectLabel')));
 if(query)where.push("concat_ws(' ',c.name,coalesce(p.name,t.project_label),coalesce(nullif(concat_ws(' ',e.first_name,e.last_name),''),t.person_name),t.description) ilike "+bind('%'+query.replace(/[\\%_]/g,'\\$&')+'%'));
 const joins='from time_entries t left join projects p on p.id=t.project_id and p.organization_id=t.organization_id left join customers c on c.id=t.customer_id and c.organization_id=t.organization_id left join employees e on e.id=t.employee_id and e.organization_id=t.organization_id where '+where.join(' and ');
 const totals=(await c.query('select count(*)::int total,coalesce(sum(round(t.hours*60)),0) total_minutes '+joins,values)).rows[0];
 const pageValues=[...values,limit,offset];
 const items=(await c.query(`select t.id,coalesce(p.name,t.project_label,t.description) project_name,t.description,t.employee_id,t.customer_id,t.project_id,
 t.work_date::text started_at,round(t.hours*60) duration_minutes,t.hours,t.billable,t.approved,t.submitted_at,t.invoiced_invoice_id,t.sales_rate,t.report_month,t.review_note,t.created_by_user_id,t.created_at,
 c.name customer_name,coalesce(nullif(concat_ws(' ',e.first_name,e.last_name),''),t.person_name) employee_name
 ${joins} order by t.work_date desc,t.created_at desc,t.id desc limit $${values.length+1} offset $${values.length+2}`,pageValues)).rows;
 return {items,total:Number(totals.total),total_minutes:Number(totals.total_minutes)};
}
