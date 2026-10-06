import "server-only";
import PDFDocument from "pdfkit";
import {SwissQRBill} from "swissqrbill/pdf";
import {createQrBillData} from "@/lib/qr-bill";
type Row=Record<string,unknown>;
export async function documentPdf(document:Row,company:Row){
 const pdf=new PDFDocument({size:'A4',margin:45,info:{Title:String(document.number),Author:String(company.legal_name||company.name)}});
 const chunks:Buffer[]=[];
 const finished=new Promise<Buffer>((resolve,reject)=>{pdf.on('data',c=>chunks.push(c));pdf.on('end',()=>resolve(Buffer.concat(chunks)));pdf.on('error',reject)});
 const money=(v:unknown)=>Number(v).toLocaleString('de-CH',{minimumFractionDigits:2,maximumFractionDigits:2});
 const customer=document.customer as Row;
 const type=document.kind==='invoice'?'Rechnung':'Angebot';
 const balance=document.status==='paid'||document.status==='cancelled'?0:Math.max(0,Number(document.total)-Number(document.paid_amount||0));
 pdf.fontSize(18).text(String(company.legal_name||company.name));
 pdf.fontSize(9).text([company.street,company.building_number,company.postal_code,company.city].filter(Boolean).join(' '));pdf.moveDown(2);
 pdf.fontSize(11).text(String(customer.name));pdf.text([customer.street,customer.postal_code,customer.city].filter(Boolean).join(' '));pdf.moveDown(2);
 pdf.fontSize(22).text(type+' '+document.number);pdf.fontSize(10).text('Datum: '+document.issue_date);
 pdf.text((document.kind==='invoice'?'Fällig: ':'Gültig bis: ')+String(document.due_date||document.valid_until||'–'));
 if(company.vat_number||company.uid)pdf.text('MWST / UID: '+String(company.vat_number||company.uid));
 if(document.status==='draft')pdf.text('Entwurf');
 if(document.status==='cancelled')pdf.text('Storniert');
 pdf.moveDown().text(String(document.note||(document.kind==='invoice'?company.invoice_intro_text:company.quote_intro_text)||''));pdf.moveDown();
 for(const item of document.items as Row[]){
  const desc=String(item.description);const h=pdf.heightOfString(desc,{width:310})+38;
  if(pdf.y+h>740)pdf.addPage();
  const y=pdf.y;pdf.fontSize(10).text(desc,45,y,{width:310});
  pdf.text(money(Number(item.quantity)*Number(item.unit_price)),365,y,{width:140,align:'right'});
  pdf.y=y+Math.max(18,pdf.heightOfString(desc,{width:310}));
  pdf.fontSize(9).fillColor('#555').text(`${item.quantity} ${item.unit||'Stück'} × ${money(item.unit_price)} · MwSt. ${item.vat_rate}%`);pdf.fillColor('#111').moveDown();
 }
 if(pdf.y>640)pdf.addPage();
 pdf.moveDown().fontSize(11).text('Subtotal: '+money(document.subtotal),{align:'right'}).text('MwSt.: '+money(document.vat_amount),{align:'right'});
 pdf.fontSize(16).text('Total '+document.currency+' '+money(document.total),{align:'right'});
 const footer=document.kind==='invoice'?company.invoice_footer_text:company.quote_footer_text;
 if(footer)pdf.moveDown().fontSize(10).text(String(footer));
 pdf.moveDown().fontSize(9).text([company.legal_name||company.name,company.email,company.phone,company.website].filter(Boolean).join(' · '));
 if(document.kind==='invoice'){
  pdf.addPage();pdf.fontSize(14).text('Zahlungsinformationen');pdf.fontSize(10).text(String(document.number));
  pdf.text('Bezahlt: '+document.currency+' '+money(document.paid_amount));pdf.text('Offen: '+document.currency+' '+money(balance));
  if(balance>0)new SwissQRBill(createQrBillData(company,{number:String(document.number),reference:String(document.qr_reference??''),total:balance,currency:String(document.currency)})).attachTo(pdf,0,544);
  else pdf.moveDown().text(document.status==='cancelled'?'Die Rechnung wurde storniert. Keine Zahlung erforderlich.':'Die Rechnung ist vollständig bezahlt. Keine weitere Zahlung erforderlich.');
 }
 pdf.end();return finished;
}
