import {NextRequest} from "next/server";
import {randomUUID} from "node:crypto";
import {requireSession} from "@/lib/server/session";
import {authorize} from "@/lib/server/rbac";
import {putBlob} from "@/lib/server/storage";
import {withTenant} from "@/lib/server/db";
import {apiError,assertSameOrigin,json} from "@/lib/server/http";

export const runtime="nodejs";
const allowed=new Set(["application/pdf","image/png","image/jpeg","image/webp","text/plain","text/csv"]);

export async function POST(request:NextRequest){
 try{
  assertSameOrigin(request);
  const s=await requireSession();authorize(s,"support:write");
  const form=await request.formData();const file=form.get("file");
  if(!(file instanceof File))return json({error:"Datei fehlt."},400);
  if(file.size>10*1024*1024)return json({error:"Datei ist grösser als 10 MB."},413);
  if(!allowed.has(file.type))return json({error:"Dateityp ist nicht erlaubt."},400);
  const id=randomUUID();const ext=(file.name.split(".").pop()||"bin").replace(/[^a-zA-Z0-9]/g,"").slice(0,8);
  const storagePath=`support/${s.organizationId}/attachments/${id}.${ext}`;
  const url=await putBlob({path:storagePath,contentType:file.type,body:Buffer.from(await file.arrayBuffer())});
  if(!url)return json({error:"Azure Blob Storage ist nicht konfiguriert."},503);
  const item=await withTenant(s.organizationId,s.userId,async c=>(await c.query(`insert into stored_files(id,organization_id,uploaded_by,purpose,file_name,mime_type,size_bytes,storage_path) values($1,$2,$3,'support',$4,$5,$6,$7) returning id,file_name as "fileName",mime_type as "mimeType",size_bytes as "sizeBytes",created_at as "createdAt"`,[id,s.organizationId,s.userId,file.name.slice(0,240),file.type,file.size,url])).rows[0]);
  return json({item},201);
 }catch(e){return apiError(e,request)}
}
