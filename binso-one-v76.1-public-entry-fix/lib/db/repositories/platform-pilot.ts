import 'server-only'
import { platformQuery } from '@/lib/db/client'

export type PlatformPilotCustomer = {
  organizationId: string
  companyName: string
  pilotGroup?: string
  pilotStatus?: string
  pilotGoal?: string
  pilotOutcome?: string
  startedAt?: string
  endsAt?: string
  completedAt?: string
  lastActiveAt?: string
  openCases: number
  feedbackCases: number
  blockers: number
  milestones: number
}

export async function listPlatformPilotCustomers(): Promise<PlatformPilotCustomer[]> {
  const result = await platformQuery<{
    organization_id:string; company_name:string; pilot_group:string|null; pilot_status:string|null; pilot_goal:string|null; pilot_outcome:string|null;
    pilot_started_at:Date|null; pilot_ends_at:Date|null; pilot_completed_at:Date|null; last_active_at:Date|null;
    open_cases:string; feedback_cases:string; blockers:string; milestones:string;
  }>(`select o.id as organization_id,o.name as company_name,o.pilot_group,o.pilot_status,o.pilot_goal,o.pilot_outcome,o.pilot_started_at,o.pilot_ends_at,o.pilot_completed_at,
             pt.last_active_at,
             count(distinct c.id) filter (where c.status not in ('resolved','closed'))::text as open_cases,
             count(distinct c.id) filter (where c.case_type in ('feedback','feature_request'))::text as feedback_cases,
             count(distinct c.id) filter (where c.classification='blocker' and c.status not in ('resolved','closed'))::text as blockers,
             count(distinct m.milestone)::text as milestones
        from organizations o
        left join platform_tenants pt on pt.organization_id=o.id
        left join support_cases c on c.organization_id=o.id
        left join organization_milestones m on m.organization_id=o.id
       where o.is_pilot_customer=true and o.is_demo=false
       group by o.id,o.name,o.pilot_group,o.pilot_status,o.pilot_goal,o.pilot_outcome,o.pilot_started_at,o.pilot_ends_at,o.pilot_completed_at,pt.last_active_at
       order by coalesce(pt.last_active_at,o.pilot_started_at,o.created_at) desc`)
  return result.rows.map(row => ({
    organizationId: row.organization_id,
    companyName: row.company_name,
    pilotGroup: row.pilot_group ?? undefined,
    pilotStatus: row.pilot_status ?? undefined,
    pilotGoal: row.pilot_goal ?? undefined,
    pilotOutcome: row.pilot_outcome ?? undefined,
    startedAt: row.pilot_started_at?.toISOString(),
    endsAt: row.pilot_ends_at?.toISOString(),
    completedAt: row.pilot_completed_at?.toISOString(),
    lastActiveAt: row.last_active_at?.toISOString(),
    openCases: Number(row.open_cases),
    feedbackCases: Number(row.feedback_cases),
    blockers: Number(row.blockers),
    milestones: Number(row.milestones),
  }))
}

export async function updatePlatformPilotCustomer(input:{organizationId:string;pilotStatus:string;pilotGoal?:string;pilotOutcome?:string;pilotGroup?:string;endsAt?:string;actorUserId:string;actorEmail:string}){
  const completed=['pilot_completed','converted','not_converted'].includes(input.pilotStatus)
  const r=await platformQuery(`update organizations set is_pilot_customer=true,pilot_status=$2,pilot_goal=$3,pilot_outcome=$4,pilot_group=$5,pilot_ends_at=$6::timestamptz,pilot_completed_at=case when $7 then coalesce(pilot_completed_at,now()) else null end,updated_at=now() where id=$1 returning id`,[input.organizationId,input.pilotStatus,input.pilotGoal??null,input.pilotOutcome??null,input.pilotGroup??null,input.endsAt??null,completed])
  if(!r.rowCount)throw new Error('Pilotkunde wurde nicht gefunden.')
  await platformQuery(`insert into platform_audit_events(actor_user_id,actor_email,action,detail) values($1,$2,'pilot.updated',$3)`,[input.actorUserId,input.actorEmail,`${input.organizationId}; ${input.pilotStatus}`])
}
