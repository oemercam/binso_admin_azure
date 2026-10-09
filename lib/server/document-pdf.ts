import "server-only";
import PDFDocument from "pdfkit";
import {readFile} from "node:fs/promises";
import {join} from "node:path";
import {SwissQRBill} from "swissqrbill/pdf";
import {openAmount} from "@/lib/financial-status";
import {createQrBillData,qrPaymentAccount} from "@/lib/qr-bill";
type Row=Record<string,unknown>;
const record=(value:unknown):Row=>value&&typeof value==='object'?value as Row:{};
/** Existing document snapshots are authoritative; draft headers use current identity.
 * A document note replaces the introduction, never duplicates it. */
export function documentPresentationData(document:Row,company:Row){
 const invoice=document.kind==='invoice',saved=record(document.document_snapshot);
 const issuer=record(document.issuer_snapshot),payment=record(document.payment_snapshot),customer=record(document.customer_snapshot);
 return {company:document.status!=='draft'&&Object.keys(issuer).length?{...issuer,...payment}:company,
  customer:document.status!=='draft'&&Object.keys(customer).length?customer:record(document.customer),
  intro:String(Object.hasOwn(saved,'intro')?saved.intro:document.note||document.intro_text||(invoice?company.invoice_intro_text:company.quote_intro_text)||''),
  closing:String(Object.hasOwn(saved,'closing')?saved.closing:(invoice?company.invoice_footer_text:company.quote_footer_text)||'')};
}
/** One renderer for downloads, mail attachments and the interactive preview.
 * Financial totals and line amounts come from the business repository. */
export async function documentPdf(document:Row,liveCompany:Row,logo?:Buffer){
 const {company,customer,intro,closing}=documentPresentationData(document,liveCompany);
 const pdf=new PDFDocument({size:'A4',margins:{top:44,bottom:72,left:44,right:44},bufferPages:true,info:{Title:String(document.number),Author:String(company.legal_name||company.name||'')}});
 const [regular,bold]=await Promise.all(['Regular','Bold'].map(weight=>readFile(join(process.cwd(),'public/fonts/pdf',`LiberationSans-${weight}.ttf`))));
 pdf.registerFont('Liberation Sans',regular).registerFont('Liberation Sans-Bold',bold);
 const chunks:Buffer[]=[];
 const finished=new Promise<Buffer>((resolve,reject)=>{pdf.on('data',c=>chunks.push(c));pdf.on('end',()=>resolve(Buffer.concat(chunks)));pdf.on('error',reject)});
 const money=(v:unknown)=>Number(v||0).toLocaleString('de-CH',{minimumFractionDigits:2,maximumFractionDigits:2});
 const date=(v:unknown)=>{const raw=String(v||'').slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(raw)?raw.split('-').reverse().join('.'):raw};
 const invoice=document.kind==='invoice',draft=document.status==='draft',cancelled=document.status==='cancelled';
 const total=Number(document.total),paid=Math.round(Number(document.paid_amount||0)*100)/100;
 const balance=document.status==='paid'||cancelled?0:openAmount({total,paid_amount:paid});
 const left=44,right=pdf.page.width-44,width=right-left,bottom=pdf.page.height-72;
 const ensure=(height:number)=>{if(pdf.y+height>bottom)pdf.addPage()};
 const paragraph=(text:string,size=10)=>{if(!text.trim())return;pdf.font('Liberation Sans').fontSize(size).fillColor('#111');const height=pdf.heightOfString(text,{width,lineGap:3});if(height<bottom-44)ensure(height+12);pdf.text(text,left,pdf.y,{width,lineGap:3});pdf.moveDown(.6)};
 const heading=(text:string)=>{ensure(34);pdf.font('Liberation Sans-Bold').fontSize(10).fillColor('#111').text(text,left,pdf.y,{width});pdf.moveDown(.6)};
 // Company head: optional trusted raster asset, compact identity on the right.
 const companyName=String(company.legal_name||company.name||'');
 if(logo)pdf.image(logo,left,44,{fit:[150,66]});
 const issuerLines=[companyName,[company.street,company.building_number].filter(Boolean).join(' '),[company.postal_code,company.city].filter(Boolean).join(' '),company.country_code&&company.country_code!=='CH'?company.country_code:'',company.phone,company.email].filter(Boolean).join('\n');
 pdf.font('Liberation Sans').fontSize(9).fillColor('#111').text(issuerLines,300,44,{width:right-300,lineGap:3});
 pdf.y=Math.max(124,pdf.y+24);
 heading('EMPFÄNGER');
 paragraph([customer.name,customer.contact_name,customer.address_lines||[customer.street||customer.address,customer.building_number].filter(Boolean).join(' '),customer.address_lines?'':[customer.postal_code||customer.zip,customer.city].filter(Boolean).join(' '),customer.country&& !['CH','Schweiz','Switzerland','Suisse'].includes(String(customer.country))?customer.country:''].filter(Boolean).join('\n'));
 ensure(104);pdf.moveDown(.5);pdf.font('Liberation Sans-Bold').fontSize(22).text(invoice?'RECHNUNG':'ANGEBOT',left,pdf.y,{width});pdf.moveDown(.35);
 paragraph((invoice?'Rechnung Nr. ':'Angebot Nr. ')+String(document.number),11);
 if(draft)paragraph('ENTWURF - nicht zur Zahlung / nicht versenden',10);
 if(cancelled)paragraph('STORNIERT - keine Zahlung erforderlich',10);
 const issueDate=date(document.issue_date),dueDate=date(invoice?document.due_date:document.valid_until);
 const days=invoice&&issueDate&&dueDate?Math.round((Date.parse(String(document.due_date).slice(0,10))-Date.parse(String(document.issue_date).slice(0,10)))/86400000):NaN;
 paragraph([(invoice?'Rechnungsdatum: ':'Angebotsdatum: ')+issueDate,invoice&&Number.isFinite(days)&&days>=0?'Zahlungsfrist: '+days+' Tage':'',dueDate?(invoice?'Fällig am: ':'Gültig bis: ')+dueDate:''].filter(Boolean).join('\n'),9);
 if(intro)paragraph(intro);
 const tableHead=()=>{ensure(38);const y=pdf.y;pdf.font('Liberation Sans-Bold').fontSize(8);
  for(const [label,x,w,align] of [['LEISTUNG',left,239,'left'],['MENGE',291,65,'right'],['EINZELPREIS',366,83,'right'],['TOTAL',459,right-459,'right']] as const)pdf.text(label,x,y,{width:w,align});
  pdf.moveTo(left,y+18).lineTo(right,y+18).strokeColor('#aaa').lineWidth(.5).stroke();pdf.y=y+28;};
 tableHead();
 for(const item of (document.items||[]) as Row[]){
  const description=String(item.description||'');pdf.font('Liberation Sans').fontSize(10);
  const h=pdf.heightOfString(description,{width:235,lineGap:2});
  if(h<bottom-80&&pdf.y+Math.max(h,34)+12>bottom){pdf.addPage();tableHead();}
  const y=pdf.y,startPage=pdf.page;pdf.text(description,left,y,{width:235,lineGap:2});const after=pdf.y;
  const quantity=Number(item.quantity||0).toLocaleString('de-CH',{maximumFractionDigits:3})+' '+String(item.unit||'');
  const amount=item.line_total;
  if(pdf.page===startPage){pdf.fontSize(9).text(quantity,291,y,{width:65,align:'right'});pdf.text(money(item.unit_price),366,y,{width:83,align:'right'});pdf.text(money(amount),459,y,{width:right-459,align:'right'});pdf.fontSize(8).fillColor('#555').text('MWST '+Number(item.vat_rate||0).toLocaleString('de-CH')+' %',366,y+15,{width:83,align:'right'});pdf.y=Math.max(after,y+34)+12;}
  else{pdf.y=after;paragraph(`${quantity} × ${money(item.unit_price)} · MWST ${item.vat_rate}% · Betrag ${money(amount)}`,9);}
 }
 ensure(98);const summary=(label:string,value:unknown,bold=false)=>{const y=pdf.y;pdf.font(bold?'Liberation Sans-Bold':'Liberation Sans').fontSize(bold?12:10).fillColor('#111').text(label,300,y,{width:145});pdf.text(money(value),459,y,{width:right-459,align:'right'});pdf.y=y+(bold?27:21)};
 pdf.moveTo(left,pdf.y).lineTo(right,pdf.y).strokeColor('#aaa').stroke();pdf.y+=14;
 summary('Zwischentotal',document.subtotal);summary('MWST',document.vat_amount??document.vat);summary('Gesamtbetrag '+String(document.currency||'CHF'),total,true);
 // Validate before adding a page; an invalid setup never creates a phantom page.
 let bill:SwissQRBill|null=null,qrError='';
 let paymentData:ReturnType<typeof createQrBillData>|null=null;
 if(invoice&&!draft&&!cancelled&&balance>0){try{paymentData=createQrBillData(company,{number:String(document.number),reference:String(document.qr_reference??''),total:balance,currency:String(document.currency),debtor:customer});bill=new SwissQRBill(paymentData,{language:'DE',scissors:true,fontName:'Liberation Sans'});}catch(error){qrError='QR-Zahlteil nicht verfügbar: '+(error instanceof Error?error.message:'Zahlungsdaten prüfen.');}}
 if(invoice){
  heading('ZAHLUNGSINFORMATIONEN');
  paragraph([companyName,company.bank_name,qrPaymentAccount(company,String(document.currency))?'IBAN: '+qrPaymentAccount(company,String(document.currency)):'',paymentData?.reference?'Zahlungsreferenz: '+paymentData.reference:'Rechnungsreferenz: '+String(document.number)].filter(Boolean).join('\n'),9);
  if(paid>0)paragraph('Bereits erhalten: '+document.currency+' '+money(paid)+' · Offen: '+document.currency+' '+money(balance),9);
  if(draft)paragraph('Entwurf: Kein zahlbarer QR-Zahlteil vor der Ausstellung.',9);
  else if(balance===0)paragraph(cancelled?'Storniert - keine Zahlung erforderlich.':'Vollständig bezahlt - keine weitere Zahlung erforderlich.',9);
 }
 if(qrError)paragraph(qrError,9);
 if(closing){ensure(36);pdf.moveDown(.6);paragraph(closing);}
 const contentPages=pdf.bufferedPageRange().count,totalPages=contentPages+(bill?1:0);
 const footer=[companyName,company.vat_number?'MWST '+company.vat_number:company.uid,company.website,company.email].filter(Boolean).join(' · ');
 for(let page=0;page<contentPages;page++){pdf.switchToPage(page);const margin=pdf.page.margins.bottom;pdf.page.margins.bottom=0;pdf.font('Liberation Sans').fontSize(8).fillColor('#555');pdf.text(footer,left,pdf.page.height-51,{width:width-70,height:30,ellipsis:true});pdf.text(`${page+1} / ${totalPages}`,right-60,pdf.page.height-51,{width:60,align:'right',lineBreak:false});pdf.page.margins.bottom=margin;}
 pdf.switchToPage(contentPages-1);
 if(bill){pdf.addPage();pdf.font('Liberation Sans-Bold').fontSize(18).fillColor('#111').text('ZAHLUNGSINFORMATIONEN',left,44,{width});pdf.moveDown(.8);paragraph('Rechnung '+document.number,11);paragraph(paid>0?'Bitte nur den offenen Betrag bezahlen.':'Bitte den Rechnungsbetrag mit dem folgenden QR-Zahlteil bezahlen.',10);paragraph('Offener Betrag: '+document.currency+' '+money(balance),11);bill.attachTo(pdf,0,pdf.page.height-SwissQRBill.height);}
 pdf.end();return finished;
}
