import 'server-only';
import type {PoolClient} from 'pg';
import type {SessionUser} from '../session';
import {ApiError} from '../http';
import {authorize} from '../rbac';
import {authorizeWorkforceManagement} from '../workforce-access';
import {requireFreshAuthentication} from '../fresh-authentication';
import {audit} from '../audit';
import {idempotentBusiness} from '../business-idempotency';

const resourceColumns='id,supplier_id,name,role_label,active,version';
function resourceRead(s:SessionUser){if(['project_manager','manager'].includes(s.role))authorize(s,'projects:read');else{authorizeWorkforceManagement(s,false);authorize(s,'purchasing:read');}}
async function parent(c:PoolClient,s:SessionUser,supplierId:string){if(!(await c.query('select id from suppliers where organization_id=$1 and id::text=$2 and archived_at is null',[s.organizationId,supplierId])).rows.length)throw new ApiError(404,'not_found','Lieferant wurde nicht gefunden.');}
function text(body:Record<string,unknown>,key:string,max:number){const value=body[key]??'';if(typeof value!=='string'||value.length>max)throw new ApiError(400,'resource_invalid','Bitte Ressource und Einsatzangaben prüfen.');return value.trim();}
function date(value:string){const parsed=new Date(value+'T00:00:00Z');return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===value;}
export async function listExternalResources(c:PoolClient,s:SessionUser,supplierId:string){
 resourceRead(s);await parent(c,s,supplierId);
 const items=(await c.query(`select ${resourceColumns} from external_resources where organization_id=$1 and supplier_id::text=$2 order by name,id limit 200`,[s.organizationId,supplierId])).rows;
 const assignments=(await c.query(`select a.id,a.resource_id,a.project_id,p.name project_name,a.starts_on::text,a.ends_on::text,a.revoked_at,a.version
  from external_resource_assignments a join external_resources r on r.organization_id=a.organization_id and r.id=a.resource_id join projects p on p.organization_id=a.organization_id and p.id=a.project_id
  where a.organization_id=$1 and r.supplier_id::text=$2 order by a.starts_on desc,a.id limit 500`,[s.organizationId,supplierId])).rows;
 return {items,assignments};
}
export async function writeExternalResource(c:PoolClient,s:SessionUser,supplierId:string,id:string|null,body:Record<string,unknown>,key:string){
 authorizeWorkforceManagement(s);authorize(s,'purchasing:write');await requireFreshAuthentication(s,c);await parent(c,s,supplierId);
 if(!body||typeof body!=='object'||Array.isArray(body))throw new ApiError(400,'resource_invalid','Bitte Ressource und Einsatzangaben prüfen.');
 if(Object.keys(body).some(key=>!['name','roleLabel','active','expectedRevision'].includes(key)))throw new ApiError(400,'resource_fields_invalid','Diese Ressourcenangaben können hier nicht geändert werden.');
 const name=text(body,'name',200),role=text(body,'roleLabel',160);
 if(!name||body.active!==undefined&&typeof body.active!=='boolean'||id&&(typeof body.active!=='boolean'||!Number.isSafeInteger(body.expectedRevision)||Number(body.expectedRevision)<1))throw new ApiError(400,'resource_invalid','Bitte Ressource und Einsatzangaben prüfen.');
 return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:id?'external_resource.update':'external_resource.create',key,body:{supplierId,id,...body}},async()=>{
  if(id){const previous=(await c.query('select version from external_resources where organization_id=$1 and supplier_id::text=$2 and id::text=$3 for update',[s.organizationId,supplierId,id])).rows[0];if(!previous)throw new ApiError(404,'not_found','Externe Ressource wurde nicht gefunden.');if(previous.version!==body.expectedRevision)throw new ApiError(409,'resource_changed','Der Stand wurde geändert. Bitte die Ansicht aktualisieren.');}
  const item=id?(await c.query(`update external_resources set name=$1,role_label=$2,active=$3 where organization_id=$4 and supplier_id::text=$5 and id::text=$6 returning ${resourceColumns}`,[name,role||null,body.active!==false,s.organizationId,supplierId,id])).rows[0]
   :(await c.query(`insert into external_resources(name,role_label,active,organization_id,supplier_id,created_by_user_id) values($1,$2,$3,$4,$5,$6) returning ${resourceColumns}`,[name,role||null,body.active!==false,s.organizationId,supplierId,s.userId])).rows[0];
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:id?'external_resource.updated':'external_resource.created',entityType:'external_resource',entityId:item.id,metadata:{revision:item.version}});return {item};
 });
}
export async function writeExternalAssignment(c:PoolClient,s:SessionUser,supplierId:string,resourceId:string,body:Record<string,unknown>,key:string,revoke=false){
 authorizeWorkforceManagement(s);authorize(s,'purchasing:write');await requireFreshAuthentication(s,c);await parent(c,s,supplierId);
 if(!body||typeof body!=='object'||Array.isArray(body))throw new ApiError(400,'resource_invalid','Bitte Ressource und Einsatzangaben prüfen.');
 if(Object.keys(body).some(key=>!(revoke?['id','expectedRevision']:['projectId','startsOn','endsOn']).includes(key)))throw new ApiError(400,'resource_fields_invalid','Diese Ressourcenangaben können hier nicht geändert werden.');
 const project=text(body,'projectId',80),starts=text(body,'startsOn',10),ends=text(body,'endsOn',10),id=text(body,'id',80);
 if(revoke?(!id||!Number.isSafeInteger(body.expectedRevision)):(!project||!date(starts)||ends&&(!date(ends)||ends<starts)))throw new ApiError(400,'resource_invalid','Bitte Ressource und Einsatzangaben prüfen.');
 return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:revoke?'external_assignment.revoke':'external_assignment.create',key,body:{supplierId,resourceId,...body}},async()=>{
  const resource=(await c.query('select r.id,r.active,s.status from external_resources r join suppliers s on s.organization_id=r.organization_id and s.id=r.supplier_id where r.organization_id=$1 and r.supplier_id::text=$2 and r.id::text=$3 for update of r,s',[s.organizationId,supplierId,resourceId])).rows[0];
  if(!resource)throw new ApiError(404,'not_found','Externe Ressource wurde nicht gefunden.');
  let item;
  if(revoke){
   const old=(await c.query('select id,version,revoked_at from external_resource_assignments where organization_id=$1 and resource_id::text=$2 and id::text=$3 for update',[s.organizationId,resourceId,id])).rows[0];
   if(!old)throw new ApiError(404,'not_found','Einsatz wurde nicht gefunden.');
   if(old.version!==body.expectedRevision||old.revoked_at)throw new ApiError(409,'resource_changed','Der Stand wurde geändert. Bitte die Ansicht aktualisieren.');
   item=(await c.query('update external_resource_assignments set revoked_at=now(),revoked_by_user_id=$3 where organization_id=$1 and id=$2 returning id,version,revoked_at',[s.organizationId,old.id,s.userId])).rows[0];
  }else{
   if(!resource.active||resource.status!=='active')throw new ApiError(409,'resource_inactive','Ressource oder Lieferant ist nicht aktiv.');
   if(!(await c.query('select id from projects where organization_id=$1 and id::text=$2 and archived_at is null',[s.organizationId,project])).rows.length)throw new ApiError(404,'not_found','Auftrag wurde nicht gefunden.');
   item=(await c.query('insert into external_resource_assignments(organization_id,resource_id,project_id,starts_on,ends_on,created_by_user_id) values($1,$2,$3,$4,$5,$6) returning id,resource_id,project_id,starts_on::text,ends_on::text,version',[s.organizationId,resourceId,project,starts,ends||null,s.userId])).rows[0];
  }
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:revoke?'external_assignment.revoked':'external_assignment.created',entityType:'external_assignment',entityId:item.id,metadata:{revision:item.version}});return {item};
 });
}
/** The Time owner must call this guard before writing external time (P17). */
export async function assertExternalAssignment(c:PoolClient,s:SessionUser,assignmentId:string,workDate:string){
 resourceRead(s);
 if(!date(workDate))throw new ApiError(400,'resource_invalid','Bitte Ressource und Einsatzangaben prüfen.');
 const row=(await c.query(`select a.id,a.resource_id,a.project_id,p.customer_id from external_resource_assignments a
 join external_resources r on r.organization_id=a.organization_id and r.id=a.resource_id
 join suppliers sp on sp.organization_id=r.organization_id and sp.id=r.supplier_id
 join projects p on p.organization_id=a.organization_id and p.id=a.project_id
 where a.organization_id=$1 and a.id::text=$2 and a.revoked_at is null and r.active and sp.status='active' and sp.archived_at is null and p.archived_at is null
 and a.starts_on<=$3::date and (a.ends_on is null or a.ends_on>=$3::date)
 and a.starts_on<=current_date and (a.ends_on is null or a.ends_on>=current_date)`,[s.organizationId,assignmentId,workDate])).rows[0];
 if(!row)throw new ApiError(403,'external_assignment_required','Für diese externe Ressource fehlt ein gültiger Einsatz.');return row;
}
