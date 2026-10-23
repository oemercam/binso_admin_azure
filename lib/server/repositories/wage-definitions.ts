import 'server-only';
import type {PoolClient} from 'pg';
import type {SessionUser} from '../session';
import {ApiError} from '../http';
import {requireSensitiveCapability} from '../sensitive-access';
import {requireFreshAuthentication} from '../fresh-authentication';
import {idempotentBusiness} from '../business-idempotency';
import {audit} from '../audit';
import {wageDefinitionIssue,type WageDefinitionInput} from '@/lib/wage-definition';

const projection=`w.id,w.definition_id,w.revision,w.is_current,w.employment_revision_id,w.starts_on::text,w.ends_on::text,w.model,w.amount::text,w.currency,w.annual_basis,w.thirteenth_entitled,w.payout_day,w.payout_last_day,w.thirteenth_payout_month,w.created_at,
 exists(select 1 from employee_employment_periods p where p.organization_id=w.organization_id and p.employee_id=w.employee_id and p.id=w.employment_revision_id and p.is_current) employment_current`;
async function employee(c:PoolClient,s:SessionUser,id:string){
 if(!(await c.query('select id from employees where organization_id=$1 and id::text=$2 and archived_at is null',[s.organizationId,id])).rowCount)throw new ApiError(404,'not_found','Mitarbeiter wurde nicht gefunden.');
}
export async function listWageDefinitions(c:PoolClient,s:SessionUser,id:string){
 await requireSensitiveCapability(s,'hr_sensitive:read',c);await employee(c,s,id);
 return {items:(await c.query(`select ${projection} from employee_wage_definitions w where w.organization_id=$1 and w.employee_id::text=$2 order by w.starts_on desc,w.definition_id,w.revision desc limit 200`,[s.organizationId,id])).rows};
}
export async function writeWageDefinition(c:PoolClient,s:SessionUser,employeeId:string,definitionId:string|null,body:unknown,key:string){
 await requireSensitiveCapability(s,'hr_sensitive:write',c);await requireFreshAuthentication(s,c);
 const issue=wageDefinitionIssue(body);if(issue)throw new ApiError(400,'wage_definition_invalid',issue);
 const b=body as WageDefinitionInput;
 if(definitionId&&!b.expectedRevision)throw new ApiError(400,'revision_required','Bitte den aktuellen Revisionsstand angeben.');
 await employee(c,s,employeeId);
 return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:definitionId?'wage_definition.revise':'wage_definition.create',key,body:{employeeId,definitionId,...b}},async()=>{
  await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[s.organizationId+':employment:'+employeeId]);
  const employment=(await c.query('select id,period_id,starts_on::text,ends_on::text from employee_employment_periods where organization_id=$1 and employee_id::text=$2 and id::text=$3 and is_current',[s.organizationId,employeeId,b.employmentRevisionId])).rows[0];
  if(!employment||b.startsOn<employment.starts_on||(employment.ends_on&&(!b.endsOn||b.endsOn>employment.ends_on)))throw new ApiError(409,'employment_changed','Bitte eine aktuelle Anstellungsrevision und dazu passende Lohngültigkeit wählen.');
  let revision=1;
  if(definitionId){
   const current=(await c.query('select id,revision,employment_revision_id from employee_wage_definitions where organization_id=$1 and employee_id::text=$2 and definition_id::text=$3 and is_current for update',[s.organizationId,employeeId,definitionId])).rows[0];
   if(!current)throw new ApiError(404,'not_found','Datensatz wurde nicht gefunden.');
   if(current.revision!==b.expectedRevision)throw new ApiError(409,'wage_definition_changed','Die Lohndefinition wurde gleichzeitig geändert. Bitte den aktuellen Stand prüfen.');
   const original=(await c.query('select period_id from employee_employment_periods where organization_id=$1 and employee_id::text=$2 and id=$3',[s.organizationId,employeeId,current.employment_revision_id])).rows[0];
   if(original?.period_id!==employment.period_id)throw new ApiError(409,'employment_changed','Eine Lohnrevision muss zur gleichen Anstellungsperiode gehören.');
   revision=current.revision+1;
  }
  const overlap=await c.query(`select 1 from employee_wage_definitions where organization_id=$1 and employee_id::text=$2 and is_current and ($3::uuid is null or definition_id<>$3::uuid) and daterange(starts_on,ends_on,'[]')&&daterange($4::date,$5::date,'[]')`,[s.organizationId,employeeId,definitionId,b.startsOn,b.endsOn]);
  if(overlap.rowCount)throw new ApiError(409,'wage_period_overlap','Lohngültigkeiten dürfen sich nicht überschneiden.');
  if(definitionId)await c.query('update employee_wage_definitions set is_current=false where organization_id=$1 and employee_id::text=$2 and definition_id::text=$3 and is_current',[s.organizationId,employeeId,definitionId]);
  const row=(await c.query(`insert into employee_wage_definitions(organization_id,employee_id,definition_id,revision,employment_revision_id,starts_on,ends_on,model,amount,currency,annual_basis,thirteenth_entitled,payout_day,payout_last_day,thirteenth_payout_month,created_by_user_id)
   values($1,$2,coalesce($3::uuid,gen_random_uuid()),$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) returning id`,[s.organizationId,employeeId,definitionId,revision,b.employmentRevisionId,b.startsOn,b.endsOn,b.model,b.amount,b.currency,b.annualBasis,b.thirteenthEntitled,b.payoutDay==='last_day'?null:b.payoutDay,b.payoutDay==='last_day',b.thirteenthPayoutMonth,s.userId])).rows[0];
  const item=(await c.query(`select ${projection} from employee_wage_definitions w where w.organization_id=$1 and w.id=$2`,[s.organizationId,row.id])).rows[0];
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:definitionId?'wage_definition.revised':'wage_definition.created',entityType:'employee_wage_definition',entityId:item.id,metadata:{definitionId:item.definition_id,revision,employmentRevisionId:b.employmentRevisionId}});
  return {item};
 });
}
