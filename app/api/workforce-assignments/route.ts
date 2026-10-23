import {requireFreshAuthentication} from '@/lib/server/fresh-authentication';
import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {authorizeWorkforceManagement} from '@/lib/server/workforce-access';
import {bindEmployeeIdentity} from '@/lib/server/repositories/employee-identity';
import {requireModuleEntitlement} from '@/lib/server/plan-access';
import {ApiError,apiError,assertSameOrigin,cleanText,json,readJson} from '@/lib/server/http';
import {audit} from '@/lib/server/audit';

export async function GET(){try{
 const s=await requireSession();authorizeWorkforceManagement(s,false);
 return json(await withTenant(s.organizationId,s.userId,async c=>({
  items:(await c.query(`select a.*,e.name employee_name,c.name customer_name,p.name project_name from workforce_assignments a join employees e on e.id=a.employee_id and e.organization_id=a.organization_id join customers c on c.id=a.customer_id and c.organization_id=a.organization_id left join projects p on p.id=a.project_id and p.organization_id=a.organization_id where a.organization_id=$1 order by a.created_at desc limit 1000`,[s.organizationId])).rows,
  employees:(await c.query('select id,name,user_id from employees where organization_id=$1 and archived_at is null and active order by name',[s.organizationId])).rows,
  members:(await c.query("select user_id,email,role from organization_memberships where organization_id=$1 and status='active' order by email",[s.organizationId])).rows,
 })));
}catch(e){return apiError(e)}}

export async function POST(request:NextRequest){try{
 assertSameOrigin(request);const s=await requireSession();authorizeWorkforceManagement(s);await requireFreshAuthentication(s);
 const body=await readJson<Record<string,unknown>>(request,8192);
 if(body.mode==='bind_identity'){
  await requireModuleEntitlement(s.organizationId,'personal');
  return json(await withTenant(s.organizationId,s.userId,c=>bindEmployeeIdentity(c,s,body,request.headers.get('idempotency-key')??'')),201);
 }
 if(body.mode!==undefined)throw new ApiError(400,'assignment_invalid','Bitte Mitarbeiter, Zugang, Kunde und Zeitraum prüfen.');
 const employeeId=cleanText(body.employeeId,80),userId=cleanText(body.userId,200),customerId=cleanText(body.customerId,80),projectId=cleanText(body.projectId,80),startsOn=cleanText(body.startsOn,10),endsOn=cleanText(body.endsOn,10);
 if(!employeeId||!userId||!customerId||!/^\d{4}-\d{2}-\d{2}$/.test(startsOn)||endsOn&&(!/^\d{4}-\d{2}-\d{2}$/.test(endsOn)||endsOn<startsOn))throw new ApiError(400,'assignment_invalid','Bitte Mitarbeiter, Zugang, Kunde und Zeitraum prüfen.');
 const item=await withTenant(s.organizationId,s.userId,async c=>{
  const member=(await c.query("select user_id from organization_memberships where organization_id=$1 and user_id=$2 and status='active' for share",[s.organizationId,userId])).rows[0];
  const employee=(await c.query('select id,user_id from employees where organization_id=$1 and id::text=$2 and active and archived_at is null for update',[s.organizationId,employeeId])).rows[0];
  if(!member||!employee||employee.user_id&&employee.user_id!==userId)throw new ApiError(409,'employee_identity_mismatch','Mitarbeiter und Benutzerzugang müssen eindeutig zugeordnet sein.');
  if(!(await c.query('select id from customers where organization_id=$1 and id::text=$2 and archived_at is null',[s.organizationId,customerId])).rowCount)throw new ApiError(404,'customer_not_found','Kunde wurde nicht gefunden.');
  if(projectId&&!(await c.query('select id from projects where organization_id=$1 and id::text=$2 and customer_id::text=$3 and archived_at is null',[s.organizationId,projectId,customerId])).rowCount)throw new ApiError(400,'project_customer_mismatch','Der Auftrag gehört nicht zum gewählten Kunden.');
  await c.query('update employees set user_id=$3 where organization_id=$1 and id::text=$2',[s.organizationId,employeeId,userId]);
  const row=(await c.query('insert into workforce_assignments(organization_id,user_id,employee_id,customer_id,project_id,starts_on,ends_on,created_by_user_id) values($1,$2,$3,$4,$5,$6,$7,$8) returning *',[s.organizationId,userId,employeeId,customerId,projectId||null,startsOn,endsOn||null,s.userId])).rows[0];
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'workforce.assigned',entityType:'workforce_assignment',entityId:row.id,metadata:{employeeId,userId,customerId,projectId,startsOn,endsOn}});return row;
 });return json({item},201);
}catch(e){return apiError(e)}}

export async function PATCH(request:NextRequest){try{
 assertSameOrigin(request);const s=await requireSession();authorizeWorkforceManagement(s);await requireFreshAuthentication(s);const body=await readJson<{id?:string}>(request,1024);const id=cleanText(body.id,80);
 await withTenant(s.organizationId,s.userId,async c=>{
  const row=(await c.query('update workforce_assignments set revoked_at=now() where organization_id=$1 and id::text=$2 and revoked_at is null returning id',[s.organizationId,id])).rows[0];
  if(!row)throw new ApiError(404,'assignment_not_found','Zuordnung wurde nicht gefunden.');
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'workforce.revoked',entityType:'workforce_assignment',entityId:row.id});
 });return json({ok:true});
}catch(e){return apiError(e)}}
