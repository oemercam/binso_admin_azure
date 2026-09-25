import 'server-only'
import { platformQuery } from '@/lib/db/client'

type OrganizationRow={id:string;name:string;status:string;created_at:Date;is_pilot_customer:boolean;pilot_status:string|null;is_demo:boolean;owner_name:string|null;owner_email:string|null;platform_status:string|null;last_active_at:Date|null;storage_mb:number|null;plan:string|null;subscription_status:string|null;seats:number|null;billing_provider:string|null;unit_amount_chf:string|null;trial_until:Date|null;current_period_end:Date|null;cancel_at_period_end:boolean|null}
type MemberRow={id:string;user_id:string;email:string;role:string;status:string;created_at:Date;updated_at:Date}
type SubscriptionEventRow={id:string;source:string;event_type:string;previous_plan:string|null;new_plan:string|null;previous_status:string|null;new_status:string|null;detail:string|null;created_at:Date}
type SupportRow={id:string;case_number:string;case_type:string;subject:string;status:string;priority:string;updated_at:Date}
type AuditRow={id:string;actor_email:string;action:string;detail:string|null;created_at:Date}
type NoteRow={id:string;author_email:string;note:string;created_at:Date}
type UsageRow={metric:string;value:number;period:string;updated_at:Date}

export async function getPlatformCustomerDetail(organizationId:string){
  const [org,members,subscriptionEvents,support,audit,notes,usage]=await Promise.all([
    platformQuery<OrganizationRow>(`select o.id,o.name,o.status,o.created_at,o.is_pilot_customer,o.pilot_status,o.is_demo,pt.owner_name,pt.owner_email,pt.platform_status,pt.last_active_at,pt.storage_mb,s.plan,s.status as subscription_status,s.seats,s.billing_provider,s.unit_amount_chf::text,s.trial_until,s.current_period_end,s.cancel_at_period_end from organizations o left join platform_tenants pt on pt.organization_id=o.id left join organization_subscriptions s on s.organization_id=o.id where o.id=$1`,[organizationId]),
    platformQuery<MemberRow>(`select id,user_id,email,role,status,created_at,updated_at from organization_memberships where organization_id=$1 order by created_at`,[organizationId]),
    platformQuery<SubscriptionEventRow>(`select id,source,event_type,previous_plan,new_plan,previous_status,new_status,detail,created_at from subscription_events where organization_id=$1 order by created_at desc limit 100`,[organizationId]),
    platformQuery<SupportRow>(`select id,case_number,case_type,subject,status,priority,updated_at from support_cases where organization_id=$1 order by updated_at desc limit 50`,[organizationId]),
    platformQuery<AuditRow>(`select id,actor_email,action,detail,created_at from platform_audit_events where tenant_id=(select id from platform_tenants where organization_id=$1) order by created_at desc limit 100`,[organizationId]),
    platformQuery<NoteRow>(`select id,author_email,note,created_at from platform_internal_notes where tenant_id=$1 order by created_at desc limit 100`,[organizationId]),
    platformQuery<UsageRow>(`select metric,value,period,updated_at from organization_usage_counters where organization_id=$1 order by period desc,metric`,[organizationId]),
  ])
  if(!org.rows[0]) return null
  return {organization:org.rows[0],members:members.rows,subscriptionEvents:subscriptionEvents.rows,support:support.rows,audit:audit.rows,notes:notes.rows,usage:usage.rows}
}

export async function addPlatformCustomerNote(input:{organizationId:string;actorUserId:string;actorEmail:string;note:string}){
  const r=await platformQuery<NoteRow>(`insert into platform_internal_notes(tenant_id,author_user_id,author_email,note) values($1,$2,$3,$4) returning id,author_email,note,created_at`,[input.organizationId,input.actorUserId,input.actorEmail,input.note])
  await platformQuery(`insert into platform_audit_events(actor_user_id,actor_email,action,tenant_id,detail) select $1,$2,'tenant.internal_note.added',pt.id,'Internal note added' from platform_tenants pt where pt.organization_id=$3`,[input.actorUserId,input.actorEmail,input.organizationId])
  return r.rows[0]
}
