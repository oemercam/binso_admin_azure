import 'server-only'
import { platformQuery } from '@/lib/db/client'

export async function listPlatformReleases(){const r=await platformQuery(`select id,build_id,environment,status,commit_sha,detail,created_at from platform_release_events order by created_at desc limit 100`);return r.rows}
export async function recordPlatformRelease(input:{buildId:string;environment:'staging'|'production';status:'started'|'healthy'|'failed'|'rolled_back';commitSha?:string;detail?:string}){await platformQuery(`insert into platform_release_events(build_id,environment,status,commit_sha,detail) values($1,$2,$3,$4,$5)`,[input.buildId,input.environment,input.status,input.commitSha??null,input.detail??null])}

export async function listPlatformIncidents(){const r=await platformQuery(`select id,title,severity,status,public_message,internal_detail,started_at,resolved_at,updated_at from platform_incidents order by case when status='resolved' then 1 else 0 end,started_at desc limit 100`);return r.rows}
export async function upsertPlatformIncident(input:{id?:string;title:string;severity:'minor'|'major'|'critical';status:'investigating'|'identified'|'monitoring'|'resolved';publicMessage?:string;internalDetail?:string;actorUserId:string;actorEmail:string}){
  const r=input.id
    ? await platformQuery(`update platform_incidents set title=$2,severity=$3,status=$4,public_message=$5,internal_detail=$6,resolved_at=case when $4='resolved' then coalesce(resolved_at,now()) else null end,updated_by_user_id=$7,updated_at=now() where id=$1 returning id`,[input.id,input.title,input.severity,input.status,input.publicMessage??null,input.internalDetail??null,input.actorUserId])
    : await platformQuery(`insert into platform_incidents(title,severity,status,public_message,internal_detail,updated_by_user_id) values($1,$2,$3,$4,$5,$6) returning id`,[input.title,input.severity,input.status,input.publicMessage??null,input.internalDetail??null,input.actorUserId])
  await platformQuery(`insert into platform_audit_events(actor_user_id,actor_email,action,detail) values($1,$2,'incident.updated',$3)`,[input.actorUserId,input.actorEmail,`${r.rows[0]?.id}; ${input.status}; ${input.severity}`])
  return r.rows[0]
}

export async function getPlatformAnalytics(){
  const r=await platformQuery<{active_orgs:string;trial_orgs:string;pilot_orgs:string;mrr:string;events_30d:string;converted_30d:string;churn_30d:string}>(`select
    (select count(*)::text from platform_tenants where platform_status='active') active_orgs,
    (select count(*)::text from platform_tenants where platform_status='trial') trial_orgs,
    (select count(*)::text from organizations where is_pilot_customer=true and is_demo=false and pilot_status in ('active_pilot','pilot_review','extended')) pilot_orgs,
    (select coalesce(sum(s.unit_amount_chf),0)::text from organization_subscriptions s join organizations o on o.id=s.organization_id where s.status='active' and o.is_demo=false) mrr,
    (select count(*)::text from product_events pe join organizations o on o.id=pe.organization_id where pe.occurred_at>=now()-interval '30 days' and o.is_demo=false) events_30d,
    (select count(*)::text from organizations where pilot_status='converted' and pilot_completed_at>=now()-interval '30 days') converted_30d,
    (select count(*)::text from organization_subscriptions s join organizations o on o.id=s.organization_id where s.status='cancelled' and s.cancelled_at>=now()-interval '30 days' and o.is_demo=false) churn_30d`)
  const milestones=await platformQuery(`select milestone,count(*)::int as organizations from organization_milestones m join organizations o on o.id=m.organization_id where o.is_demo=false group by milestone order by milestone`)
  return {summary:r.rows[0],milestones:milestones.rows}
}
