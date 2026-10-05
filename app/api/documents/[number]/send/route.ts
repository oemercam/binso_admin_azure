import {NextRequest} from "next/server";
import {requireSession} from "@/lib/server/session";
import {authorize} from "@/lib/server/rbac";
import {withTenant} from "@/lib/server/db";
import {ApiError,apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
import {audit} from "@/lib/server/audit";
import {sendMail,mailLayout} from "@/lib/server/email";
import {documentMailHtml,documentMailSubject,documentMailText,documentPdfFilename,generateDocumentPdf,loadDeliveryDocument,type DeliveryKind} from "@/lib/server/document-delivery";

export const runtime="nodejs";

type SendBody={kind?:unknown};

function parseKind(value:unknown):DeliveryKind{
  if(value==="invoice"||value==="offer")return value;
  throw new ApiError(400,"document_kind_invalid","Ungültiger Dokumenttyp.");
}

export async function POST(request:NextRequest,{params}:{params:Promise<{number:string}>}){
  let deliveryId:string|null=null;
  let session:Awaited<ReturnType<typeof requireSession>>|null=null;
  try{
    assertSameOrigin(request);
    session=await requireSession();
    if(session.isDemo)throw new ApiError(403,"demo_delivery_disabled","Der echte Dokumentversand ist in der Demo deaktiviert.");

    const body=await readJson<SendBody>(request,4096);
    const kind=parseKind(body.kind);
    authorize(session,kind==="invoice"?"invoices:write":"sales:write");

    const idempotencyKey=(request.headers.get("idempotency-key")??"").trim();
    if(!/^[A-Za-z0-9._:-]{8,200}$/.test(idempotencyKey))throw new ApiError(400,"idempotency_key_required","Für den Versand ist ein gültiger Idempotency-Key erforderlich.");

    const {number}=await params;
    const reserved=await withTenant(session.organizationId,session.userId,async client=>{
      const document=await loadDeliveryDocument(client,session!,number,kind);
      if(kind==="invoice"&&document.status==="cancelled")throw new ApiError(409,"document_cancelled","Eine stornierte Rechnung kann nicht versendet werden.");
      if(kind==="offer"&&document.status==="rejected")throw new ApiError(409,"document_rejected","Ein abgelehntes Angebot kann nicht erneut als aktuelles Angebot versendet werden.");

      const existing=await client.query<{id:string;status:string;recipient_email:string}>(
        "select id,status,recipient_email from document_deliveries where organization_id=$1 and idempotency_key=$2 limit 1",
        [session!.organizationId,idempotencyKey]
      );
      if(existing.rows[0]){
        if(existing.rows[0].status==="sent")return {document,duplicate:true,deliveryId:existing.rows[0].id};
        throw new ApiError(409,"delivery_key_used","Dieser Versandversuch wurde bereits verarbeitet. Bitte die Ansicht aktualisieren.");
      }

      const delivery=await client.query<{id:string}>(
        `insert into document_deliveries(organization_id,idempotency_key,document_kind,document_id,document_number,recipient_email,status,requested_by_user_id)
         values($1,$2,$3,$4,$5,$6,'pending',$7) returning id`,
        [session!.organizationId,idempotencyKey,kind,document.id,document.number,document.customer.email,session!.userId]
      );
      return {document,duplicate:false,deliveryId:delivery.rows[0].id};
    });

    deliveryId=reserved.deliveryId;
    if(reserved.duplicate)return json({ok:true,delivered:true,duplicate:true,recipient:reserved.document.customer.email});

    const pdf=await generateDocumentPdf(reserved.document);
    const result=await sendMail({
      to:reserved.document.customer.email,
      subject:documentMailSubject(reserved.document),
      html:mailLayout(reserved.document.kind==="invoice"?"Rechnung "+reserved.document.number:"Angebot "+reserved.document.number,documentMailHtml(reserved.document)),
      text:documentMailText(reserved.document),
      attachments:[{name:documentPdfFilename(reserved.document),contentType:"application/pdf",content:pdf}],
    });
    if(!result.delivered)throw new Error("Microsoft Graph hat den Dokumentversand nicht bestätigt.");

    await withTenant(session.organizationId,session.userId,async client=>{
      await client.query(
        "update document_deliveries set status='sent',provider=$1,completed_at=now(),failure_reason=null where id=$2 and organization_id=$3",
        [result.provider,deliveryId,session!.organizationId]
      );
      if(reserved.document.kind==="invoice"){
        await client.query("update invoices set status=case when status='draft' then 'sent' else status end,updated_at=now() where id=$1 and organization_id=$2",[reserved.document.id,session!.organizationId]);
      }else{
        await client.query("update quotes set status=case when status='draft' then 'sent' else status end,updated_at=now() where id=$1 and organization_id=$2",[reserved.document.id,session!.organizationId]);
      }
      await audit(client,{organizationId:session!.organizationId,userId:session!.userId,action:"document.sent",entityType:reserved.document.kind,entityId:reserved.document.id,metadata:{documentNumber:reserved.document.number,recipientDomain:reserved.document.customer.email.split("@")[1],provider:result.provider}});
    });

    return json({ok:true,delivered:true,duplicate:false,recipient:reserved.document.customer.email});
  }catch(error){
    if(deliveryId&&session){
      await withTenant(session.organizationId,session.userId,client=>client.query(
        "update document_deliveries set status='failed',failure_reason=$1,completed_at=now() where id=$2 and organization_id=$3 and status='pending'",
        [error instanceof Error?error.name:"delivery_error",deliveryId,session!.organizationId]
      )).catch(()=>undefined);
    }
    return apiError(error);
  }
}
