import 'server-only';
import type {PoolClient} from 'pg';
import type {SessionUser} from '../session';
import {ApiError} from '../http';
import {authorize} from '../rbac';
import {requireSensitiveCapability} from '../sensitive-access';
import {requireFreshAuthentication} from '../fresh-authentication';
import {organizationPlanInTransaction} from '../plan-access';
import {planAllowsModule} from '@/config/plan-access';
import {tenantCan} from '@/lib/permissions';
import {absenceRequestIssue,type AbsenceRequestInput} from '@/lib/absence-request';
import {idempotentBusiness} from '../business-idempotency';
import {audit} from '../audit';

async function access(c:PoolClient,s:SessionUser){
 authorize(s,'organization:read');
 if(s.isDemo||s.moduleProfile==='time_only')throw new ApiError(403,'absence_access_required','Für diesen Abwesenheitsbereich fehlt die Berechtigung.');
 if(!planAllowsModule(await organizationPlanInTransaction(c,s.organizationId),'abwesenheiten'))throw new ApiError(403,'module_unavailable','Diese Funktion ist in deinem aktuellen Plan nicht enthalten.');
 const member=(await c.query(`select m.role,o.status from organization_memberships m join app_users u on u.id=m.user_id join organizations o on o.id=m.organization_id where m.organization_id=$1 and m.user_id=$2 and m.status='active' and m.module_profile='standard' and u.status='active' and o.status in ('trial','active','grace_period','read_only')`,[s.organizationId,s.userId])).rows[0];
 if(!member)throw new ApiError(403,'absence_access_required','Für diesen Abwesenheitsbereich fehlt die Berechtigung.');
 const own=(await c.query('select id from employees where organization_id=$1 and user_id=$2 and active and archived_at is null and app_own_employee(id)',[s.organizationId,s.userId])).rows[0]?.id??null;
 const grants=(await c.query("select app_has_sensitive_capability('hr_sensitive:read') read,app_has_sensitive_capability('hr_sensitive:write') write")).rows[0];
 const writable=member.status!=='read_only'&&s.organizationStatus!=='read_only';
 return {ownEmployeeId:own as string|null,mayRequest:writable&&member.role!=='reader'&&!!own,mayReadTeam:grants.read&&tenantCan(member.role,'absence:read'),mayReview:writable&&grants.write&&tenantCan(member.role,'absence:write')};
}
async function employee(c:PoolClient,s:SessionUser,id:string){
 const row=(await c.query('select id,user_id,name from employees where organization_id=$1 and id::text=$2 and active and archived_at is null',[s.organizationId,id])).rows[0];if(!row)throw new ApiError(404,'not_found','Mitarbeiter wurde nicht gefunden.');return row;
}
export async function absenceContext(c:PoolClient,s:SessionUser,id:string){
 const a=await access(c,s);if(id!==a.ownEmployeeId&&!a.mayReadTeam)throw new ApiError(404,'not_found','Mitarbeiter wurde nicht gefunden.');await employee(c,s,id);
 return {items:(await c.query('select id,revision,starts_on::text,ends_on::text,job_title from employee_employment_periods where organization_id=$1 and employee_id::text=$2 and is_current order by starts_on desc',[s.organizationId,id])).rows};
}
export async function listAbsences(c:PoolClient,s:SessionUser,scope:'self'|'team',offset:number){
 const a=await access(c,s);if(scope==='team'&&!a.mayReadTeam)throw new ApiError(403,'sensitive_access_required','Für diese sensiblen Daten fehlt das ausdrücklich vergebene Fachrecht.');
 const filter=scope==='self'?' and a.employee_id=$2::uuid':'',args:unknown[]=scope==='self'?[s.organizationId,a.ownEmployeeId]:[s.organizationId];
 const total=(await c.query(`select count(*)::int total from absences a where a.organization_id=$1 and a.archived_at is null${filter}`,args)).rows[0].total;
 const items=(await c.query(`select a.id,a.employee_id,e.name employee_name,a.absence_type,a.start_date::text,a.end_date::text,a.days::text,a.status,a.version,a.is_v26_request,a.created_by_user_id,a.reviewed_by_user_id,a.employment_revision_id,e.user_id beneficiary_user_id,
 exists(select 1 from employee_employment_periods p where p.organization_id=a.organization_id and p.employee_id=a.employee_id and p.id=a.employment_revision_id and p.is_current) employment_current
 from absences a join employees e on e.organization_id=a.organization_id and e.id=a.employee_id where a.organization_id=$1 and a.archived_at is null${filter} order by a.start_date desc,a.id desc limit 50 offset $${args.length+1}`,[...args,offset])).rows;
 return {items,total,scope,...a};
}
export async function createAbsence(c:PoolClient,s:SessionUser,body:unknown,key:string){
 const a=await access(c,s),issue=absenceRequestIssue(body);if(issue)throw new ApiError(400,'absence_invalid',issue);const b=body as AbsenceRequestInput;
 if(b.employeeId===a.ownEmployeeId){if(!a.mayRequest)throw new ApiError(403,'read_only','Der Antrag kann mit diesem Zugang nicht gespeichert werden.');}
 else {if(!a.mayReview)throw new ApiError(403,'absence_access_required','Für diesen Abwesenheitsbereich fehlt die Berechtigung.');await requireSensitiveCapability(s,'hr_sensitive:write',c);await requireFreshAuthentication(s,c);}
 return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:'absence.request',key,body:b},async()=>{
  await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[s.organizationId+':employment:'+b.employeeId]);await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[s.organizationId+':absence:'+b.employeeId]);
  await employee(c,s,b.employeeId);
  const period=(await c.query('select id,starts_on::text,ends_on::text from employee_employment_periods where organization_id=$1 and employee_id::text=$2 and id::text=$3 and is_current',[s.organizationId,b.employeeId,b.employmentRevisionId])).rows[0];
  if(!period||b.startDate<period.starts_on||(period.ends_on&&b.endDate>period.ends_on))throw new ApiError(409,'employment_changed','Bitte eine aktuelle Anstellungsrevision und dazu passende Abwesenheitsdaten wählen.');
  if((await c.query("select 1 from absences where organization_id=$1 and employee_id::text=$2 and archived_at is null and status in ('open','approved') and daterange(start_date,end_date,'[]')&&daterange($3::date,$4::date,'[]')",[s.organizationId,b.employeeId,b.startDate,b.endDate])).rowCount)throw new ApiError(409,'absence_overlap','Für diesen Zeitraum besteht bereits ein offener oder genehmigter Antrag.');
  const item=(await c.query(`insert into absences(organization_id,external_id,employee_id,absence_type,start_date,end_date,days,status,created_by_user_id,is_v26_request,employment_revision_id) values($1,gen_random_uuid()::text,$2,$3,$4,$5,$6,'open',$7,true,$8) returning id,version,status`,[s.organizationId,b.employeeId,b.absenceType,b.startDate,b.endDate,b.days,s.userId,b.employmentRevisionId])).rows[0];
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'absence.requested',entityType:'absence',entityId:item.id,metadata:{version:item.version}});return {item};
 });
}
export async function transitionAbsence(c:PoolClient,s:SessionUser,id:string,body:unknown,key:string){
 const a=await access(c,s),b=body as {status?:unknown;expectedRevision?:unknown};
 if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).some(k=>!['status','expectedRevision'].includes(k))||!['approved','rejected','cancelled'].includes(String(b.status))||!Number.isSafeInteger(b.expectedRevision)||Number(b.expectedRevision)<1)throw new ApiError(400,'absence_transition_invalid','Bitte Status und aktuellen Revisionsstand prüfen.');
 if(b.status!=='cancelled'){
  if(!a.mayReview)throw new ApiError(403,'absence_access_required','Für diesen Abwesenheitsbereich fehlt die Berechtigung.');
  await requireSensitiveCapability(s,'hr_sensitive:write',c);await requireFreshAuthentication(s,c);
 }
 return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:'absence.transition',key,body:{id,...b}},async()=>{
  const previous=(await c.query('select id,employee_id,status,version,is_v26_request,created_by_user_id,employment_revision_id from absences where organization_id=$1 and id::text=$2 and archived_at is null for update',[s.organizationId,id])).rows[0];if(!previous)throw new ApiError(404,'not_found','Datensatz wurde nicht gefunden.');
  if(previous.version!==b.expectedRevision)throw new ApiError(409,'absence_changed','Der Antrag wurde gleichzeitig geändert. Bitte den aktuellen Stand prüfen.');
  if(!previous.is_v26_request||!((previous.status==='open'&&['approved','rejected','cancelled'].includes(String(b.status)))||(previous.status==='approved'&&b.status==='cancelled')))throw new ApiError(409,'absence_transition_invalid','Dieser Antrag kann in diesem Status nicht geändert werden.');
  const review=b.status!=='cancelled'||previous.status==='approved';
  if(review){
   if(!a.mayReview)throw new ApiError(403,'absence_access_required','Für diesen Abwesenheitsbereich fehlt die Berechtigung.');await requireSensitiveCapability(s,'hr_sensitive:write',c);await requireFreshAuthentication(s,c);
   const target=await employee(c,s,previous.employee_id);if(previous.created_by_user_id===s.userId||target.user_id===s.userId)throw new ApiError(403,'independent_review_required','Die Prüfung muss durch eine andere berechtigte Person erfolgen.');
   if(b.status==='approved'&&!(await c.query('select id from employee_employment_periods where organization_id=$1 and employee_id=$2 and id=$3 and is_current',[s.organizationId,previous.employee_id,previous.employment_revision_id])).rowCount)throw new ApiError(409,'employment_changed','Die Anstellung wurde geändert. Bitte den Antrag neu erfassen.');
   await c.query("select set_config('app.absence_review_session',$1,true)",[s.sessionId]);
  }else if(!(previous.employee_id===a.ownEmployeeId&&a.mayRequest)&&!a.mayReview)throw new ApiError(403,'absence_access_required','Für diesen Abwesenheitsbereich fehlt die Berechtigung.');
  const item=(await c.query(`update absences set status=$3,reviewed_by_user_id=$4,reviewed_at=case when $4::text is null then null else now() end where organization_id=$1 and id=$2 returning id,status,version`,[s.organizationId,previous.id,b.status,review?s.userId:null])).rows[0];
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'absence.'+String(b.status),entityType:'absence',entityId:item.id,metadata:{version:item.version,status:item.status}});return {item};
 });
}
