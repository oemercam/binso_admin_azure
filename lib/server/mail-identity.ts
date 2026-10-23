import 'server-only';
import type {PoolClient} from 'pg';
/** Reply-To is an active, verified member address of this tenant, never arbitrary input. */
export async function verifiedMailReplyTo(c:PoolClient,organizationId:string,candidate:unknown):Promise<string|undefined>{
 if(typeof candidate!=='string'||!candidate.trim())return undefined;
 return (await c.query<{email:string}>("select u.email from app_users u join organization_memberships m on m.user_id=u.id where m.organization_id=$1 and m.status='active' and u.status='active' and u.email_verified_at is not null and lower(u.email)=lower($2) limit 1",[organizationId,candidate])).rows[0]?.email;
}
