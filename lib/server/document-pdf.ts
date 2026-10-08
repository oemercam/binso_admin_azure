import "server-only";
import PDFDocument from "pdfkit";
import {SwissQRBill} from "swissqrbill/pdf";
import {createQrBillData} from "@/lib/qr-bill";
type Row=Record<string,unknown>;
/** One renderer for downloads, mail attachments and the interactive preview. */
export async function documentPdf(document:Row,company:Row){
 const pdf=new PDFDocument({size:'A4',margin:40,bufferPages:true,info:{Title:String(document.number),Author:String(company.legal_name||company.name)}});
 const chunks:Buffer[]=[];
 const finished=new Promise<Buffer>((resolve,reject)=>{pdf.on('data',c=>chunks.push(c));pdf.on('end',()=>resolve(Buffer.concat(chunks)));pdf.on('error',reject)});
 const money=(v:unknown)=>Number(v||0).toLocaleString('de-CH',{minimumFractionDigits:2,maximumFractionDigits:2});
 const date=(v:unknown)=>{const raw=String(v||'').slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(raw)?raw.split('-').reverse().join('.'):raw||'–'};
 const customer=(document.customer||{}) as Row;
 const invoice=document.kind==='invoice',draft=document.status==='draft';
 const total=Number(document.total),paid=Math.round(Number(document.paid_amount||0)*100)/100;
 const balance=document.status==='paid'||document.status==='cancelled'?0:Math.max(0,Math.round((total-paid)*100)/100);
 const left=40,right=pdf.page.width-40,width=right-left,bottom=pdf.page.height-45;
 const ensure=(height:number)=>{if(pdf.y+height>bottom)pdf.addPage()};
 const paragraph=(text:string,size=10)=>{pdf.font('Helvetica').fontSize(size);pdf.text(text,left,pdf.y,{width,lineGap:3});pdf.moveDown(.5)};
 pdf.fillColor('#111').font('Helvetica-Bold').fontSize(16).text(String(company.legal_name||company.name),left,40,{width});
 paragraph([company.street,company.building_number,company.postal_code,company.city].filter(Boolean).join(' '),9);
 pdf.moveDown(.7);paragraph(String(customer.name||'Empfänger noch nicht erfasst'),11);
 paragraph([customer.street||customer.address,customer.postal_code||customer.zip,customer.city].filter(Boolean).join(' '));
 pdf.moveDown(.5);pdf.font('Helvetica-Bold').fontSize(20).text((invoice?'Rechnung':'Angebot')+' '+document.number,left,pdf.y,{width});
 if(draft)paragraph('ENTWURF – nicht zur Zahlung / nicht versenden',11);
 if(document.status==='cancelled')paragraph('STORNIERT – keine Zahlung erforderlich',11);
 paragraph('Datum: '+date(document.issue_date)+'   ·   '+(invoice?'Zahlungsfrist: ':'Gültig bis: ')+date(document.due_date||document.valid_until),9);
 if(company.vat_number||company.uid)paragraph('MWST / UID: '+String(company.vat_number||company.uid),9);
 const note=String(document.note||(invoice?company.invoice_intro_text:company.quote_intro_text)||'');if(note)paragraph(note);
 const tableHead=()=>{ensure(35);const y=pdf.y;pdf.font('Helvetica-Bold').fontSize(9).text('Beschreibung',left,y,{width:260});pdf.text('Menge / Preis / MWST',305,y,{width:145});pdf.text('Betrag',455,y,{width:right-455,align:'right'});pdf.moveTo(left,y+17).lineTo(right,y+17).strokeColor('#bbb').stroke();pdf.y=y+25};
 tableHead();
 for(const item of (document.items||[]) as Row[]){
  const description=String(item.description||'');pdf.font('Helvetica').fontSize(10);
  const h=pdf.heightOfString(description,{width:250,lineGap:2});
  if(h<bottom-90&&pdf.y+Math.max(h,30)+12>bottom){pdf.addPage();tableHead();}
  // PDFKit paginates oversized descriptions rather than clipping them.
  const y=pdf.y,startPage=pdf.page;pdf.text(description,left,y,{width:250,lineGap:2});const after=pdf.y;
  if(pdf.page===startPage){pdf.fontSize(8).text(`${item.quantity} ${item.unit||'Stück'} × ${money(item.unit_price)}\nMWST ${item.vat_rate}%`,305,y,{width:145});pdf.fontSize(10).text(money(Number(item.quantity)*Number(item.unit_price)),455,y,{width:right-455,align:'right'});pdf.y=Math.max(after,y+30)+12;}else{pdf.y=after;paragraph(`${item.quantity} ${item.unit||'Stück'} × ${money(item.unit_price)} · MWST ${item.vat_rate}% · Betrag ${money(Number(item.quantity)*Number(item.unit_price))}`,9);}
 }
 ensure(90);pdf.moveDown(.3);paragraph('Zwischentotal: '+money(document.subtotal),10);paragraph('MWST: '+money(document.vat_amount??document.vat),10);pdf.font('Helvetica-Bold').fontSize(14).text('Total '+document.currency+' '+money(total),left,pdf.y,{width,align:'right'});pdf.moveDown(.8);
 const footer=String((invoice?company.invoice_footer_text:company.quote_footer_text)||'');if(footer)paragraph(footer);
 paragraph([company.legal_name||company.name,company.email,company.phone,company.website].filter(Boolean).join(' · '),8);
 if(invoice){
  ensure(85);paragraph('Zahlungsinformationen',11);
  if(paid>0)paragraph('Bereits erhalten: '+document.currency+' '+money(paid)+' · Offen: '+document.currency+' '+money(balance),9);
  if(draft)paragraph('Entwurf: Ein zahlbarer QR-Zahlteil wird erst nach Finalisierung mit vollständigen Zahlungsdaten ausgegeben.',9);
  else if(balance===0)paragraph(document.status==='cancelled'?'Storniert – keine Zahlung erforderlich.':'Vollständig bezahlt – keine weitere Zahlung erforderlich.',9);
  else{
   // The existing application requests the remaining balance. Label it explicitly;
   // this is not a second invoice and does not create any payment booking.
   let bill:SwissQRBill|null=null;
   try{bill=new SwissQRBill(createQrBillData(company,{number:String(document.number),reference:String(document.qr_reference??''),total:balance,currency:String(document.currency),debtor:customer}),{language:'DE',scissors:true});}catch(error){paragraph('QR-Zahlteil nicht verfügbar: '+(error instanceof Error?error.message:'Zahlungsdaten prüfen.'),9);}
   if(bill){
    const slipTop=pdf.page.height-SwissQRBill.height;
    const label=paid>0?'Restzahlungsanforderung zu Rechnung '+document.number+' – bitte nur den offenen Betrag bezahlen.':'Bitte den Rechnungsbetrag mit dem folgenden QR-Zahlteil bezahlen.';
    pdf.fontSize(9);const labelHeight=pdf.heightOfString(label,{width})+12;
    if(pdf.y+labelHeight>slipTop-12)pdf.addPage();
    paragraph(label,9);
    bill.attachTo(pdf,0,pdf.page.height-SwissQRBill.height);
   }
  }
 }
 pdf.end();return finished;
}
