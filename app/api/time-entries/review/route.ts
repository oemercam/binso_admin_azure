import {NextRequest} from 'next/server';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {withTenant} from '@/lib/server/db';
import {reviewTimeEntry} from '@/lib/server/repositories/time-review';

/** All selected transitions and their audit events commit together or all roll back. */
export async function POST(request:NextRequest){
 try{
  assertSameOrigin(request);
  const s=await requireSession();authorize(s,'time:write');
  const body=await readJson<{ids?:unknown;action?:unknown}>(request,8192);
  const {ids,action}=body;
  if(!Array.isArray(ids)||ids.length<1||ids.length>100||new Set(ids).size!==ids.length||ids.some(id=>typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))||action!=='submit'&&action!=='approve')throw new ApiError(400,'invalid_review_selection','Bitte 1 bis 100 Zeiteinträge auswählen.');
  const items=await withTenant(s.organizationId,s.userId,async c=>{
   const items=[];
   // Stable lock order prevents two overlapping selections from deadlocking.
   for(const id of [...ids].sort())items.push(await reviewTimeEntry(c,s,id,{action}));
   return items;
  });
  return json({items});
 }catch(error){return apiError(error)}
}
