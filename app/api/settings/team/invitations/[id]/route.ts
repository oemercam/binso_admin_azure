import {NextRequest} from "next/server";
import {apiError,assertSameOrigin,json} from "@/lib/server/http";
import {requireSession} from "@/lib/server/session";
import {authorize} from "@/lib/server/rbac";
import {withTenant} from "@/lib/server/db";
import {audit} from "@/lib/server/audit";
export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{
 assertSameOrigin(request);const s=await requireSession();authorize(s,'users:manage');const {id}=await params;
 const item=await withTenant(s.organizationId,s.userId,async c=>{
  const updated=await c.query("update organization_invitations set status='revoked' where organization_id=$1 and id::text=$2 and status='pending' returning id",[s.organizationId,id]);
  if(updated.rows[0])await c.query("update mail_outbox set status='cancelled',updated_at=now() where organization_id=$1 and kind='invitation' and entity_id=$2 and status in ('queued','failed')",[s.organizationId,id]);
  if(updated.rows[0])await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'invitation.revoked',entityType:'organization_invitations',entityId:id});return updated.rows[0];
 });return item?json({ok:true}):json({error:'not_found',message:'Offene Einladung wurde nicht gefunden.'},404);
}catch(e){return apiError(e)}}
