import {idempotentBusiness} from "@/lib/server/business-idempotency";
import {fileRelations} from "@/lib/server/file-relations";
import {validateFileContent} from "@/lib/server/file-validation";
import {scanFile} from "@/lib/server/file-scan";
import {createHash,randomUUID} from "node:crypto";
import {limitsConfig,megabytes} from "@/config/limits";
import {NextRequest} from "next/server";
import {requireSession} from "@/lib/server/session";
import {tenantCan} from "@/lib/permissions";
import {authorize} from "@/lib/server/rbac";
import {withTenant} from "@/lib/server/db";
import {ApiError,apiError,assertSameOrigin,json,readBoundedBody} from "@/lib/server/http";
export const runtime="nodejs";
const allowed=new Set(["application/pdf","image/png","image/jpeg","image/webp","text/plain","text/csv"]);

const relations=fileRelations;
const fileFields=`id,purpose,expense_id,support_case_id,employee_id,customer_id,invoice_id,quote_id,project_id,original_name as "fileName",content_type as "mimeType",size_bytes as "sizeBytes",scan_status as "scanStatus",created_at as "createdAt"`;
export async function GET(request:NextRequest){try{
 const s=await requireSession();authorize(s,'documents:read');
 const filters=new URLSearchParams(request.nextUrl.search);const where=['organization_id=$1'];const values:unknown[]=[s.organizationId];
 for(const relation of Object.values(relations)){const value=filters.get(relation.filter);if(value){authorize(s,relation.read);values.push(value);where.push(relation.column+'::text=$'+values.length);}}
 for(const [purpose,relation] of Object.entries(relations)){if(!tenantCan(s.role,relation.read)){values.push(purpose);where.push('purpose<>$'+values.length);}}
 if(s.role==='member'){values.push(s.userId);where.push("(purpose<>'expense_receipt' or exists(select 1 from expenses e where e.id=file_objects.expense_id and e.organization_id=file_objects.organization_id and e.created_by_user_id=$"+values.length+"))");}
 const items=await withTenant(s.organizationId,s.userId,async c=>(await c.query(`select ${fileFields} from file_objects where ${where.join(' and ')} order by created_at desc limit 500`,values)).rows);
 return json({items});
}catch(e){return apiError(e)}}
export async function POST(request:NextRequest){
 try{
  assertSameOrigin(request);const s=await requireSession();
  const replayKey=request.headers.get("idempotency-key")||"";
  if(replayKey.length<8||replayKey.length>128)throw new ApiError(400,"idempotency_required","Idempotency-Key fehlt oder ist ungültig.");
  const bytes=await readBoundedBody(request,limitsConfig.maxFileUploadBytes+64*1024);
  const form=await new Response(new Uint8Array(bytes),{headers:{'content-type':request.headers.get('content-type')||''}}).formData(),file=form.get('file'),purpose=String(form.get('purpose')||'document'),entityId=String(form.get('entityId')||'');
  if(!(file instanceof File))throw new ApiError(400,'file_required','Datei fehlt.');
  if(file.size>limitsConfig.maxFileUploadBytes)throw new ApiError(413,'file_too_large',`Datei ist grösser als ${megabytes(limitsConfig.maxFileUploadBytes)} MB.`);
  if(!allowed.has(file.type))throw new ApiError(400,'file_type_invalid','Dateityp ist nicht erlaubt.');
  const relation=relations[purpose];
  if(purpose==='document')authorize(s,'documents:write');
  if(!relation&&!['document','company_logo','profile_avatar'].includes(purpose))throw new ApiError(400,'purpose_invalid','Ungültiger Dateizweck.');
  if(relation){
   authorize(s,relation.write);
   if(!/^[0-9a-f-]{36}$/i.test(entityId))throw new ApiError(400,'entity_required','Eine gültige Zuordnung ist erforderlich.');
   const found=await withTenant(s.organizationId,s.userId,async c=>(await c.query(`select id from ${relation.table} where id=$1 and organization_id=$2${purpose==='expense_receipt'&&s.role==='member'?' and created_by_user_id=$3':''}`,purpose==='expense_receipt'&&s.role==='member'?[entityId,s.organizationId,s.userId]:[entityId,s.organizationId])).rows[0]);
   if(!found)throw new ApiError(404,'entity_not_found','Zuordnung wurde nicht gefunden.');
  }
  if(['company_logo','profile_avatar'].includes(purpose)){if(purpose==='company_logo')authorize(s,'organization:write');if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new ApiError(400,'logo_type_invalid','Bitte eine Bilddatei auswählen.');}
  const id=randomUUID(),ext=(file.name.split('.').pop()||'bin').replace(/[^a-zA-Z0-9]/g,'').slice(0,8),objectKey=`${s.organizationId}/files/${id}.${ext}`,buffer=Buffer.from(await file.arrayBuffer());
  if(!file.size)throw new ApiError(400,'file_empty','Die Datei ist leer.');
  validateFileContent(buffer,file.type);
  const sha256=createHash('sha256').update(buffer).digest('hex');
  const item=await withTenant(s.organizationId,s.userId,async c=>idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:"file-upload",key:replayKey,body:{sha256,fileName:file.name,mimeType:file.type,size:file.size,purpose,entityId}},async()=>{
   if(purpose==='expense_receipt'){
    const expense=(await c.query("select status,created_by_user_id from expenses where organization_id=$1 and id=$2 for update",[s.organizationId,entityId])).rows[0];
    if(!expense||s.role==='member'&&expense.created_by_user_id!==s.userId)throw new ApiError(404,'not_found','Spese wurde nicht gefunden.');
    if(['approved','posted'].includes(expense.status))throw new ApiError(409,'expense_locked','Belege genehmigter Spesen können nicht geändert werden.');
   }
   const scanStatus=await scanFile(buffer);
   if(scanStatus==='rejected')throw new ApiError(422,'file_scan_rejected','Die Datei wurde von der Sicherheitsprüfung abgelehnt.');
   const result=await c.query(`insert into file_objects(id,organization_id,object_key,original_name,content_type,size_bytes,sha256,scan_status,created_by,blob_url,purpose,expense_id,support_case_id,employee_id,customer_id,invoice_id,quote_id,project_id)
    values($1,$2,$3,$4,$5,$6,$7,$18,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) returning ${fileFields}`,[id,s.organizationId,objectKey,file.name.slice(0,240),file.type,file.size,sha256,s.userId,null,purpose,relation?.column==='expense_id'?entityId:null,relation?.column==='support_case_id'?entityId:null,relation?.column==='employee_id'?entityId:null,relation?.column==='customer_id'?entityId:null,relation?.column==='invoice_id'?entityId:null,relation?.column==='quote_id'?entityId:null,relation?.column==='project_id'?entityId:null,scanStatus]);
   await c.query('insert into file_contents(file_id,organization_id,body) values($1,$2,$3)',[id,s.organizationId,buffer]);
   if(scanStatus==='clean'&&purpose==='profile_avatar')await c.query('update app_users set avatar_url=$1,updated_at=now() where id=$2',['/api/files/'+id+'/download',s.userId]);
   if(scanStatus==='clean'&&purpose==='company_logo')await c.query('update organizations set logo_url=$1,updated_at=now() where id=$2',['/api/files/'+id+'/download',s.organizationId]);
   return result.rows[0];
  }));
  return json({item},201);
 }catch(e){return apiError(e)}
}
