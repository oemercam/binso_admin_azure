import 'server-only';
import type {PoolClient} from 'pg';
import type {SessionUser} from '../session';
import {randomUUID} from 'node:crypto';
import {ApiError,cleanText} from '../http';
import {idempotentBusiness} from '../business-idempotency';
import {audit} from '../audit';
import {assertExternalAssignment} from './external-resources';
import {timeClassification} from '@/lib/server/time-classification';
import {validBusinessDay} from '@/lib/statistics-period';

export async function externalTimeOptions(c:PoolClient,s:SessionUser,p:URLSearchParams){
 if(!['owner','admin','project_manager','manager'].includes(s.role)||(await c.query('select app_external_time_access() allowed')).rows[0]?.allowed!==true)throw new ApiError(403,'external_time_forbidden','Keine Berechtigung für externe Zeiten.');
 const day=p.get('workDate')??'',project=p.get('projectId')??'',id=(p.get('id')??'').replace(/^eq\./,''),q=(p.get('q')??'').trim(),limit=Number(p.get('limit')??50),offset=Number(p.get('offset')??0);
 if(!validBusinessDay(day)||!project||q.length>200||!Number.isInteger(limit)||limit<1||limit>50||!Number.isInteger(offset)||offset<0||offset>100000)throw new ApiError(400,'picker_invalid','Bitte Auftrag und Datum auswählen.');
 const values:unknown[]=[s.organizationId,project,day],where=['a.organization_id=$1','a.project_id::text=$2',"a.revoked_at is null and r.active and sp.status='active' and sp.archived_at is null and p.archived_at is null and p.status in ('planned','in_progress','active')",'a.starts_on<=$3::date and (a.ends_on is null or a.ends_on>=$3::date)','a.starts_on<=current_date and (a.ends_on is null or a.ends_on>=current_date)','app_workforce_access(p.customer_id,p.id,$3::date,true)'];
 const bind=(v:unknown)=>{values.push(v);return '$'+values.length};
 if(id)where.push('a.id::text='+bind(id));if(q)where.push('r.name ilike '+bind('%'+q.replace(/[\\%_]/g,'\\$&')+'%'));
 const from=' from external_resource_assignments a join external_resources r on r.organization_id=a.organization_id and r.id=a.resource_id join suppliers sp on sp.organization_id=r.organization_id and sp.id=r.supplier_id join projects p on p.organization_id=a.organization_id and p.id=a.project_id where '+where.join(' and ');
 const total=(await c.query('select count(*)::int total'+from,values)).rows[0]?.total??0;
 const items=(await c.query('select a.id,r.name,a.resource_id,a.project_id'+from+' order by r.name,a.id limit '+bind(limit)+' offset '+bind(offset),values)).rows;
 return {items,total:Number(total)};
}

export async function createExternalTime(c:PoolClient,s:SessionUser,body:Record<string,unknown>,key:string|null){
 if(!key)throw new ApiError(400,'idempotency_required','Bitte den Speichervorgang erneut starten.');
 if(Object.keys(body).some(key=>!['externalAssignmentId','workDate','durationMinutes','description','billable','timeCategory','isWorkTime','payrollRelevant'].includes(key)))throw new ApiError(400,'external_time_fields','Diese Angaben gehören nicht zur externen Zeiterfassung.');
 if(s.moduleProfile==='time_only'||!['owner','admin','project_manager','manager'].includes(s.role)||(await c.query('select app_external_time_access(true) allowed')).rows[0]?.allowed!==true)throw new ApiError(403,'external_time_forbidden','Keine Berechtigung für externe Zeiten.');
 const minutes=body.durationMinutes,day=body.workDate,classification=timeClassification(body,true)!;
 if(typeof body.externalAssignmentId!=='string'||typeof day!=='string'||!validBusinessDay(day)||typeof minutes!=='number'||!Number.isInteger(minutes)||minutes<1||minutes>1440||typeof body.billable!=='boolean'||classification.payrollRelevant||typeof body.description!=='string'||body.description.length>2000)throw new ApiError(400,'external_time_invalid','Bitte Einsatz, Datum und volle Minuten prüfen. Externe Zeiten sind nicht lohnrelevant.');
 // Hold membership authority through capture; the database source guard serializes resource/assignment changes.
 await c.query('select id from organization_memberships where organization_id=$1 and user_id=$2 for share',[s.organizationId,s.userId]);
 return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:'time.external.create',key,body},async()=>{
  const assignment=await assertExternalAssignment(c,s,body.externalAssignmentId as string,day);
  const source=(await c.query(`select r.name,r.supplier_id,p.name project_name from external_resource_assignments a join external_resources r on r.organization_id=a.organization_id and r.id=a.resource_id join suppliers sp on sp.organization_id=r.organization_id and sp.id=r.supplier_id join projects p on p.organization_id=a.organization_id and p.id=a.project_id
   where a.organization_id=$1 and a.id=$2 and p.status in ('planned','in_progress','active')`,[s.organizationId,assignment.id])).rows[0];
  if(!source)throw new ApiError(409,'project_not_active','Für diesen Auftrag können momentan keine Zeiten erfasst werden.');
  if(body.billable&&!assignment.customer_id)throw new ApiError(400,'billable_customer_required','Verrechenbare Zeiten benötigen einen Kunden.');
  const item=(await c.query(`insert into time_entries(organization_id,external_id,project_id,customer_id,supplier_id,person_name,project_label,worker_type,work_date,hours,description,billable,approved,created_by_user_id,external_resource_id,external_assignment_id,recorded_duration_minutes,time_category,is_work_time,payroll_relevant)
   values($1,$2,$3,$4,$5,$6,$7,'external',$8,$9::numeric/60,$10,$11,false,$12,$13,$14,$9,$15,$16,false)
   returning id,external_resource_id,external_assignment_id,work_date::text started_at,recorded_duration_minutes duration_minutes,time_category,is_work_time,payroll_relevant,project_id,customer_id,person_name employee_name,project_label project_name,description,billable,approved,submitted_at,created_by_user_id`,
   [s.organizationId,randomUUID(),assignment.project_id,assignment.customer_id,source.supplier_id,source.name,source.project_name,day,minutes,cleanText(body.description,2000),body.billable,s.userId,assignment.resource_id,assignment.id,classification.category,classification.isWorkTime])).rows[0];
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'time.external.created',entityType:'time_entry',entityId:item.id});return item;
 });
}
