import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {withTenant} from '@/lib/server/db';
import {audit} from '@/lib/server/audit';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';

/** Explicit customer reopening; no silent status change when posting a reply. */
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{
 assertSameOrigin(request);const s=await requireSession();authorize(s,'support:write');
 const body=await readJson<{action?:unknown}>(request,1024);
 if(body.action!=='reopen')throw new ApiError(400,'invalid_transition','Ungültige Ticketaktion.');
 const {id}=await params;
 const item=await withTenant(s.organizationId,s.userId,async c=>{
  const previous=(await c.query('select id,status from support_cases where organization_id=$1 and id::text=$2 for update',[s.organizationId,id])).rows[0];
  if(!previous)throw new ApiError(404,'not_found','Ticket wurde nicht gefunden.');
  if(previous.status==='open')return previous;
  if(!['resolved','closed'].includes(previous.status))throw new ApiError(409,'invalid_transition','Dieses Ticket ist bereits in Bearbeitung.');
  const result=(await c.query("update support_cases set status='open',updated_at=now() where organization_id=$1 and id=$2 returning id,status",[s.organizationId,previous.id])).rows[0];
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'support.reopened',entityType:'support_case',entityId:previous.id,metadata:{previousStatus:previous.status}});
  return result;
 });return json({item});
}catch(error){return apiError(error)}}
