import {NextRequest} from "next/server";
import {requireSession} from "@/lib/server/session";
import {authorize} from "@/lib/server/rbac";
import {withTenant} from "@/lib/server/db";
import {ApiError,apiError} from "@/lib/server/http";
import {documentPdfFilename,generateDocumentPdf,loadDeliveryDocument,type DeliveryKind} from "@/lib/server/document-delivery";

export const runtime="nodejs";
export const dynamic="force-dynamic";

function kindFrom(request:NextRequest):DeliveryKind{
  const kind=request.nextUrl.searchParams.get("kind");
  if(kind!=="invoice"&&kind!=="offer")throw new ApiError(400,"document_kind_invalid","Ungültiger Dokumenttyp.");
  return kind;
}

export async function GET(request:NextRequest,{params}:{params:Promise<{number:string}>}){
  try{
    const session=await requireSession();
    const kind=kindFrom(request);
    authorize(session,kind==="invoice"?"invoices:read":"sales:read");
    const {number}=await params;
    const document=await withTenant(session.organizationId,session.userId,client=>loadDeliveryDocument(client,session,number,kind));
    const pdf=await generateDocumentPdf(document);
    return new Response(new Uint8Array(pdf),{
      status:200,
      headers:{
        "content-type":"application/pdf",
        "content-disposition":`inline; filename*=UTF-8''${encodeURIComponent(documentPdfFilename(document))}`,
        "cache-control":"private, no-store",
        "x-content-type-options":"nosniff",
      }
    });
  }catch(error){
    return apiError(error);
  }
}
