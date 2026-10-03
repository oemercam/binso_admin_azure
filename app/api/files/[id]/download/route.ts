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
    const row=await withTenant(s.organizationId,s.userId,async client=>(await client.query<{fileName:string;storagePath:string}>(
      `select original_name as "fileName", blob_url as "storagePath" from file_objects where id=$1 and organization_id=$2 limit 1`,
      [id,s.organizationId]
    )).rows[0]);
    if(!row) return new Response("Nicht gefunden.",{status:404});
    const blob=await getBlobByUrl(row.storagePath);
    return new Response(blob.body,{headers:{"content-type":blob.contentType,"content-disposition":`attachment; filename*=UTF-8''${encodeURIComponent(row.fileName)}`,"cache-control":"private, no-store"}});
  }catch(error){return apiError(error);}
}
