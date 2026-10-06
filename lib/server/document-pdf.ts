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
 pdf.fontSize(18).text(String(company.legal_name||company.name));
 pdf.fontSize(9).text([company.street,company.postal_code,company.city].filter(Boolean).join(' '));pdf.moveDown(2);
 pdf.fontSize(11).text(String(customer.name));pdf.text([customer.street,customer.postal_code,customer.city].filter(Boolean).join(' '));pdf.moveDown(2);
 pdf.fontSize(22).text(type+' '+document.number);pdf.fontSize(10).text('Datum: '+document.issue_date);
 pdf.text((document.kind==='invoice'?'Fällig: ':'Gültig bis: ')+String(document.due_date||document.valid_until||'–'));pdf.moveDown();
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
 if(document.note)pdf.moveDown().fontSize(10).text(String(document.note));
 if(document.kind==='invoice'){
  pdf.addPage();pdf.fontSize(14).text('Zahlungsinformationen');pdf.fontSize(10).text(String(document.number));
  new SwissQRBill(createQrBillData(company,{number:String(document.number),reference:String(document.qr_reference??''),total:Number(document.total),currency:String(document.currency)})).attachTo(pdf,0,544);
 }
 pdf.end();return finished;
}
