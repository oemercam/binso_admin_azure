import 'server-only'
import { platformQuery } from '@/lib/db/client'
import type { PlatformRole } from '@/types/domain'

export type PlatformOperatorAssignment = {
  userId: string
  email: string
  role: PlatformRole
  status: 'active'|'suspended'
  createdAt: string
  updatedAt: string
}

export async function findPlatformOperatorAssignment(userId: string, email: string) {
  const result = await platformQuery<{user_id:string;email:string;role:PlatformRole;status:'active'|'suspended';created_at:Date;updated_at:Date}>(
    `select user_id,email,role,status,created_at,updated_at
       from platform_operator_assignments
      where user_id=$1 or lower(email)=lower($2)
      order by case when user_id=$1 then 0 else 1 end
      limit 1`,
    [userId,email],
  )
  const row = result.rows[0]
  return row ? { userId:row.user_id,email:row.email,role:row.role,status:row.status,createdAt:row.created_at.toISOString(),updatedAt:row.updated_at.toISOString() } satisfies PlatformOperatorAssignment : null
}

export async function listPlatformOperators(): Promise<PlatformOperatorAssignment[]> {
  const result=await platformQuery<{user_id:string;email:string;role:PlatformRole;status:'active'|'suspended';created_at:Date;updated_at:Date}>(`select user_id,email,role,status,created_at,updated_at from platform_operator_assignments order by lower(email)`)
  return result.rows.map(row=>({userId:row.user_id,email:row.email,role:row.role,status:row.status,createdAt:row.created_at.toISOString(),updatedAt:row.updated_at.toISOString()}))
}

export async function upsertPlatformOperator(input:{userId:string;email:string;role:PlatformRole;status:'active'|'suspended';actorUserId:string;actorEmail:string;reason:string}) {
  await platformQuery(`insert into platform_operator_assignments(user_id,email,role,status,created_by_user_id,updated_by_user_id)
    values($1,$2,$3,$4,$5,$5)
    on conflict(user_id) do update set email=excluded.email,role=excluded.role,status=excluded.status,updated_by_user_id=excluded.updated_by_user_id,updated_at=now()`,[input.userId,input.email.toLowerCase(),input.role,input.status,input.actorUserId])
  await platformQuery(`insert into platform_audit_events(actor_user_id,actor_email,action,detail) values($1,$2,'operator.assignment.updated',$3)`,[input.actorUserId,input.actorEmail,`${input.email}; ${input.role}; ${input.status}; ${input.reason}`])
}
