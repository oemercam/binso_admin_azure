import 'server-only'
import type { PoolClient } from 'pg'
import { platformQuery } from '@/lib/db/client'
import { withTenantTransaction } from '@/lib/db/tenant'
import type { SupportCase, SupportCaseCategory, SupportCaseClassification, SupportCasePriority, SupportCaseStatus, SupportCaseType, SupportMessage } from '@/types/domain'

type CaseRow = {
  id: string; case_number: string; organization_id: string; created_by_user_id: string;
  case_type: SupportCaseType; category: SupportCaseCategory; classification: SupportCaseClassification | null; priority: SupportCasePriority;
  assigned_to_user_id: string | null; first_response_at: Date | null; resolved_at: Date | null; merged_into_case_id: string | null;
  is_pilot_related: boolean; subject: string; status: SupportCaseStatus; current_page: string | null;
  entity_type: string | null; entity_id: string | null; build_version: string | null; correlation_id: string | null;
  created_at: Date; updated_at: Date
}
type MessageRow = { id: string; case_id: string; author_type: 'customer'|'operator'; author_user_id: string; visibility: 'customer'|'internal'; message: string; created_at: Date }

const caseColumns = `id,case_number,organization_id,created_by_user_id,case_type,category,classification,priority,assigned_to_user_id,first_response_at,resolved_at,merged_into_case_id,is_pilot_related,subject,status,current_page,entity_type,entity_id,build_version,correlation_id,created_at,updated_at`

function mapCase(row: CaseRow): SupportCase {
  return {
    id: row.id, caseNumber: row.case_number, organizationId: row.organization_id, createdByUserId: row.created_by_user_id,
    caseType: row.case_type, category: row.category, classification: row.classification ?? undefined, priority: row.priority,
    assignedToUserId: row.assigned_to_user_id ?? undefined, firstResponseAt: row.first_response_at?.toISOString(), resolvedAt: row.resolved_at?.toISOString(), mergedIntoCaseId: row.merged_into_case_id ?? undefined,
    isPilotRelated: row.is_pilot_related, subject: row.subject, status: row.status, currentPage: row.current_page ?? undefined,
    entityType: row.entity_type ?? undefined, entityId: row.entity_id ?? undefined, buildVersion: row.build_version ?? undefined,
    correlationId: row.correlation_id ?? undefined, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
  }
}
function mapMessage(row: MessageRow): SupportMessage {
  return { id: row.id, caseId: row.case_id, authorType: row.author_type, authorUserId: row.author_user_id, visibility: row.visibility, message: row.message, createdAt: row.created_at.toISOString() }
}

async function nextCaseNumber(client: PoolClient) {
  const result = await client.query<{ n: string }>("select nextval('support_case_number_seq')::text as n")
  return `BS-${result.rows[0]?.n ?? '1042'}`
}

export async function listTenantSupportCases(context: { organizationId: string; userId: string }) {
  return withTenantTransaction(context, async (client) => {
    const cases = await client.query<CaseRow>(`select ${caseColumns} from support_cases where organization_id=$1 order by updated_at desc limit 100`, [context.organizationId])
    return cases.rows.map(mapCase)
  })
}

export async function getTenantSupportThread(context: { organizationId: string; userId: string }, caseId: string) {
  return withTenantTransaction(context, async (client) => {
    const c = await client.query<CaseRow>(`select ${caseColumns} from support_cases where organization_id=$1 and id=$2`, [context.organizationId, caseId])
    if (!c.rows[0]) return null
    const m = await client.query<MessageRow>(`select id,case_id,author_type,author_user_id,visibility,message,created_at from support_messages where case_id=$1 and visibility='customer' order by created_at`, [caseId])
    return { case: mapCase(c.rows[0]), messages: m.rows.map(mapMessage) }
  })
}

export async function createTenantSupportCase(input: { organizationId: string; userId: string; actorName: string; caseType: SupportCaseType; category: SupportCaseCategory; subject: string; message: string; currentPage?: string; entityType?: string; entityId?: string; buildVersion?: string; browser?: string; correlationId?: string }) {
  return withTenantTransaction({ organizationId: input.organizationId, userId: input.userId }, async (client) => {
    const caseNumber = await nextCaseNumber(client)
    const result = await client.query<CaseRow>(`insert into support_cases(case_number,organization_id,created_by_user_id,case_type,category,subject,status,current_page,entity_type,entity_id,build_version,browser,correlation_id,is_pilot_related,priority) values($1,$2,$3,$4,$5,$6,'open',$7,$8,$9,$10,$11,$12,(select is_pilot_customer from organizations where id=$2),'normal') returning ${caseColumns}`, [caseNumber,input.organizationId,input.userId,input.caseType,input.category,input.subject,input.currentPage??null,input.entityType??null,input.entityId??null,input.buildVersion??null,input.browser??null,input.correlationId??null])
    await client.query(`insert into support_messages(case_id,author_type,author_user_id,visibility,message) values($1,'customer',$2,'customer',$3)`, [result.rows[0].id,input.userId,input.message])
    await client.query(`insert into audit_events(organization_id,actor_user_id,actor_name,action,entity_type,entity_id,detail) values($1,$2,$3,'support.case.created','support_case',$4,$5)`, [input.organizationId,input.userId,input.actorName,result.rows[0].id,caseNumber])
    return mapCase(result.rows[0])
  })
}

export async function addTenantSupportMessage(input: { organizationId: string; userId: string; caseId: string; message: string }) {
  return withTenantTransaction({ organizationId: input.organizationId, userId: input.userId }, async (client) => {
    const own = await client.query(`select id from support_cases where organization_id=$1 and id=$2`,[input.organizationId,input.caseId])
    if (!own.rowCount) throw new Error('Supportfall wurde nicht gefunden.')
    const result = await client.query<MessageRow>(`insert into support_messages(case_id,author_type,author_user_id,visibility,message) values($1,'customer',$2,'customer',$3) returning id,case_id,author_type,author_user_id,visibility,message,created_at`,[input.caseId,input.userId,input.message])
    await client.query(`update support_cases set status=case when status in ('resolved','closed') then 'open' else status end,resolved_at=null,updated_at=now() where id=$1`,[input.caseId])
    return mapMessage(result.rows[0])
  })
}

export async function listPlatformSupportCases() {
  const c = await platformQuery<CaseRow & { organization_name: string }>(`select ${caseColumns.split(',').map(c=>`c.${c}`).join(',')},o.name as organization_name from support_cases c join organizations o on o.id=c.organization_id order by case c.status when 'open' then 0 when 'in_progress' then 1 when 'waiting_for_customer' then 2 else 3 end,case c.priority when 'urgent' then 0 when 'high' then 1 when 'normal' then 2 else 3 end,c.updated_at desc limit 500`)
  return c.rows.map(row => ({ ...mapCase(row), organizationName: row.organization_name }))
}

export async function getPlatformSupportThread(caseId: string) {
  const c = await platformQuery<CaseRow & { organization_name: string }>(`select ${caseColumns.split(',').map(c=>`c.${c}`).join(',')},o.name as organization_name from support_cases c join organizations o on o.id=c.organization_id where c.id=$1`,[caseId])
  if (!c.rows[0]) return null
  const m = await platformQuery<MessageRow>(`select id,case_id,author_type,author_user_id,visibility,message,created_at from support_messages where case_id=$1 order by created_at`,[caseId])
  return { case: { ...mapCase(c.rows[0]), organizationName: c.rows[0].organization_name }, messages: m.rows.map(mapMessage) }
}

export async function platformUpdateSupportCase(input:{caseId:string; userId:string; email:string; message?:string; internalNote?:string; status:SupportCaseStatus; caseType:SupportCaseType; classification?:SupportCaseClassification; priority:SupportCasePriority; assignedToUserId?:string}) {
  const current = await platformQuery<{organization_id:string;first_response_at:Date|null}>(`select organization_id,first_response_at from support_cases where id=$1`,[input.caseId])
  if (!current.rows[0]) throw new Error('Supportfall wurde nicht gefunden.')
  const message = input.message?.trim() ?? ''
  const internalNote = input.internalNote?.trim() ?? ''
  let createdMessage: SupportMessage | null = null
  if (message) {
    const m = await platformQuery<MessageRow>(`insert into support_messages(case_id,author_type,author_user_id,visibility,message) values($1,'operator',$2,'customer',$3) returning id,case_id,author_type,author_user_id,visibility,message,created_at`,[input.caseId,input.userId,message])
    createdMessage = mapMessage(m.rows[0])
  }
  if (internalNote) {
    await platformQuery(`insert into support_messages(case_id,author_type,author_user_id,visibility,message) values($1,'operator',$2,'internal',$3)`,[input.caseId,input.userId,internalNote])
  }
  await platformQuery(`update support_cases set status=$2,case_type=$3,classification=$4,priority=$5,assigned_to_user_id=$6,first_response_at=case when first_response_at is null and $7::boolean then now() else first_response_at end,resolved_at=case when $2 in ('resolved','closed') then coalesce(resolved_at,now()) else null end,updated_at=now() where id=$1`,[input.caseId,input.status,input.caseType,input.classification??null,input.priority,input.assignedToUserId??null,Boolean(message)])
  await platformQuery(`insert into platform_audit_events(actor_user_id,actor_email,action,detail) values($1,$2,'support.case.updated',$3)`,[input.userId,input.email,`${input.caseId}; ${input.caseType}; ${input.status}; ${input.priority}; ${input.classification??'none'}`])
  return createdMessage
}
