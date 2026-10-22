import 'server-only';
import type {PoolClient} from 'pg';
import type {SessionUser} from '../session';
import {ApiError} from '../http';
import {authorize} from '../rbac';
import {requireFreshAuthentication} from '../fresh-authentication';
import {organizationPlanInTransaction} from '../plan-access';
import {planAllowsModule} from '@/config/plan-access';
import {idempotentBusiness} from '../business-idempotency';
import {audit} from '../audit';
import {approvedContractCondition} from './commercial-contracts';

export type TimePriceSide='purchase'|'sale';
const fields='id,time_entry_id,side,revision,is_current,contract_id,condition_revision_id,time_version,source_snapshot,created_at';
async function permission(c:PoolClient,s:SessionUser,side:TimePriceSide,write=false){
 authorize(s,write?(side==='sale'?'invoices:write':'purchasing:write'):'contracts:read');
 if(s.isDemo||s.moduleProfile==='time_only'||!['owner','admin','finance'].includes(s.role)||!planAllowsModule(await organizationPlanInTransaction(c,s.organizationId),'vertraege'))throw new ApiError(403,'price_access_required','Für diese Preisquelle fehlt die Berechtigung.');
 if(write){await requireFreshAuthentication(s,c);await c.query('select user_id from organization_memberships where organization_id=$1 and user_id=$2 for share',[s.organizationId,s.userId]);}
}
async function performance(c:PoolClient,s:SessionUser,id:string,write=false){
 const time=(await c.query(`select id,version,work_date::text,customer_id,supplier_id,project_id,external_resource_id,recorded_duration_minutes,person_name,description,billable,approved,submitted_at from time_entries where organization_id=$1 and id::text=$2 and external_resource_id is not null and archived_at is null${write?' for update':''}`,[s.organizationId,id])).rows[0];
 if(!time)throw new ApiError(404,'not_found','Zeiteintrag wurde nicht gefunden.');
 if((await c.query('select app_time_price_access($1,$2) allowed',[time.id,write])).rows[0]?.allowed!==true)throw new ApiError(403,'price_access_required','Für diese Preisquelle fehlt die Berechtigung.');
 return time;
}
export async function timePriceState(c:PoolClient,s:SessionUser,id:string,side:TimePriceSide){
 await permission(c,s,side);const time=await performance(c,s,id);
 const item=(await c.query(`select ${fields} from time_price_sources where organization_id=$1 and time_entry_id=$2 and side=$3 and is_current`,[s.organizationId,time.id,side])).rows[0]??null;
 const allocated=(await c.query('select 1 from invoice_line_time_entries where organization_id=$1 and time_entry_id=$2 limit 1',[s.organizationId,time.id])).rowCount!==0;
 return {time,item,allocated};
}
export async function bindTimePriceSource(c:PoolClient,s:SessionUser,id:string,input:unknown,key:string){
 const b=input as Record<string,unknown>;
 if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).some(k=>!['side','contractId','conditionId','expectedConditionRevisionId','expectedContractVersion','expectedTimeRevision','expectedRevision'].includes(k))||!['purchase','sale'].includes(String(b.side))||['contractId','conditionId','expectedConditionRevisionId'].some(k=>typeof b[k]!=='string'||!b[k]||String(b[k]).length>80)||['expectedContractVersion','expectedTimeRevision'].some(k=>!Number.isSafeInteger(b[k])||Number(b[k])<1)||!Number.isSafeInteger(b.expectedRevision)||Number(b.expectedRevision)<0)throw new ApiError(400,'price_source_invalid','Bitte die angezeigte Leistung und freigegebene Preisrevision auswählen.');
 const side=b.side as TimePriceSide;await permission(c,s,side,true);
 // All bindings for a performance serialize with its immutable time owner.
 const time=await performance(c,s,id,true);
 return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:'time.price.bind',key,body:{id,...b}},async()=>{
  const current=(await c.query('select id,revision from time_price_sources where organization_id=$1 and time_entry_id=$2 and side=$3 and is_current',[s.organizationId,time.id,side])).rows[0];
  if(time.version!==b.expectedTimeRevision||(current?.revision??0)!==b.expectedRevision)throw new ApiError(409,'price_source_changed','Die Leistung oder Preisbindung wurde geändert. Bitte erneut prüfen.');
  if((await c.query('select 1 from invoice_line_time_entries where organization_id=$1 and time_entry_id=$2 limit 1',[s.organizationId,time.id])).rowCount)throw new ApiError(409,'price_source_locked','Bereits zugeordnete Leistungen behalten ihre gespeicherte Preisquelle.');
  const source=await approvedContractCondition(c,s,{contractId:String(b.contractId),conditionId:String(b.conditionId),date:String(time.work_date),side,customerId:side==='sale'?time.customer_id:null,supplierId:side==='purchase'?time.supplier_id:null,projectId:time.project_id,resourceId:time.external_resource_id});
  if(source.unit!=='hour')throw new ApiError(409,'price_unit_mismatch','Diese Stundenleistung benötigt einen ausdrücklich freigegebenen Stundensatz.');
  if(source.contractVersion!==b.expectedContractVersion||source.conditionRevisionId!==b.expectedConditionRevisionId)throw new ApiError(409,'price_source_changed','Die Leistung oder Preisbindung wurde geändert. Bitte erneut prüfen.');
  await c.query("select set_config('app.time_price_session',$1,true)",[s.sessionId]);
  if(current)await c.query('update time_price_sources set is_current=false where organization_id=$1 and id=$2',[s.organizationId,current.id]);
  const item=(await c.query(`insert into time_price_sources(organization_id,time_entry_id,side,revision,contract_id,condition_revision_id,time_version,source_snapshot,created_by_user_id) values($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9) returning ${fields}`,[s.organizationId,time.id,side,(current?.revision??0)+1,source.contractId,source.conditionRevisionId,time.version,JSON.stringify(source),s.userId])).rows[0];
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'time.price.bound',entityType:'time_price_source',entityId:item.id,metadata:{side,revision:item.revision,timeEntryId:time.id,conditionRevisionId:source.conditionRevisionId}});
  return {item};
 });
}
