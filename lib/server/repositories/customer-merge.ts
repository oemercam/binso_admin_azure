import 'server-only';
import {createHash} from 'node:crypto';
import type {PoolClient} from 'pg';
import type {SessionUser} from '../session';
import {withTenant} from '../db';
import {authorize} from '../rbac';
import {tenantCan} from '@/lib/permissions';
import {ApiError} from '../http';
import {audit} from '../audit';
import {requireFreshAuthentication} from '../fresh-authentication';
import {idempotentBusiness} from '../business-idempotency';
import {customerIdentity} from './customers';
import {isCustomerMergeReceipt,isCustomerMergeCancellation,type CustomerMergePreview,type CustomerMergeReceipt,type CustomerMergeCancellation} from '@/lib/customer-merge';

type Row=Record<string,unknown>;
const fields=[['name','Name'],['legal_name','Firmenname'],['customer_type','Kundentyp'],['contact_name','Kontaktperson'],['email','E-Mail'],['phone','Telefon'],['address','Adresse'],['street','Strasse'],['building_number','Hausnummer'],['zip','PLZ'],['city','Ort'],['country','Land'],['sector','Branche'],['uid','UID'],['language','Sprache'],['payment_days','Zahlungsfrist'],['discount','Rabatt'],['notes','Notizen']] as const;
const empty=(value:unknown)=>value==null||typeof value==='string'&&!value.trim();
const display=(value:unknown)=>value==null?'':String(value);
const identifier=(value:string)=>{if(!/^[a-z_][a-z0-9_]*$/.test(value))throw new Error('Unsupported customer-reference identifier');return '"'+value+'"'};
export function authorizeCustomerMergeReview(s:SessionUser){authorize(s,'customers:read');if(!tenantCan(s.role,'customers:delete',s.moduleProfile))throw new ApiError(403,'forbidden','Keine Berechtigung.');}
function checkedOutcome(value:unknown,sourceId:string,targetId:string){if(isCustomerMergeReceipt(value,sourceId,targetId)||isCustomerMergeCancellation(value,sourceId,targetId))return value;throw new ApiError(500,'merge_integrity_failed','Der gespeicherte Vorgang konnte nicht bestätigt werden.');}
const labels:Record<string,string>={customers:'Bereits zusammengeführte Datensätze',customer_merges:'Bereits zusammengeführte Datensätze',quotes:'Angebote',invoices:'Rechnungen',orders:'Aufträge',projects:'Aufträge',time_entries:'Zeiten',active_time_trackers:'Laufende Zeitmessung',expenses:'Spesen',payments:'Zahlungen',invoice_refunds:'Rückerstattungen',credit_notes:'Gutschriften',file_objects:'Dateien',workforce_assignments:'Kundenzuordnungen',contracts:'Verträge'};
async function inspect(c:PoolClient,s:SessionUser,sourceId:string,targetId:string,lock=false){
 if(sourceId===targetId)throw new ApiError(400,'invalid_merge','Bitte zwei unterschiedliche Kunden wählen.');
 const customers=(await c.query<Row>('select * from customers where organization_id=$1 and id=any($2::uuid[]) order by id'+(lock?' for update':''),[s.organizationId,[sourceId,targetId]])).rows;
 const source=customers.find(row=>row.id===sourceId),target=customers.find(row=>row.id===targetId);
 if(!source||!target)throw new ApiError(404,'not_found','Kunde wurde nicht gefunden.');
 if(source.archived_at||target.archived_at||source.merged_into_customer_id||target.merged_into_customer_id)throw new ApiError(409,'customer_changed','Bitte zwei aktuelle, nicht zusammengeführte Kunden wählen.');
 const blockers=new Set<string>(),left=customerIdentity({name:display(source.name),uid:display(source.uid),email:display(source.email)}),right=customerIdentity({name:display(target.name),uid:display(target.uid),email:display(target.email)});
 if(left.uid&&right.uid&&left.uid!==right.uid||source.customer_type&&target.customer_type&&source.customer_type!==target.customer_type)blockers.add('Die Kundenidentitäten stimmen nicht überein.');
 if(!(left.uid&&left.uid===right.uid||left.email&&left.email===right.email||left.name.length>=2&&left.name===right.name))blockers.add('Keine übereinstimmende Kundenidentität gefunden.');
 if(display(source.external_id).toLowerCase()!==sourceId)blockers.add('Die Herkunft dieses Datensatzes muss zuerst geprüft werden.');
 const references=(await c.query<{table_name:string;column_name:string;scoped:boolean}>(`select distinct t.relname table_name,a.attname column_name,exists(select 1 from pg_attribute scope where scope.attrelid=t.oid and scope.attname='organization_id' and not scope.attisdropped) scoped from pg_constraint f join pg_class t on t.oid=f.conrelid join pg_namespace n on n.oid=t.relnamespace join lateral unnest(f.conkey,f.confkey) k(local_key,foreign_key) on true join pg_attribute a on a.attrelid=t.oid and a.attnum=k.local_key join pg_attribute parent on parent.attrelid=f.confrelid and parent.attnum=k.foreign_key where f.contype='f' and f.confrelid='public.customers'::regclass and parent.attname='id' and n.nspname='public' order by table_name,column_name`)).rows;
 const linked=[];
 for(const ref of references){
  if(['customer_contacts','customer_activities'].includes(ref.table_name)&&ref.column_name==='customer_id')continue;
  if(!ref.scoped){blockers.add('Eine Verknüpfung kann nicht sicher geprüft werden.');continue;}
  const used=(await c.query(`select exists(select 1 from public.${identifier(ref.table_name)} where organization_id=$1 and ${identifier(ref.column_name)}=$2) used`,[s.organizationId,sourceId])).rows[0].used;
  linked.push([ref.table_name,ref.column_name,used]);if(used)blockers.add(labels[ref.table_name]??'Weitere Verknüpfungen');
 }
 // Legacy polymorphic associations have no customer FK. Do not silently
 // orphan these records or guess their historical meaning during consolidation.
 const legacy=(await c.query<{table_name:string;column_name:string}>(`select t.relname table_name,a.attname column_name from pg_class t join pg_namespace n on n.oid=t.relnamespace join pg_attribute a on a.attrelid=t.oid where n.nspname='public' and t.relkind='r' and not a.attisdropped and a.attname in ('entity_external_id','related_entity_external_id','source_external_id') and exists(select 1 from pg_attribute scope where scope.attrelid=t.oid and scope.attname='organization_id' and not scope.attisdropped) order by table_name,column_name`)).rows;
 for(const ref of legacy){const used=(await c.query(`select exists(select 1 from public.${identifier(ref.table_name)} where organization_id=$1 and ${identifier(ref.column_name)}=$2) used`,[s.organizationId,sourceId])).rows[0].used;linked.push([ref.table_name,ref.column_name,used]);if(used)blockers.add('Weitere Verknüpfungen');}
 const contacts=(await c.query<Row>('select * from customer_contacts where organization_id=$1 and customer_id=any($2::uuid[]) order by id limit 1001'+(lock?' for update':''),[s.organizationId,[sourceId,targetId]])).rows;
 const activities=(await c.query<Row>('select * from customer_activities where organization_id=$1 and customer_id=$2 order by id limit 1001'+(lock?' for update':''),[s.organizationId,sourceId])).rows;
 if(contacts.length>1000||activities.length>1000)blockers.add('Dieser Vorgang ist für die direkte Zusammenführung zu gross.');
 const changes=fields.map(([field,label])=>({field,label,sourceValue:display(source[field]),targetValue:display(target[field]),mode:empty(target[field])&&!empty(source[field])?'fill' as const:display(source[field])===display(target[field])?'same' as const:'keep' as const}));
 const revision=createHash('sha256').update(JSON.stringify({organization:s.organizationId,user:s.userId,source,target,contacts,activities,linked,blockers:[...blockers]})).digest('hex');
 const preview:CustomerMergePreview={revision,eligible:blockers.size===0,source:{id:sourceId,name:display(source.name),number:display(source.customer_no)},target:{id:targetId,name:display(target.name),number:display(target.customer_no)},changes,contactsToMove:contacts.filter(row=>row.customer_id===sourceId).length,activitiesToMove:activities.length,blockers:[...blockers]};
 return {preview,source,target,contacts};
}
export async function previewCustomerMerge(s:SessionUser,sourceId:string,targetId:string){authorizeCustomerMergeReview(s);return withTenant(s.organizationId,s.userId,async c=>(await inspect(c,s,sourceId,targetId)).preview,{snapshot:true});}
export async function commitCustomerMerge(s:SessionUser,sourceId:string,targetId:string,revision:string,key:string){
 authorizeCustomerMergeReview(s);authorize(s,'customers:delete');authorize(s,'customers:write');
 return withTenant(s.organizationId,s.userId,async c=>{
  await requireFreshAuthentication(s,c);
  const result=await idempotentBusiness<CustomerMergeReceipt|CustomerMergeCancellation>(c,{organizationId:s.organizationId,userId:s.userId,operation:'customer.merge',key,body:{sourceId,targetId,revision}},async()=>{
   await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[s.organizationId+':customer-create']);
   const {preview,source,contacts}=await inspect(c,s,sourceId,targetId,true);
   if(preview.revision!==revision)throw new ApiError(409,'customer_changed','Die Kunden oder Kontakte wurden geändert. Bitte die Vorschau erneut prüfen.');
   if(!preview.eligible)throw new ApiError(409,'customer_merge_blocked','Geschäftlich verwendete oder nicht eindeutig zugeordnete Kunden werden nicht zusammengeführt.');
   const fill=preview.changes.filter(item=>item.mode==='fill');
   if(fill.length)await c.query('update customers set '+fill.map((item,index)=>identifier(item.field)+'=$'+(index+3)).join(',')+',updated_at=now() where organization_id=$1 and id=$2',[s.organizationId,targetId,...fill.map(item=>source[item.field])]);
   if(contacts.some(row=>row.customer_id===targetId&&row.is_primary&&!row.archived_at))await c.query('update customer_contacts set is_primary=false,updated_at=now() where organization_id=$1 and customer_id=$2 and is_primary',[s.organizationId,sourceId]);
   const movedContacts=await c.query('update customer_contacts set customer_id=$2,updated_at=now() where organization_id=$1 and customer_id=$3 returning id',[s.organizationId,targetId,sourceId]);
   const movedActivities=await c.query('update customer_activities set customer_id=$2 where organization_id=$1 and customer_id=$3 returning id',[s.organizationId,targetId,sourceId]);
   await c.query('update customers set archived_at=now(),merged_into_customer_id=$2,updated_at=now() where organization_id=$1 and id=$3',[s.organizationId,targetId,sourceId]);
   await c.query('insert into customer_merges(organization_id,source_id,target_id,created_by_user_id) values($1,$2,$3,$4)',[s.organizationId,sourceId,targetId,s.userId]);
   const result:CustomerMergeReceipt={item:{merged:true,id:targetId,sourceId,contactsMoved:movedContacts.rows.length,activitiesMoved:movedActivities.rows.length}};
   await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'customer.merged',entityType:'customer',entityId:targetId,metadata:{sourceId,filledFields:fill.map(item=>item.field),contactsMoved:result.item.contactsMoved,activitiesMoved:result.item.activitiesMoved}});
   return result;
  });
  return checkedOutcome(result,sourceId,targetId);
 });
}
/** Settles an uncertain intent; a completed merge is returned, never rolled back.
 * A late original request sees this same-key cancellation instead of writing. */
export async function cancelCustomerMerge(s:SessionUser,sourceId:string,targetId:string,revision:string,key:string){
 authorizeCustomerMergeReview(s);return withTenant(s.organizationId,s.userId,c=>idempotentBusiness<CustomerMergeReceipt|CustomerMergeCancellation>(c,{organizationId:s.organizationId,userId:s.userId,operation:'customer.merge',key,body:{sourceId,targetId,revision}},async()=>{await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'customer.merge.cancelled',entityType:'customer',entityId:targetId,metadata:{sourceId}});return {cancelled:true,id:targetId,sourceId};}).then(result=>checkedOutcome(result,sourceId,targetId)));
}
export async function customerMergeStatus(s:SessionUser,key:string){
 authorizeCustomerMergeReview(s);return withTenant(s.organizationId,s.userId,async c=>{
  const locked=(await c.query('select pg_try_advisory_xact_lock(hashtextextended($1,0)) locked',[s.organizationId+':customer.merge:'+key])).rows[0].locked;
  if(!locked)return {state:'pending' as const};
  const stored=(await c.query<{response_json:unknown}>('select response_json from business_idempotency_keys where organization_id=$1 and operation=$2 and idempotency_key=$3 and created_by_user_id=$4',[s.organizationId,'customer.merge',key,s.userId])).rows[0];
  if(!stored)return {state:'not_recorded' as const};
  const result=stored.response_json;
  if(!result||typeof result!=='object')throw new ApiError(500,'merge_integrity_failed','Der gespeicherte Vorgang konnte nicht bestätigt werden.');
  const cancelled=result as CustomerMergeCancellation;
  if(typeof cancelled.id==='string'&&typeof cancelled.sourceId==='string'&&isCustomerMergeCancellation(result,cancelled.sourceId,cancelled.id))return {state:'cancelled' as const,result:cancelled};
  const item=(result as CustomerMergeReceipt).item;
  if(!item||!isCustomerMergeReceipt(result,item.sourceId,item.id))throw new ApiError(500,'merge_integrity_failed','Der gespeicherte Vorgang konnte nicht bestätigt werden.');
  return {state:'completed' as const,result};
 });
}
