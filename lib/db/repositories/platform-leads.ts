import 'server-only'
import { platformQuery } from '@/lib/db/client'

export type PlatformLead = {
  id: string
  name: string
  company?: string
  email: string
  topic: 'general'|'sales'|'pilot'|'partnership'
  message: string
  status: 'new'|'contacted'|'qualified'|'pilot'|'converted'|'closed'
  assignedToUserId?: string
  internalNotes?: string
  convertedOrganizationId?: string
  createdAt: string
  updatedAt: string
}

export async function listPlatformLeads(): Promise<PlatformLead[]> {
  const result = await platformQuery<{id:string;name:string;company:string|null;email:string;topic:PlatformLead['topic'];message:string;status:PlatformLead['status'];assigned_to_user_id:string|null;internal_notes:string|null;converted_organization_id:string|null;created_at:Date;updated_at:Date}>(
    `select id,name,company,email,topic,message,status,assigned_to_user_id,internal_notes,converted_organization_id,created_at,updated_at from public_leads order by case status when 'new' then 0 when 'contacted' then 1 when 'qualified' then 2 else 3 end,updated_at desc limit 500`
  )
  return result.rows.map(row => ({id:row.id,name:row.name,company:row.company??undefined,email:row.email,topic:row.topic,message:row.message,status:row.status,assignedToUserId:row.assigned_to_user_id??undefined,internalNotes:row.internal_notes??undefined,convertedOrganizationId:row.converted_organization_id??undefined,createdAt:row.created_at.toISOString(),updatedAt:row.updated_at.toISOString()}))
}

export async function updatePlatformLead(input:{id:string;status:PlatformLead['status'];internalNotes?:string;convertedOrganizationId?:string;actorUserId:string;actorEmail:string}){
  const r=await platformQuery(`update public_leads set status=$2,internal_notes=$3,assigned_to_user_id=coalesce(assigned_to_user_id,$4),converted_organization_id=$5,updated_at=now() where id=$1 returning id`,[input.id,input.status,input.internalNotes??null,input.actorUserId,input.convertedOrganizationId??null])
  if(!r.rowCount)throw new Error('Lead wurde nicht gefunden.')
  await platformQuery(`insert into platform_audit_events(actor_user_id,actor_email,action,detail) values($1,$2,'lead.updated',$3)`,[input.actorUserId,input.actorEmail,`${input.id}; ${input.status}`])
}
