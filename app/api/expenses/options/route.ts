import {json,apiError} from "@/lib/server/http";
import {requireSession} from "@/lib/server/session";
import {authorize} from "@/lib/server/rbac";
import {withTenant} from "@/lib/server/db";
import {ownRecordOnly} from "@/lib/permissions";
export async function GET(){try{const s=await requireSession();authorize(s,'expenses:read');
 const items=await withTenant(s.organizationId,s.userId,async c=>(await c.query("select id,coalesce(first_name,split_part(name,' ',1)) first_name,coalesce(last_name,substring(name from position(' ' in name)+1)) last_name from employees where organization_id=$1 and archived_at is null and ($2::boolean=false or lower(email)=lower($3)) order by name",[s.organizationId,ownRecordOnly(s.role,'spesen'),s.email])).rows);return json({items});
}catch(e){return apiError(e)}}
