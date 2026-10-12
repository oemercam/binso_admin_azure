import {fileRelations} from "@/lib/server/file-relations";
import { apiError } from "@/lib/server/http";
import { requireSession } from "@/lib/server/session";
import { authorize } from "@/lib/server/rbac";
import { withTenant } from "@/lib/server/db";
import { getBlobByUrl } from "@/lib/server/storage";

export const runtime="nodejs";

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const {id}=await params;
    const s=await requireSession();
    authorize(s,"documents:read");
    const row=await withTenant(s.organizationId,s.userId,async client=>(await client.query<{fileName:string;storagePath:string|null;mimeType:string;body:Buffer|null;purpose:string;scanStatus:string;expenseOwner:string|null}>(
      `select f.original_name as "fileName", f.blob_url as "storagePath",f.content_type as "mimeType",b.body,f.purpose,f.scan_status as "scanStatus",(select e.created_by_user_id from expenses e where e.id=f.expense_id and e.organization_id=f.organization_id) as "expenseOwner" from file_objects f left join file_contents b on b.file_id=f.id and b.organization_id=f.organization_id where f.id=$1 and f.organization_id=$2 limit 1`,
      [id,s.organizationId]
    )).rows[0]);
    if(!row)return new Response("Nicht gefunden.",{status:404});
    const relation=fileRelations[row.purpose];
    if(relation)authorize(s,relation.read);
    if(row.purpose==='expense_receipt'&&s.role==='member'&&row.expenseOwner!==s.userId)return new Response("Nicht gefunden.",{status:404});
    if(row.scanStatus!=="clean")return new Response("Datei ist noch nicht für den Download freigegeben.",{status:423,headers:{"cache-control":"private, no-store","x-content-type-options":"nosniff"}});
    const blob=row.body?{body:new Uint8Array(row.body),contentType:row.mimeType}:row.storagePath?await getBlobByUrl(row.storagePath):null;
    if(!blob)return new Response("Dateiinhalt nicht verfügbar.",{status:404});
    return new Response(blob.body,{headers:{"content-type":blob.contentType,"content-disposition":`attachment; filename*=UTF-8''${encodeURIComponent(row.fileName)}`,"cache-control":"private, no-store","x-content-type-options":"nosniff"}});
  }catch(error){return apiError(error);}
}
