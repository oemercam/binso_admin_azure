import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {withTenant} from '@/lib/server/db';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
export async function GET(){try{
 const s=await requireSession();authorize(s,'time:read');
 return json(await withTenant(s.organizationId,s.userId,async c=>(await c.query('select not app_is_solo_owner() as time_approval_required')).rows[0]));
}catch(e){return apiError(e)}}
/** Old clients may confirm the effective invariant but cannot disable review. */
export async function PATCH(request:NextRequest){try{
 assertSameOrigin(request);const s=await requireSession();authorize(s,'organization:write');
 const body=await readJson<{required?:unknown}>(request,1024);
 if(typeof body.required!=='boolean')throw new ApiError(400,'policy_invalid','Ungültige Freigabeeinstellung.');
 return json(await withTenant(s.organizationId,s.userId,async c=>{
  const row=(await c.query('select not app_is_solo_owner() as time_approval_required')).rows[0];
  if(body.required!==row.time_approval_required)throw new ApiError(409,'independent_review_required','Die Freigabe folgt der aktiven Teamzuordnung und kann hier nicht geändert werden.');
  return row;
 }));
}catch(e){return apiError(e)}}
