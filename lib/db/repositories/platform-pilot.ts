import 'server-only'
import { query } from '@/lib/db/client'

export type PlatformPilotCustomer = {
  organizationId: string
  companyName: string
  pilotGroup?: string
  pilotStatus?: string
  startedAt?: string
  endsAt?: string
  lastActiveAt?: string
  openCases: number
  feedbackCases: number
  blockers: number
}

export async function listPlatformPilotCustomers(): Promise<PlatformPilotCustomer[]> {
  const result = await query<{
    organization_id:string; company_name:string; pilot_group:string|null; pilot_status:string|null;
    pilot_started_at:Date|null; pilot_ends_at:Date|null; last_active_at:Date|null;
    open_cases:string; feedback_cases:string; blockers:string;
  }>(`select o.id as organization_id,o.name as company_name,o.pilot_group,o.pilot_status,o.pilot_started_at,o.pilot_ends_at,
             pt.last_active_at,
             count(c.id) filter (where c.status not in ('resolved','closed'))::text as open_cases,
             count(c.id) filter (where c.case_type in ('feedback','feature_request'))::text as feedback_cases,
             count(c.id) filter (where c.classification='blocker' and c.status not in ('resolved','closed'))::text as blockers
        from organizations o
        left join platform_tenants pt on pt.organization_id=o.id
        left join support_cases c on c.organization_id=o.id
       where o.is_pilot_customer=true and o.is_demo=false
       group by o.id,o.name,o.pilot_group,o.pilot_status,o.pilot_started_at,o.pilot_ends_at,pt.last_active_at
       order by coalesce(pt.last_active_at,o.pilot_started_at,o.created_at) desc`)
  return result.rows.map(row => ({
    organizationId: row.organization_id,
    companyName: row.company_name,
    pilotGroup: row.pilot_group ?? undefined,
    pilotStatus: row.pilot_status ?? undefined,
    startedAt: row.pilot_started_at?.toISOString(),
    endsAt: row.pilot_ends_at?.toISOString(),
    lastActiveAt: row.last_active_at?.toISOString(),
    openCases: Number(row.open_cases),
    feedbackCases: Number(row.feedback_cases),
    blockers: Number(row.blockers),
  }))
}
