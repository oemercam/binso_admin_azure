import 'server-only';
import type {PoolClient} from 'pg';
import type {SessionUser} from '../session';
import {ApiError} from '../http';
import {authorize} from '../rbac';
import {authorizeWorkforceManagement} from '../workforce-access';
import {requireFreshAuthentication} from '../fresh-authentication';
import {idempotentBusiness} from '../business-idempotency';
import {audit} from '../audit';

/** Link an existing dossier and active account without granting client/project access. */
export async function bindEmployeeIdentity(c:PoolClient,s:SessionUser,body:Record<string,unknown>,key:string){
 authorizeWorkforceManagement(s);authorize(s,'employees:write');await requireFreshAuthentication(s,c);
 if(Object.keys(body).some(key=>!['mode','employeeId','userId','expectedUserId'].includes(key))||typeof body.employeeId!=='string'||body.employeeId.length>80||typeof body.userId!=='string'||!body.userId||body.userId.length>200||!(body.expectedUserId===null||typeof body.expectedUserId==='string'&&body.expectedUserId.length<=200))throw new ApiError(400,'identity_binding_invalid','Bitte Mitarbeiter und bestehenden Zugang prüfen.');
 return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:'employee.identity.bind',key,body},async()=>{
  await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[s.organizationId+':employee.identity:'+body.userId]);
  const employee=(await c.query('select id,user_id from employees where organization_id=$1 and id::text=$2 and active and archived_at is null for update',[s.organizationId,body.employeeId])).rows[0];
  if(!employee)throw new ApiError(404,'not_found','Mitarbeiter wurde nicht gefunden.');
  if(employee.user_id!==body.expectedUserId||employee.user_id&&employee.user_id!==body.userId)throw new ApiError(409,'employee_identity_mismatch','Mitarbeiter und Benutzerzugang müssen eindeutig zugeordnet sein.');
  const member=(await c.query("select m.user_id from organization_memberships m join app_users u on u.id=m.user_id where m.organization_id=$1 and m.user_id=$2 and m.status='active' and u.status='active' for key share of m,u",[s.organizationId,body.userId])).rows[0];
  if(!member)throw new ApiError(409,'identity_binding_invalid','Bitte Mitarbeiter und bestehenden Zugang prüfen.');
  if((await c.query('select id from employees where organization_id=$1 and user_id=$2 and id<>$3 and archived_at is null',[s.organizationId,body.userId,employee.id])).rows.length)throw new ApiError(409,'employee_identity_mismatch','Mitarbeiter und Benutzerzugang müssen eindeutig zugeordnet sein.');
  await c.query('update employees set user_id=$3,updated_at=clock_timestamp() where organization_id=$1 and id=$2',[s.organizationId,employee.id,body.userId]);
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'employee.identity_bound',entityType:'employees',entityId:employee.id,metadata:{userId:body.userId}});
  return {item:{id:employee.id,user_id:body.userId}};
 });
}
