import { requireOperatorSession } from '@/lib/server/operator/session';
import { authorizeOperator } from '@/lib/server/operator/rbac';
import { withPlatform } from '@/lib/server/db';
import { apiError,json } from '@/lib/server/http';
export async function GET(){
 try{const s=await requireOperatorSession();authorizeOperator(s,'platform:read');
 const result=await withPlatform(async c=>{
  const stats=await c.query(`select count(*) filter(where t.status='open')::int tickets_open,count(*) filter(where t.status='in_progress')::int tickets_in_progress,count(*) filter(where t.status='resolved')::int tickets_resolved from support_cases t join organizations o on o.id=t.organization_id where not o.is_demo`);
  const users=await c.query("select count(distinct a.user_id)::int users_active from auth_sessions a join organizations o on o.id=a.organization_id where not o.is_demo and a.expires_at>now() and a.last_seen_at>now()-interval '15 minutes'");
  const tickets=await c.query("select t.id,t.subject,t.status,json_build_object('name',o.name) tenant from support_cases t join organizations o on o.id=t.organization_id where not o.is_demo order by t.updated_at desc limit 6");
  const incidents=await c.query("select id,title,status,started_at,'Plattform' service from platform_incidents where status<>'resolved' order by started_at desc limit 5");
  return {stats:{...stats.rows[0],...users.rows[0]},tickets:tickets.rows,incidents:incidents.rows};
 });return json(result)}catch(e){return apiError(e)}
}
