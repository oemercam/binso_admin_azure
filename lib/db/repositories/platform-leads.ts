import 'server-only'
import { query } from '@/lib/db/client'

export type PlatformLead = {
  id: string
  name: string
  company?: string
  email: string
  topic: 'general'|'sales'|'pilot'|'partnership'
  message: string
  status: 'new'|'contacted'|'qualified'|'pilot'|'converted'|'closed'
  createdAt: string
}

export async function listPlatformLeads(): Promise<PlatformLead[]> {
  const result = await query<{id:string;name:string;company:string|null;email:string;topic:PlatformLead['topic'];message:string;status:PlatformLead['status'];created_at:Date}>(
    `select id,name,company,email,topic,message,status,created_at from public_leads order by case status when 'new' then 0 when 'contacted' then 1 when 'qualified' then 2 else 3 end,created_at desc limit 250`
  )
  return result.rows.map(row => ({id:row.id,name:row.name,company:row.company??undefined,email:row.email,topic:row.topic,message:row.message,status:row.status,createdAt:row.created_at.toISOString()}))
}
