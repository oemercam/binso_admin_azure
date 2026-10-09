import {apiError,json} from '@/lib/server/http';
import {authorize} from '@/lib/server/rbac';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {financeData} from '@/lib/server/repositories/finance';
export async function GET(){
 try{const s=await requireSession();authorize(s,'accounting:read');return json(await withTenant(s.organizationId,s.userId,c=>financeData(c,s.organizationId),{snapshot:true}));}
 catch(error){return apiError(error);}
}
