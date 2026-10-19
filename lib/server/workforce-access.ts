import 'server-only';
import type {PoolClient} from 'pg';
import type {SessionUser} from './session';
import {ApiError} from './http';
import {authorize} from './rbac';

export function authorizeWorkforceManagement(s:SessionUser,write=true){
 authorize(s,write?'users:manage':'users:read');
 if(!['owner','admin'].includes(s.role))throw new ApiError(403,'assignment_forbidden','Nur berechtigte Administratoren dürfen Zuordnungen verwalten.');
}
export async function assertTimeAssignment(c:PoolClient,s:SessionUser,customerId:string|null,projectId:string|null,date:string){
 const allowed=(await c.query('select app_workforce_access($1::uuid,$2::uuid,$3::date,true) allowed',[customerId,projectId,date])).rows[0]?.allowed;
 if(!allowed)throw new ApiError(403,'time_assignment_required','Für diesen Kunden oder Auftrag fehlt eine gültige Zuordnung.');
}
