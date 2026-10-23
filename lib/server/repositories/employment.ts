import 'server-only';
import type {PoolClient} from 'pg';
import type {SessionUser} from '../session';
import {ApiError,cleanText} from '../http';
import {authorize} from '../rbac';
import {audit} from '../audit';
import {idempotentBusiness} from '../business-idempotency';
import {employeeInputIssue} from '@/lib/employee-validation';

type Body={startsOn?:unknown;endsOn?:unknown;workloadPercent?:unknown;weeklyHours?:unknown;vacationDays?:unknown;jobTitle?:unknown;workLocation?:unknown;expectedRevision?:unknown};
function fields(body:Body){
 const allowed=new Set(['startsOn','endsOn','workloadPercent','weeklyHours','vacationDays','jobTitle','workLocation','expectedRevision']);
 if(Object.keys(body).some(key=>!allowed.has(key)))throw new ApiError(400,'employment_fields_invalid','Diese Mitarbeiterangaben können hier nicht geändert werden.');
 const issue=employeeInputIssue({entryDate:body.startsOn,endDate:body.endsOn,workloadPercent:body.workloadPercent,weeklyHours:body.weeklyHours,vacationDays:body.vacationDays,workLocation:body.workLocation});
 if(issue)throw new ApiError(400,'employment_invalid',issue);
 const starts=cleanText(body.startsOn,10),ends=cleanText(body.endsOn,10)||null,title=cleanText(body.jobTitle,160);
 if(!starts||!title||body.weeklyHours===undefined||body.vacationDays===undefined)throw new ApiError(400,'employment_invalid','Die Angaben sind fachlich ungültig.');
 return {starts,ends,title,load:Number(body.workloadPercent),hours:Number(body.weeklyHours),vacation:Number(body.vacationDays),location:cleanText(body.workLocation,180)||null};
}
async function employee(c:PoolClient,s:SessionUser,id:string){
 if(!(await c.query('select id from employees where organization_id=$1 and id::text=$2 and archived_at is null',[s.organizationId,id])).rowCount)throw new ApiError(404,'not_found','Mitarbeiter wurde nicht gefunden.');
}
export async function listEmploymentPeriods(c:PoolClient,s:SessionUser,employeeId:string){
 authorize(s,'employees:read');await employee(c,s,employeeId);
 return {items:(await c.query(`select id,period_id,revision,is_current,starts_on::text,ends_on::text,workload_percent,weekly_hours,vacation_days,job_title,work_location,created_at
 from employee_employment_periods where organization_id=$1 and employee_id::text=$2 order by starts_on desc,period_id,revision desc limit 200`,[s.organizationId,employeeId])).rows};
}
export async function writeEmploymentPeriod(c:PoolClient,s:SessionUser,employeeId:string,periodId:string|null,body:Body,key:string){
 authorize(s,'employees:write');const value=fields(body);await employee(c,s,employeeId);
 if(periodId&&(!Number.isSafeInteger(body.expectedRevision)||Number(body.expectedRevision)<1))throw new ApiError(400,'employment_revision_required','Bitte den aktuellen Revisionsstand angeben.');
 return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:periodId?'employment.revise':'employment.create',key,body:{employeeId,periodId,...body}},async()=>{
  await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[s.organizationId+':employment:'+employeeId]);
  let revision=1;
  if(periodId){
   const current=(await c.query('select id,revision from employee_employment_periods where organization_id=$1 and employee_id::text=$2 and period_id::text=$3 and is_current for update',[s.organizationId,employeeId,periodId])).rows[0];
   if(!current)throw new ApiError(404,'not_found','Datensatz wurde nicht gefunden.');
   if(current.revision!==body.expectedRevision)throw new ApiError(409,'employment_changed','Die Daten wurden gleichzeitig geändert. Bitte den aktuellen Stand prüfen und erneut versuchen.');
   revision=current.revision+1;
   await c.query('update employee_employment_periods set is_current=false where id=$1',[current.id]);
  }
  const item=(await c.query(`insert into employee_employment_periods(organization_id,employee_id,period_id,revision,starts_on,ends_on,workload_percent,weekly_hours,vacation_days,job_title,work_location,created_by_user_id)
  values($1,$2,coalesce($3::uuid,gen_random_uuid()),$4,$5,$6,$7,$8,$9,$10,$11,$12)
  returning id,period_id,revision,is_current,starts_on::text,ends_on::text,workload_percent,weekly_hours,vacation_days,job_title,work_location`,[s.organizationId,employeeId,periodId,revision,value.starts,value.ends,value.load,value.hours,value.vacation,value.title,value.location,s.userId])).rows[0];
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:periodId?'employment.revised':'employment.created',entityType:'employee_employment_period',entityId:item.id,metadata:{periodId:item.period_id,revision}});
  return {item};
 });
}
