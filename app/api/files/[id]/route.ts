import {fileRelations} from '@/lib/server/file-relations';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {withTenant} from '@/lib/server/db';
import {ApiError,apiError,assertSameOrigin,json} from '@/lib/server/http';
import {audit} from '@/lib/server/audit';
import {requireModuleEntitlement} from '@/lib/server/plan-access';
import {NextRequest} from 'next/server';

export const runtime='nodejs';
export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{
  assertSameOrigin(request);const s=await requireSession(),{id}=await params;
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw new ApiError(404,'not_found','Datei wurde nicht gefunden.');
  await withTenant(s.organizationId,s.userId,async c=>{
   const file=(await c.query('select * from file_objects where id=$1 and organization_id=$2 for update',[id,s.organizationId])).rows[0];
   if(!file)throw new ApiError(404,'not_found','Datei wurde nicht gefunden.');
   const relation=fileRelations[file.purpose];
   if(!relation&&file.purpose!=='document')throw new ApiError(403,'file_forbidden','Diese Datei kann hier nicht entfernt werden.');
   authorize(s,relation?.write??'documents:write');
   if(file.purpose==='document')await requireModuleEntitlement(s.organizationId,'dokumente');
   if(file.created_by!==s.userId&&!['owner','admin'].includes(s.role))throw new ApiError(403,'file_forbidden','Nur eigene Anhänge können entfernt werden.');
   if(s.moduleProfile==='time_only'&&!['time_report','support_attachment'].includes(file.purpose))throw new ApiError(403,'file_forbidden','Keine Berechtigung für diese Datei.');
   if(relation){
    const entity=(await c.query(`select * from ${relation.table} where id=$1 and organization_id=$2 for update`,[file[relation.column],s.organizationId])).rows[0];
    if(!entity)throw new ApiError(404,'not_found','Zuordnung wurde nicht gefunden.');
    if((file.purpose==='time_report'&&(entity.created_by_user_id!==s.userId&&!['owner','admin'].includes(s.role)))||(file.purpose==='expense_receipt'&&s.role==='member'&&entity.created_by_user_id!==s.userId)||(file.purpose==='support_attachment'&&s.moduleProfile==='time_only'&&entity.created_by_user_id!==s.userId))throw new ApiError(404,'not_found','Datei wurde nicht gefunden.');
    if(file.purpose==='time_report'&&(entity.approved||entity.submitted_at)||file.purpose==='expense_receipt'&&['approved','posted'].includes(entity.status)||['invoice_attachment','offer_attachment'].includes(file.purpose)&&entity.status!=='draft')throw new ApiError(409,'attachment_locked','Anhänge abgeschlossener oder eingereichter Vorgänge bleiben erhalten.');
   }
   if(file.archived_at)return;
   await c.query('update file_objects set archived_at=now(),archived_by_user_id=$3 where id=$1 and organization_id=$2',[id,s.organizationId,s.userId]);
   await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'file_archived',entityType:'file',entityId:id,metadata:{purpose:file.purpose}});
  });
  return json({removed:true});
 }catch(error){return apiError(error);}
}
