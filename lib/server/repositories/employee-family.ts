import 'server-only';
import type {PoolClient} from 'pg';
import type {SessionUser} from '../session';
import {ApiError} from '../http';
import {moneyMinor} from '@/lib/money';
import {requireSensitiveCapability} from '../sensitive-access';
import {requireFreshAuthentication} from '../fresh-authentication';
import {idempotentBusiness} from '../business-idempotency';
import {audit} from '../audit';
import {childInputIssue,allowanceInputIssue,type ChildInput,type AllowanceInput} from '@/lib/employee-family';

async function access(c:PoolClient,s:SessionUser,employeeId:string,write=false){
 await requireSensitiveCapability(s,write?'family:write':'family:read',c);
 if(write)await requireFreshAuthentication(s,c);
 if(!(await c.query('select id from employees where organization_id=$1 and id::text=$2 and archived_at is null',[s.organizationId,employeeId])).rowCount)throw new ApiError(404,'not_found','Mitarbeiter wurde nicht gefunden.');
}
const childColumns='id,child_id,revision,is_current,display_name,birth_date::text,active,created_at';
const claimColumns=`a.id,a.claim_id,a.revision,a.is_current,a.child_revision_id,a.employment_revision_id,a.allowance_type,a.starts_on::text,a.ends_on::text,a.authority,a.canton,a.decision_reference,a.monthly_amount::text,a.currency,a.status,a.requested_by_user_id,a.created_by_user_id,a.reviewed_by_user_id,a.reviewed_at,
 (a.is_current and a.status='verified' and current_date between a.starts_on and a.ends_on and exists(select 1 from employee_children c where c.organization_id=a.organization_id and c.employee_id=a.employee_id and c.id=a.child_revision_id and c.is_current and c.active) and exists(select 1 from employee_employment_periods p where p.organization_id=a.organization_id and p.employee_id=a.employee_id and p.id=a.employment_revision_id and p.is_current)) claim_current`;
export async function listEmployeeFamily(c:PoolClient,s:SessionUser,id:string){
 await access(c,s,id);return {children:(await c.query(`select ${childColumns} from employee_children where organization_id=$1 and employee_id::text=$2 order by child_id,revision desc limit 200`,[s.organizationId,id])).rows,claims:(await c.query(`select ${claimColumns} from employee_allowance_claims a where a.organization_id=$1 and a.employee_id::text=$2 order by a.starts_on desc,a.claim_id,a.revision desc limit 200`,[s.organizationId,id])).rows};
}
export async function writeEmployeeChild(c:PoolClient,s:SessionUser,employeeId:string,childId:string|null,body:unknown,key:string){
 await access(c,s,employeeId,true);const issue=childInputIssue(body);if(issue)throw new ApiError(400,'child_invalid',issue);const b=body as ChildInput;
 if(childId&&!b.expectedRevision)throw new ApiError(400,'revision_required','Bitte den aktuellen Revisionsstand angeben.');
 return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:childId?'employee_child.revise':'employee_child.create',key,body:{employeeId,childId,...b}},async()=>{
  await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[s.organizationId+':family:'+employeeId]);let revision=1;
  if(childId){const previous=(await c.query('select id,revision from employee_children where organization_id=$1 and employee_id::text=$2 and child_id::text=$3 and is_current for update',[s.organizationId,employeeId,childId])).rows[0];if(!previous)throw new ApiError(404,'not_found','Datensatz wurde nicht gefunden.');if(previous.revision!==b.expectedRevision)throw new ApiError(409,'child_changed','Die Familienangaben wurden geändert. Bitte den aktuellen Stand prüfen.');revision=previous.revision+1;await c.query('update employee_children set is_current=false where id=$1',[previous.id]);}
  const item=(await c.query(`insert into employee_children(organization_id,employee_id,child_id,revision,display_name,birth_date,active,created_by_user_id) values($1,$2,coalesce($3::uuid,gen_random_uuid()),$4,$5,$6,$7,$8) returning ${childColumns}`,[s.organizationId,employeeId,childId,revision,b.displayName.trim(),b.birthDate,b.active,s.userId])).rows[0];
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:childId?'employee_child.revised':'employee_child.created',entityType:'employee_child',entityId:item.id,metadata:{revision}});return {item};
 });
}
export async function writeAllowanceClaim(c:PoolClient,s:SessionUser,employeeId:string,claimId:string|null,body:unknown,key:string){
 await access(c,s,employeeId,true);const issue=allowanceInputIssue(body);if(issue)throw new ApiError(400,'allowance_invalid',issue);const b=body as AllowanceInput;
 if(claimId&&!b.expectedRevision)throw new ApiError(400,'revision_required','Bitte den aktuellen Revisionsstand angeben.');
 return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:claimId?'allowance_claim.revise':'allowance_claim.create',key,body:{employeeId,claimId,...b}},async()=>{
  // Match employment's existing lock before family to serialize both revision owners.
  await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[s.organizationId+':employment:'+employeeId]);await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[s.organizationId+':family:'+employeeId]);
  let revision=1,origin=s.userId;
  if(claimId){
   const previous=(await c.query('select *,starts_on::text as starts_on,ends_on::text as ends_on from employee_allowance_claims where organization_id=$1 and employee_id::text=$2 and claim_id::text=$3 and is_current for update',[s.organizationId,employeeId,claimId])).rows[0];
   if(!previous)throw new ApiError(404,'not_found','Datensatz wurde nicht gefunden.');if(previous.revision!==b.expectedRevision)throw new ApiError(409,'allowance_changed','Der Anspruch wurde geändert. Bitte den aktuellen Stand prüfen.');
   if(!((previous.status==='draft'&&['draft','verified','rejected'].includes(b.status))||(previous.status==='verified'&&b.status==='revoked')))throw new ApiError(409,'allowance_transition_invalid','Dieser Anspruchsstatus kann hier nicht geändert werden.');
   if(b.status!=='draft'){
    if(s.userId===previous.requested_by_user_id||(['verified','rejected'].includes(b.status)&&s.userId===previous.created_by_user_id))throw new ApiError(403,'independent_review_required','Die Prüfung muss durch eine andere berechtigte Person erfolgen.');
    const matches=previous.child_revision_id===b.childRevisionId&&previous.employment_revision_id===b.employmentRevisionId&&previous.allowance_type===b.allowanceType&&String(previous.starts_on).slice(0,10)===b.startsOn&&String(previous.ends_on).slice(0,10)===b.endsOn&&previous.authority===b.authority.trim()&&previous.canton===b.canton&&previous.decision_reference===b.decisionReference.trim()&&previous.currency===b.currency&&moneyMinor(previous.monthly_amount)===moneyMinor(b.monthlyAmount);
    if(!matches)throw new ApiError(409,'allowance_review_changed','Die Prüfung darf die erfassten Anspruchsdaten nicht gleichzeitig ändern.');
   }
   revision=previous.revision+1;origin=previous.requested_by_user_id;await c.query('update employee_allowance_claims set is_current=false where id=$1',[previous.id]);
  }else if(b.status!=='draft')throw new ApiError(400,'allowance_draft_required','Neue Ansprüche müssen zuerst als Entwurf gespeichert werden.');
  if(['draft','verified'].includes(b.status)){
   const source=(await c.query(`select c.child_id,c.birth_date::text,p.starts_on::text,p.ends_on::text from employee_children c join employee_employment_periods p on p.organization_id=c.organization_id and p.employee_id=c.employee_id where c.organization_id=$1 and c.employee_id::text=$2 and c.id::text=$3 and c.is_current and c.active and p.id::text=$4 and p.is_current`,[s.organizationId,employeeId,b.childRevisionId,b.employmentRevisionId])).rows[0];
   if(!source||b.startsOn<source.birth_date||b.startsOn<source.starts_on||(source.ends_on&&b.endsOn>source.ends_on))throw new ApiError(409,'allowance_source_changed','Bitte aktuelle Kind- und Anstellungsrevision sowie den Anspruchszeitraum prüfen.');
   if(b.status==='verified'&&(await c.query(`select 1 from employee_allowance_claims a join employee_children ch on ch.organization_id=a.organization_id and ch.employee_id=a.employee_id and ch.id=a.child_revision_id where a.organization_id=$1 and a.employee_id::text=$2 and a.is_current and a.status='verified' and ch.child_id=$3 and daterange(a.starts_on,a.ends_on,'[]')&&daterange($4::date,$5::date,'[]')`,[s.organizationId,employeeId,source.child_id,b.startsOn,b.endsOn])).rowCount)throw new ApiError(409,'allowance_overlap','Geprüfte Ansprüche für dasselbe Kind dürfen sich nicht überschneiden.');
  }
  const row=(await c.query(`insert into employee_allowance_claims(organization_id,employee_id,claim_id,revision,child_revision_id,employment_revision_id,allowance_type,starts_on,ends_on,authority,canton,decision_reference,monthly_amount,currency,status,requested_by_user_id,created_by_user_id,reviewed_by_user_id,reviewed_at) values($1,$2,coalesce($3::uuid,gen_random_uuid()),$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,case when $18::text is null then null else now() end) returning id`,[s.organizationId,employeeId,claimId,revision,b.childRevisionId,b.employmentRevisionId,b.allowanceType,b.startsOn,b.endsOn,b.authority.trim(),b.canton,b.decisionReference.trim(),b.monthlyAmount,b.currency,b.status,origin,s.userId,b.status==='draft'?null:s.userId])).rows[0];
  const item=(await c.query(`select ${claimColumns} from employee_allowance_claims a where a.organization_id=$1 and a.id=$2`,[s.organizationId,row.id])).rows[0];
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'allowance_claim.'+b.status,entityType:'employee_allowance_claim',entityId:item.id,metadata:{revision,status:b.status}});return {item};
 });
}
