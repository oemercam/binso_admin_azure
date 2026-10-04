import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {withTenant} from '@/lib/server/db';
import {apiError,json} from '@/lib/server/http';
export async function GET(){try{const s=await requireSession();authorize(s,'projects:read');return json({items:await withTenant(s.organizationId,s.userId,async c=>(await c.query('select id,name,customer_id from projects where organization_id=$1 and archived_at is null order by name',[s.organizationId])).rows)});}catch(e){return apiError(e)}}
