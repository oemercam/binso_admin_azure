import "server-only";
import type {PoolClient} from 'pg';
import {ApiError} from '../http';
import {operatorCan,type OperatorPermission} from '@/lib/permissions';
import type {OperatorSession} from '../operator/session';
type Row=Record<string,unknown>;
const accountSource=`select s.organization_id tenant_id,case s.plan when 'starter' then 'start' when 'professional' then 'pro' else s.plan end plan,s.status subscription_status,case o.status when 'read_only' then 'restricted' else o.status end account_status,s.trial_until trial_ends_at,s.current_period_end current_period_ends_at,e.max_users user_limit,e.max_storage_mb*1048576::bigint storage_limit_bytes,s.billing_customer_id billing_customer_ref,s.billing_subscription_id billing_subscription_ref,s.created_at,s.updated_at,json_build_object('name',o.name,'uid',o.uid,'city',o.city) tenant from organization_subscriptions s join organizations o on o.id=s.organization_id left join organization_entitlements e on e.organization_id=o.id where not o.is_demo`;
const sources:Record<string,{permission:OperatorPermission;sql:string}>={
 tenants:{permission:'organizations:read',sql:`select o.id,o.name,o.uid,o.city,o.email,o.phone,o.created_at,json_build_object('plan',case s.plan when 'starter' then 'start' when 'professional' then 'pro' else s.plan end,'subscription_status',s.status,'account_status',o.status,'user_limit',e.max_users) account from organizations o left join organization_subscriptions s on s.organization_id=o.id left join organization_entitlements e on e.organization_id=o.id where not o.is_demo`},
 tenant_accounts:{permission:'subscriptions:read',sql:accountSource},
 support_tickets:{permission:'support:manage',sql:`select t.id,t.organization_id tenant_id,t.created_by_user_id created_by,t.subject,t.category,case t.priority when 'urgent' then 'critical' else t.priority end priority,case t.status when 'waiting_for_customer' then 'waiting_customer' else t.status end status,t.created_at,t.updated_at,json_build_object('id',o.id,'name',o.name,'uid',o.uid,'city',o.city,'email',o.email,'phone',o.phone) tenant from support_cases t join organizations o on o.id=t.organization_id where not o.is_demo`},
 support_messages:{permission:'support:manage',sql:`select m.id,m.case_id ticket_id,m.author_user_id,m.author_type,m.message body,m.internal,m.created_at from support_messages m join support_cases t on t.id=m.case_id join organizations o on o.id=t.organization_id where not o.is_demo`},
 payments:{permission:'subscriptions:read',sql:`select p.id,p.organization_id tenant_id,p.payment_date paid_on,p.amount,p.provider method,'booked' status,p.created_at,json_build_object('name',o.name) tenant,json_build_object('name',o.name) customer,json_build_object('number',p.external_id) invoice from platform_billing_payments p join organizations o on o.id=p.organization_id where not o.is_demo and p.provider<>'demo'`},
 tenant_restrictions:{permission:'restrictions:manage',sql:`select r.id,r.organization_id tenant_id,r.scope,r.reason,r.note,r.starts_at,r.ends_at,r.active,r.created_at,json_build_object('name',o.name) tenant from organization_restrictions r join organizations o on o.id=r.organization_id where not o.is_demo`},
 audit_log:{permission:'platform_audit:read',sql:`select a.id,p.organization_id tenant_id,a.actor_user_id user_id,a.action,a.entity_type,a.entity_id,a.metadata,a.created_at from platform_audit_events a left join platform_tenants p on p.id=a.tenant_id`}
};
export async function listOperatorBusiness(c:PoolClient,s:OperatorSession,table:string,extra:string):Promise<Row[]>{
 const definition=sources[table];if(!definition)throw new ApiError(400,'invalid_table','Ungültige Datenquelle.');
 if(!operatorCan(s.role,definition.permission))throw new ApiError(403,'forbidden','Keine Berechtigung.');
 const params:unknown[]=[];const where:string[]=[];const filters=new URLSearchParams(extra);
 for(const key of ['id','tenant_id','ticket_id','active']){const raw=filters.get(key);if(!raw)continue;if(!raw.startsWith('eq.'))throw new ApiError(400,'invalid_filter','Ungültiger Filter.');params.push(raw.slice(3));where.push(`q.${key}::text=$${params.length}`)}
 const requested=Number(filters.get('limit')||500);const limit=Number.isSafeInteger(requested)?Math.max(1,Math.min(1000,requested)):500;
 return (await c.query<Row>(`select * from (${definition.sql}) q ${where.length?'where '+where.join(' and '):''} order by q.created_at desc limit ${limit}`,params)).rows;
}
export async function insertOperatorBusiness(c:PoolClient,s:OperatorSession,table:string,data:Row){
 if(table==='support_messages'){
  if(!operatorCan(s.role,'support:manage'))throw new ApiError(403,'forbidden','Keine Berechtigung.');
  const r=await c.query(`insert into support_messages(case_id,author_user_id,author_type,message,internal)
    select t.id,$2,'operator',$3,$4 from support_cases t join organizations o on o.id=t.organization_id where t.id::text=$1 and not o.is_demo returning id`,[data.ticket_id,s.userId,data.body,data.internal===true]);return r.rows;
 }
 if(table==='tenant_restrictions'){
  if(!operatorCan(s.role,'restrictions:manage'))throw new ApiError(403,'forbidden','Keine Berechtigung.');
  const r=await c.query(`insert into organization_restrictions(organization_id,scope,reason,note,ends_at,created_by_user_id) values($1,$2,$3,$4,$5,$6) returning id`,[data.tenant_id,data.scope,data.reason,data.note,data.ends_at,s.userId]);
  await c.query("update organizations set status=case when $2='all' then 'suspended' else 'read_only' end,updated_at=now() where id=$1 and status<>'cancelled'",[data.tenant_id,data.scope]);return r.rows;
 }
 throw new ApiError(400,'invalid_table','Ungültige Datenquelle.');
}
export async function updateOperatorBusiness(c:PoolClient,s:OperatorSession,table:string,filter:string,data:Row){
 const filters=new URLSearchParams(filter);const id=(filters.get('id')||filters.get('tenant_id'))?.replace(/^eq\./,'');if(!id)throw new ApiError(400,'invalid_filter','Ungültiger Filter.');
 if(table==='support_tickets'){
  if(!operatorCan(s.role,'support:manage'))throw new ApiError(403,'forbidden','Keine Berechtigung.');
  const status=data.status==='waiting_customer'?'waiting_for_customer':data.status==='new'?'open':data.status;
  const priority=data.priority==='critical'?'urgent':data.priority;
  return (await c.query('update support_cases set status=coalesce($2,status),priority=coalesce($3,priority),updated_at=now() where id::text=$1 returning id',[id,status??null,priority??null])).rows;
 }
 if(table==='tenant_restrictions'){
  if(!operatorCan(s.role,'restrictions:manage'))throw new ApiError(403,'forbidden','Keine Berechtigung.');
  return (await c.query('update organization_restrictions set active=false,removed_at=now(),removed_by_user_id=$2,updated_at=now() where id::text=$1 returning id,organization_id tenant_id',[id,s.userId])).rows;
 }
 if(table==='tenant_accounts'){
  if(!operatorCan(s.role,'subscriptions:manage')&&!operatorCan(s.role,'restrictions:manage'))throw new ApiError(403,'forbidden','Keine Berechtigung.');
  if((data.plan||data.subscription_status||data.user_limit)&&!operatorCan(s.role,'subscriptions:manage'))throw new ApiError(403,'forbidden','Keine Berechtigung.');
  if(data.plan||data.subscription_status){const plan=data.plan==='start'?'starter':data.plan==='pro'?'professional':data.plan==='trial'?null:data.plan;await c.query('update organization_subscriptions set plan=coalesce($2,plan),status=coalesce($3,status),updated_at=now() where organization_id::text=$1',[id,plan??null,data.subscription_status??null]);}
  if(data.user_limit!==undefined)await c.query('update organization_entitlements set max_users=$2,updated_at=now() where organization_id::text=$1',[id,data.user_limit]);
  if(data.account_status){const status=data.account_status==='restricted'?'read_only':data.account_status;await c.query('update organizations set status=$2,updated_at=now() where id::text=$1',[id,status]);}
  // Restricted administrators may update lifecycle without gaining billing read access.
  return (await c.query('select organization_id tenant_id from organization_subscriptions where organization_id::text=$1',[id])).rows;
 }
 throw new ApiError(400,'invalid_table','Ungültige Datenquelle.');
}
