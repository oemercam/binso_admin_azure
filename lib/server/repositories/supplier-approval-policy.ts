import 'server-only';
import type {PoolClient} from 'pg';
import type {SessionUser} from '../session';
import {authorize} from '../rbac';
import {ApiError} from '../http';
import {requireFreshAuthentication} from '../fresh-authentication';
import {audit} from '../audit';
import {idempotentBusiness} from '../business-idempotency';
import {normalizeAPApprovalPolicy} from '@/lib/supplier-approval-policy';
async function access(c:PoolClient,s:SessionUser,write=false){
 authorize(s,write?'organization:write':'purchasing:read');
 if(!(await c.query('select app_ap_policy_access($1) allowed',[write])).rows[0]?.allowed||s.moduleProfile==='time_only'||s.isDemo||write&&!['owner','admin'].includes(s.role))throw new ApiError(403,'ap_policy_access','Für diese Freigaberegel fehlt die Berechtigung.');
}
export async function supplierApprovalPolicy(c:PoolClient,s:SessionUser){
 await access(c,s);const item=(await c.query('select ap_approval_policy policy,ap_policy_revision revision from organizations where id=$1',[s.organizationId])).rows[0];return {item,canConfigure:['owner','admin'].includes(s.role)&&s.organizationStatus!=='read_only'&&(await c.query('select app_ap_policy_access(true) allowed')).rows[0]?.allowed===true};
}
export async function saveSupplierApprovalPolicy(c:PoolClient,s:SessionUser,input:Record<string,unknown>,key:string){
 await access(c,s,true);await requireFreshAuthentication(s,c);
 if(Object.keys(input).some(k=>!['expectedRevision','policy'].includes(k))||!Number.isSafeInteger(input.expectedRevision)||Number(input.expectedRevision)<1)throw new ApiError(400,'ap_policy_invalid','Bitte Freigaberegel und aktuellen Revisionsstand prüfen.');
 let policy;try{policy=normalizeAPApprovalPolicy(input.policy);}catch{throw new ApiError(400,'ap_policy_invalid','Bitte gültige Freigabegrenzen in der jeweiligen Währung erfassen.');}
 await c.query("select set_config('app.ap_policy_session',$1,true)",[s.sessionId]);
 // Policy changes and later reviews use the same company row lock.
 const current=(await c.query('select ap_policy_revision revision from organizations where id=$1 for update',[s.organizationId])).rows[0];
 return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:'supplier_invoice.policy',key,body:input},async()=>{
  if(current?.revision!==input.expectedRevision)throw new ApiError(409,'ap_policy_changed','Die Freigaberegel wurde geändert. Bitte erneut laden.');
  const item=(await c.query('update organizations set ap_approval_policy=$2::jsonb,ap_policy_revision=ap_policy_revision+1 where id=$1 returning ap_approval_policy policy,ap_policy_revision revision',[s.organizationId,JSON.stringify(policy)])).rows[0];
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'supplier_invoice.policy_changed',entityType:'organization',entityId:s.organizationId,metadata:{revision:item.revision}});return {item};
 });
}
