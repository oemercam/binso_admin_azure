import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {withTenant} from '@/lib/server/db';
import {audit} from '@/lib/server/audit';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
export async function GET(){try{const s=await requireSession();authorize(s,'time:read');return json(await withTenant(s.organizationId,s.userId,async c=>(await c.query('select time_approval_required from organizations where id=$1',[s.organizationId])).rows[0]));}catch(e){return apiError(e)}}
export async function PATCH(request:NextRequest){try{assertSameOrigin(request);const s=await requireSession();authorize(s,'organization:write');const body=await readJson<{required?:unknown}>(request,1024);if(typeof body.required!=='boolean')throw new ApiError(400,'policy_invalid','Ungültige Freigabeeinstellung.');const item=await withTenant(s.organizationId,s.userId,async c=>{const row=(await c.query('update organizations set time_approval_required=$2 where id=$1 returning time_approval_required',[s.organizationId,body.required])).rows[0];await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'time.approval_policy_changed',entityType:'organization',entityId:s.organizationId});return row;});return json(item);}catch(e){return apiError(e)}}
