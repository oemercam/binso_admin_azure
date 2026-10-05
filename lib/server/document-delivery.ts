import "server-only";
import PDFDocument from "pdfkit";
import {SwissQRBill} from "swissqrbill/pdf";
import type {Data} from "swissqrbill/types";
import type {PoolClient} from "pg";
import type {SessionUser} from "@/lib/server/session";
import {ApiError} from "@/lib/server/http";
import {createQrBillData,invoicePaymentIssue} from "@/lib/qr-bill";

export type DeliveryKind="invoice"|"offer";

export type DeliveryDocument={
  kind:DeliveryKind;
  id:string;
  number:string;
  status:string;
  issueDate:string;
  dueDate:string|null;
  validUntil:string|null;
  note:string|null;
  currency:string;
  subtotal:number;
  vatAmount:number;
  total:number;
  qrReference:string|null;
  customer:{
    id:string;
    name:string;
    email:string;
    address:string;
    zip:string;
    city:string;
  };
  company:Record<string,unknown>;
  items:Array<{
    description:string;
    quantity:number;
    unit:string;
    unitPrice:number;
    vatRate:number;
    lineTotal:number;
  }>;
};

function number(value:unknown){const n=Number(value);return Number.isFinite(n)?n:0;}
function date(value:unknown){return String(value??"").slice(0,10);}
function chDate(value:string|null){if(!value)return "—";const p=value.split("-");return p.length===3?p[2]+"."+p[1]+"."+p[0]:value;}
function money(value:number,currency:string){return new Intl.NumberFormat("de-CH",{style:"currency",currency,minimumFractionDigits:2}).format(value);}
function safeFilename(value:string){return value.replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/^-+|-+$/g,"")||"dokument";}

export async function loadDeliveryDocument(client:PoolClient,session:SessionUser,numberValue:string,kind:DeliveryKind):Promise<DeliveryDocument>{
  const invoice=kind==="invoice";
  const table=invoice?"invoices":"quotes";
  const lineTable=invoice?"invoice_lines":"quote_lines";
  const numberColumn=invoice?"invoice_no":"quote_no";
  const parentColumn=invoice?"invoice_id":"quote_id";
  const result=await client.query(
    `select d.id,d.${numberColumn} as number,d.status,d.issue_date::text as issue_date,
            ${invoice?"d.due_date::text":"null::text"} as due_date,
            ${invoice?"null::text":"d.valid_until::text"} as valid_until,
            d.note,d.currency,
            ${invoice?"d.subtotal":"coalesce((select sum(l.quantity*l.unit_price) from quote_lines l where l.quote_id=d.id and l.organization_id=d.organization_id),0)"} as subtotal,
            ${invoice?"d.vat_amount":"coalesce((select sum(l.quantity*l.unit_price*l.vat_rate/100) from quote_lines l where l.quote_id=d.id and l.organization_id=d.organization_id),0)"} as vat_amount,
            ${invoice?"d.total_amount":"coalesce((select sum(l.quantity*l.unit_price*(1+l.vat_rate/100)) from quote_lines l where l.quote_id=d.id and l.organization_id=d.organization_id),0)"} as total,
            ${invoice?"d.qr_reference":"null::text"} as qr_reference,
            c.id as customer_id,c.name as customer_name,c.email as customer_email,
            c.address as customer_address,c.zip as customer_zip,c.city as customer_city
       from ${table} d
       join customers c on c.id=d.customer_id and c.organization_id=d.organization_id
      where d.organization_id=$1 and d.${numberColumn}=$2 and d.archived_at is null
      limit 1`,
    [session.organizationId,numberValue]
  );
  const row=result.rows[0];
  if(!row)throw new ApiError(404,"document_not_found","Dokument wurde nicht gefunden.");
  if(!String(row.customer_email??"").includes("@"))throw new ApiError(409,"customer_email_missing","Beim Kunden ist keine gültige E-Mail-Adresse hinterlegt.");

  const lines=await client.query(
    `select description,quantity,unit,unit_price,vat_rate,quantity*unit_price as line_total
       from ${lineTable}
      where organization_id=$1 and ${parentColumn}=$2
      order by sort_order,id`,
    [session.organizationId,row.id]
  );
  if(!lines.rowCount)throw new ApiError(409,"document_empty","Das Dokument enthält keine Positionen.");

  const company=(await client.query(
    `select o.name,o.legal_name,o.street,o.building_number,o.postal_code,o.city,o.country_code,o.iban,o.qr_iban,
            coalesce(cp.email,'') as company_email,coalesce(cp.phone,'') as company_phone,
            coalesce(cp.uid,'') as company_uid,coalesce(cp.website,'') as company_website
       from organizations o
       left join company_profile cp on cp.organization_id=o.id
      where o.id=$1 limit 1`,
    [session.organizationId]
  )).rows[0];
  if(!company)throw new ApiError(409,"company_missing","Firmendaten sind nicht vollständig verfügbar.");

  return {
    kind,id:String(row.id),number:String(row.number),status:String(row.status),
    issueDate:date(row.issue_date),dueDate:row.due_date?date(row.due_date):null,validUntil:row.valid_until?date(row.valid_until):null,
    note:row.note?String(row.note):null,currency:String(row.currency||"CHF"),
    subtotal:number(row.subtotal),vatAmount:number(row.vat_amount),total:number(row.total),qrReference:row.qr_reference?String(row.qr_reference):null,
    customer:{id:String(row.customer_id),name:String(row.customer_name),email:String(row.customer_email).trim().toLowerCase(),address:String(row.customer_address??""),zip:String(row.customer_zip??""),city:String(row.customer_city??"")},
    company,
    items:lines.rows.map(item=>({description:String(item.description??""),quantity:number(item.quantity),unit:String(item.unit??"Stück"),unitPrice:number(item.unit_price),vatRate:number(item.vat_rate),lineTotal:number(item.line_total)}))
  };
}

function drawHeader(pdf:PDFKit.PDFDocument,document:DeliveryDocument){
  const companyName=String(document.company.legal_name||document.company.name||"");
  pdf.font("Helvetica-Bold").fontSize(11).text(companyName,50,48,{width:230});
  pdf.font("Helvetica").fontSize(9);
  const companyAddress=[document.company.street,[document.company.postal_code,document.company.city].filter(Boolean).join(" ")].filter(Boolean).join("\n");
  if(companyAddress)pdf.text(companyAddress,50,66,{width:230});
  const title=document.kind==="invoice"?"Rechnung":"Angebot";
  pdf.font("Helvetica-Bold").fontSize(24).text(title,330,48,{width:215,align:"right"});
  pdf.font("Helvetica").fontSize(10).text(document.number,330,80,{width:215,align:"right"});
}

function drawRecipientAndFacts(pdf:PDFKit.PDFDocument,document:DeliveryDocument){
  pdf.font("Helvetica-Bold").fontSize(10).text("Empfänger",50,130);
  pdf.font("Helvetica").fontSize(10).text(document.customer.name,50,148);
  if(document.customer.address)pdf.text(document.customer.address);
  const locality=[document.customer.zip,document.customer.city].filter(Boolean).join(" ");
  if(locality)pdf.text(locality);

  const label=document.kind==="invoice"?"Fällig am":"Gültig bis";
  const target=document.kind==="invoice"?document.dueDate:document.validUntil;
  pdf.font("Helvetica").fontSize(9).text("Datum",330,130,{width:90}).font("Helvetica-Bold").text(chDate(document.issueDate),425,130,{width:120,align:"right"});
  pdf.font("Helvetica").fontSize(9).text(label,330,148,{width:90}).font("Helvetica-Bold").text(chDate(target),425,148,{width:120,align:"right"});
}

function ensureSpace(pdf:PDFKit.PDFDocument,height:number){
  if(pdf.y+height>500){pdf.addPage({size:"A4",margins:{top:48,left:50,right:50,bottom:50}});pdf.y=50;}
}

function drawItems(pdf:PDFKit.PDFDocument,document:DeliveryDocument){
  pdf.y=220;
  const widths={description:255,quantity:55,price:85,total:100};
  const x=50;
  pdf.font("Helvetica-Bold").fontSize(9);
  pdf.text("Position",x,pdf.y,{width:widths.description});
  pdf.text("Menge",x+widths.description,pdf.y,{width:widths.quantity,align:"right"});
  pdf.text("Preis",x+widths.description+widths.quantity,pdf.y,{width:widths.price,align:"right"});
  pdf.text("Betrag",x+widths.description+widths.quantity+widths.price,pdf.y,{width:widths.total,align:"right"});
  pdf.moveTo(50,pdf.y+14).lineTo(545,pdf.y+14).strokeColor("#cccccc").stroke();
  pdf.y+=24;

  for(const item of document.items){
    ensureSpace(pdf,42);
    const y=pdf.y;
    pdf.font("Helvetica").fontSize(9).text(item.description,x,y,{width:widths.description-8});
    pdf.text(String(item.quantity)+" "+item.unit,x+widths.description,y,{width:widths.quantity,align:"right"});
    pdf.text(money(item.unitPrice,document.currency),x+widths.description+widths.quantity,y,{width:widths.price,align:"right"});
    pdf.text(money(item.lineTotal,document.currency),x+widths.description+widths.quantity+widths.price,y,{width:widths.total,align:"right"});
    pdf.y=Math.max(pdf.y,y+28);
  }
  ensureSpace(pdf,90);
  pdf.moveTo(330,pdf.y).lineTo(545,pdf.y).strokeColor("#dddddd").stroke();
  pdf.y+=10;
  pdf.font("Helvetica").fontSize(9).text("Zwischentotal",330,pdf.y,{width:110}).text(money(document.subtotal,document.currency),445,pdf.y,{width:100,align:"right"});
  pdf.y+=16;
  pdf.text("MwSt.",330,pdf.y,{width:110}).text(money(document.vatAmount,document.currency),445,pdf.y,{width:100,align:"right"});
  pdf.y+=18;
  pdf.font("Helvetica-Bold").fontSize(11).text("Total",330,pdf.y,{width:110}).text(money(document.total,document.currency),445,pdf.y,{width:100,align:"right"});
  pdf.y+=30;
  if(document.note){
    ensureSpace(pdf,70);
    pdf.font("Helvetica-Bold").fontSize(9).text("Hinweis",50,pdf.y);
    pdf.y+=14;
    pdf.font("Helvetica").fontSize(9).text(document.note,50,pdf.y,{width:495});
  }
}

function drawFooter(pdf:PDFKit.PDFDocument,document:DeliveryDocument){
  const details=[
    document.company.company_uid?String(document.company.company_uid):"",
    document.company.company_email?String(document.company.company_email):"",
    document.company.company_phone?String(document.company.company_phone):"",
    document.company.company_website?String(document.company.company_website):""
  ].filter(Boolean).join(" · ");
  if(details)pdf.font("Helvetica").fontSize(7).fillColor("#666666").text(details,50,815,{width:495,align:"center"});
  pdf.fillColor("#000000");
}

export async function generateDocumentPdf(document:DeliveryDocument):Promise<Buffer>{
  if(document.kind==="invoice"){
    const issue=invoicePaymentIssue(document.company);
    if(issue)throw new ApiError(409,"invoice_payment_setup_required",issue);
  }
  return new Promise<Buffer>((resolve,reject)=>{
    const pdf=new PDFDocument({size:"A4",margins:{top:48,left:50,right:50,bottom:50},info:{Title:(document.kind==="invoice"?"Rechnung ":"Angebot ")+document.number,Author:String(document.company.legal_name||document.company.name||"Binso One")}});
    const chunks:Buffer[]=[];
    pdf.on("data",(chunk:Buffer)=>chunks.push(Buffer.from(chunk)));
    pdf.on("error",reject);
    pdf.on("end",()=>resolve(Buffer.concat(chunks)));
    drawHeader(pdf,document);
    drawRecipientAndFacts(pdf,document);
    drawItems(pdf,document);
    if(document.kind==="invoice"){
      if(pdf.y>500)pdf.addPage({size:"A4",margins:{top:48,left:50,right:50,bottom:50}});
      const qrData:Data=createQrBillData(document.company,{reference:document.qrReference??undefined,number:document.number,total:document.total,currency:document.currency});
      const qrBill=new SwissQRBill(qrData);
      qrBill.attachTo(pdf);
    }else{
      drawFooter(pdf,document);
    }
    pdf.end();
  });
}

export function documentPdfFilename(document:DeliveryDocument){
  return safeFilename((document.kind==="invoice"?"Rechnung-":"Angebot-")+document.number)+".pdf";
}

export function documentMailSubject(document:DeliveryDocument){
  return (document.kind==="invoice"?"Rechnung ":"Angebot ")+document.number+" – "+String(document.company.legal_name||document.company.name||"");
}

function escapeHtml(value:unknown){
  return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]??char));
}

export function documentMailHtml(document:DeliveryDocument){
  const title=document.kind==="invoice"?"Rechnung":"Angebot";
  const due=document.kind==="invoice"?document.dueDate:document.validUntil;
  const dueLabel=document.kind==="invoice"?"Fällig am":"Gültig bis";
  return `<p>Guten Tag</p><p>Im Anhang erhalten Sie ${document.kind==="invoice"?"die":"das"} <strong>${escapeHtml(title)} ${escapeHtml(document.number)}</strong> von ${escapeHtml(document.company.legal_name||document.company.name)}.</p><p><strong>Total:</strong> ${escapeHtml(money(document.total,document.currency))}<br><strong>${escapeHtml(dueLabel)}:</strong> ${escapeHtml(chDate(due))}</p><p>Bei Fragen können Sie direkt auf diese E-Mail antworten bzw. die auf dem Dokument angegebenen Kontaktdaten verwenden.</p>`;
}

export function documentMailText(document:DeliveryDocument){
  const title=document.kind==="invoice"?"Rechnung":"Angebot";
  const due=document.kind==="invoice"?document.dueDate:document.validUntil;
  const dueLabel=document.kind==="invoice"?"Fällig am":"Gültig bis";
  return `${title} ${document.number}\nTotal: ${money(document.total,document.currency)}\n${dueLabel}: ${chDate(due)}\n\nDas Dokument finden Sie als PDF im Anhang.`;
}
