import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {customerActivity} from '@/lib/server/repositories/customer-activity';
import {withTenant} from '@/lib/server/db';
import {apiError,json} from '@/lib/server/http';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{const s=await requireSession();authorize(s,'customers:read');const {id}=await params;
 const items=await withTenant(s.organizationId,s.userId,c=>customerActivity(c,s,id));return json({items});}catch(e){return apiError(e)}}
