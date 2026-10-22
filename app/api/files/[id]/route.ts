import {fileRelations} from '@/lib/server/file-relations';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {withTenant} from '@/lib/server/db';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {audit} from '@/lib/server/audit';
import {requireModuleEntitlement} from '@/lib/server/plan-access';
import {NextRequest} from 'next/server';

export const runtime='nodejs';
/** Explicit adoption after a controlled rescan; never a scanner bypass or an
 * automatic replacement of a newer profile image. */
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{
  assertSameOrigin(request);const s=await requireSession(),{id}=await params;
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw new ApiError(404,'not_found','Datei wurde nicht gefunden.');
  const body=await readJson<{action?:unknown;expectedAvatarUrl?:unknown}>(request,4096);
  if(body.action!=='activate_profile_avatar'||body.expectedAvatarUrl!==null&&(typeof body.expectedAvatarUrl!=='string'||body.expectedAvatarUrl.length>2048||/[\u0000-\u001f]/.test(body.expectedAvatarUrl)))throw new ApiError(400,'invalid_avatar_action','Ungültige Profilbild-Anfrage.');
  const expected=body.expectedAvatarUrl||null;
  const item=await withTenant(s.organizationId,s.userId,async c=>{
   const file=(await c.query(`select f.id,f.created_by,f.scan_status,f.purpose,f.content_type from file_objects f join file_contents b on b.file_id=f.id and b.organization_id=f.organization_id where f.id=$1 and f.organization_id=$2 and f.archived_at is null for update of f`,[id,s.organizationId])).rows[0];
   if(!file||file.created_by!==s.userId||file.purpose!=='profile_avatar')throw new ApiError(404,'not_found','Datei wurde nicht gefunden.');
   if(file.scan_status!=='clean'||!['image/png','image/jpeg','image/webp'].includes(file.content_type))throw new ApiError(409,'avatar_not_ready','Das Profilbild ist noch nicht sicher freigegeben. Das bisherige Bild bleibt erhalten.');
   const profile=(await c.query('select avatar_url from app_users where id=$1 for update',[s.userId])).rows[0];
   if(!profile)throw new ApiError(404,'not_found','Profil wurde nicht gefunden.');
   const canonicalId=String(file.id),target='/api/files/'+canonicalId+'/download';if(profile.avatar_url===target)return {id:canonicalId,alreadyActive:true};
   if((profile.avatar_url||null)!==expected)throw new ApiError(409,'avatar_changed','Das Profilbild wurde inzwischen geändert. Bitte den aktuellen Stand prüfen.');
   await c.query('update app_users set avatar_url=$1,updated_at=now() where id=$2',[target,s.userId]);
   await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'avatar_activated',entityType:'file',entityId:canonicalId});
   return {id:canonicalId,alreadyActive:false};
  });
  return json({item,activated:true});
 }catch(error){return apiError(error);}
}
export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{
  assertSameOrigin(request);const s=await requireSession(),{id}=await params;
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw new ApiError(404,'not_found','Datei wurde nicht gefunden.');
  await withTenant(s.organizationId,s.userId,async c=>{
   const file=(await c.query('select * from file_objects where id=$1 and organization_id=$2 for update',[id,s.organizationId])).rows[0];
   if(!file)throw new ApiError(404,'not_found','Datei wurde nicht gefunden.');
   const relation=fileRelations[file.purpose];
   if(file.purpose==='profile_avatar'){
    if(file.created_by!==s.userId)throw new ApiError(404,'not_found','Datei wurde nicht gefunden.');
    await c.query("update app_users set avatar_url=null,updated_at=now() where id=$1 and avatar_url=$2",[s.userId,'/api/files/'+id+'/download']);
    if(!file.archived_at)await c.query('update file_objects set archived_at=now(),archived_by_user_id=$3 where id=$1 and organization_id=$2',[id,s.organizationId,s.userId]);
    await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'avatar_removed',entityType:'file',entityId:id});return;
   }
   if(!relation&&file.purpose!=='document')throw new ApiError(403,'file_forbidden','Diese Datei kann hier nicht entfernt werden.');
   authorize(s,relation?.write??'documents:write');
   if(file.purpose==='document')await requireModuleEntitlement(s.organizationId,'dokumente');
   if(file.purpose==='supplier_invoice_receipt')await requireModuleEntitlement(s.organizationId,'lieferanten');
   if(file.created_by!==s.userId&&!['owner','admin'].includes(s.role))throw new ApiError(403,'file_forbidden','Nur eigene Anhänge können entfernt werden.');
   if(s.moduleProfile==='time_only'&&!['time_report','support_attachment'].includes(file.purpose))throw new ApiError(403,'file_forbidden','Keine Berechtigung für diese Datei.');
   if(relation){
    const entity=(await c.query(`select * from ${relation.table} where id=$1 and organization_id=$2 for update`,[file[relation.column],s.organizationId])).rows[0];
    if(!entity)throw new ApiError(404,'not_found','Zuordnung wurde nicht gefunden.');
    if(file.purpose==='supplier_invoice_receipt'&&entity.status!=='draft')throw new ApiError(409,'attachment_locked','Anhänge abgeschlossener oder eingereichter Vorgänge bleiben erhalten.');
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
