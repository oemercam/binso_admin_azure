import 'server-only'
import { query } from '@/lib/db/client'
import type { PlatformFeatureFlag } from '@/types/domain'

export async function listPlatformAudit(limit=200) {
  const result=await query(`select id,actor_user_id,actor_email,action,tenant_id,detail,created_at from platform_audit_events order by created_at desc limit $1`,[Math.min(Math.max(limit,1),500)])
  return result.rows
}
export async function listFeatureFlags():Promise<PlatformFeatureFlag[]> {
  const r=await query<{key:string;description:string;enabled:boolean;updated_at:Date}>(`select key,description,enabled,updated_at from platform_feature_flags order by key`)
  return r.rows.map(x=>({key:x.key,description:x.description,enabled:x.enabled,updatedAt:x.updated_at.toISOString()}))
}
export async function setFeatureFlag(input:{key:string;enabled:boolean;userId:string;email:string;reason:string}) {
  const r=await query<{key:string;description:string;enabled:boolean;updated_at:Date}>(`update platform_feature_flags set enabled=$2,updated_by_user_id=$3,updated_at=now() where key=$1 returning key,description,enabled,updated_at`,[input.key,input.enabled,input.userId])
  if(!r.rows[0]) throw new Error('Feature Flag wurde nicht gefunden.')
  await query(`insert into platform_audit_events(actor_user_id,actor_email,action,detail) values($1,$2,'feature_flag.updated',$3)`,[input.userId,input.email,`${input.key}: ${input.enabled}; ${input.reason}`])
  return {key:r.rows[0].key,description:r.rows[0].description,enabled:r.rows[0].enabled,updatedAt:r.rows[0].updated_at.toISOString()}
}
