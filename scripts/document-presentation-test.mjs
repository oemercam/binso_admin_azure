import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';

const require=createRequire(import.meta.url);
const qrSource=(await fs.readFile('lib/qr-bill.ts','utf8')).replace('"swissqrbill/utils"',JSON.stringify(pathToFileURL(require.resolve('swissqrbill/utils')).href));
const qrCompiled=ts.transpileModule(qrSource,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const qr=await import('data:text/javascript;base64,'+Buffer.from(qrCompiled).toString('base64'));
const source=await fs.readFile('components/documents.tsx','utf8');
const ast=ts.createSourceFile('documents.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const company={raw:{name:'Alpenblick Digital AG',street:'Seefeldstrasse',building_number:'73',postal_code:'8008',city:'Zürich',iban:'CH9300762011623852957',invoice_intro_text:'Individuelle Rechnungseinleitung',invoice_footer_text:'Individueller Rechnungsabschluss',quote_intro_text:'Individuelle Angebotseinleitung',quote_footer_text:'Individueller Angebotsabschluss',is_demo:true}};
const draft={number:'RE-2026-019',customer:'Acme AG',date:'2026-10-01',due:'30',vatRate:'8.1',currency:'CHF',note:'',status:'sent',positions:[{id:'one',description:'IT-Beratung',quantity:'2',price:'100',unit:'Stunde',vatRate:'8.1'}]};
const directory={'Acme AG':{address:'Bahnhofstrasse 123',zip:'8001',city:'Zürich'}};
// The retired HTML templates had no runtime consumers. Preserve their business
// assertions against the actual PDF used by preview, download and mail instead.
const moduleUrl=code=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64');
const pdfSource=(await fs.readFile('lib/server/document-pdf.ts','utf8')).replace('import "server-only";','').replace('"pdfkit"',JSON.stringify(pathToFileURL(require.resolve('pdfkit')).href)).replace('"swissqrbill/pdf"',JSON.stringify(pathToFileURL(require.resolve('swissqrbill/pdf')).href)).replace('"@/lib/qr-bill"',JSON.stringify(moduleUrl(qrSource)));
const {documentPdf}=await import(moduleUrl(pdfSource));
const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
async function inspectPdf(document){const bytes=await documentPdf(document,company.raw);const task=getDocument({data:new Uint8Array(bytes),isEvalSupported:false});const pdf=await task.promise;const pages=[];for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i),viewport=page.getViewport({scale:1});assert.ok(Math.abs(viewport.height/viewport.width-Math.sqrt(2))<0.001);const content=await page.getTextContent();pages.push(content.items.map(item=>item.str).join(' '));}await task.destroy();return {bytes,pages,text:pages.join(' ')};}
const document={number:draft.number,kind:'invoice',status:'sent',currency:'CHF',issue_date:draft.date,due_date:'2026-10-31',subtotal:200,vat:16.2,total:216.2,customer:{name:'Acme AG',street:directory['Acme AG'].address,postal_code:'8001',city:'Zürich'},items:[{description:'IT-Beratung',quantity:2,unit:'Stunde',unit_price:100,vat_rate:8.1}]};
const invoice=await inspectPdf(document);
for(const value of ['Individuelle Rechnungseinleitung','Individueller Rechnungsabschluss','Seefeldstrasse 73','31.10.2026','216.20','Stunde','Empfangsschein','Zahlteil'])assert.ok(invoice.text.includes(value),value);
assert.ok(!/Demo-Rechnung|Demo-Zahlteil|Nicht bezahlen|Beispielkonto/.test(invoice.text));
for(const status of ['paid','cancelled','draft']){const result=await inspectPdf({...document,status,paid_amount:status==='paid'?216.2:0});assert.ok(!result.text.includes('Empfangsschein'),status+' has no payable QR slip');assert.ok(result.text.includes(status==='draft'?'ENTWURF':status==='cancelled'?'STORNIERT':'Vollständig bezahlt'));}
const offer=await inspectPdf({...document,kind:'offer',number:'AN-2026-012',currency:'EUR',valid_until:'2026-10-31'});
for(const value of ['Individuelle Angebotseinleitung','Individueller Angebotsabschluss','31.10.2026','Total EUR'])assert.ok(offer.text.includes(value),value);
const partial=await inspectPdf({...document,paid_amount:100});assert.ok(partial.text.includes('Restzahlungsanforderung'));assert.ok(partial.text.includes('116.20'));
const multi=await inspectPdf({...document,items:Array.from({length:25},(_,i)=>({...document.items[0],description:'Position '+(i+1)}))});assert.ok(multi.pages.length>1);assert.ok(multi.pages.every(text=>text.trim().length>20),'No unintended blank PDF page');assert.ok(multi.text.includes('Position 25')&&multi.text.includes('Zahlteil'));
if(process.env.BINSO_UX_PDF_OUTPUT){await fs.writeFile(process.env.BINSO_UX_PDF_OUTPUT,multi.bytes);console.log('Actual QR fixture PDF pages:',multi.pages.length);}
console.log('Actual PDF: company texts, addresses, units, dates, currency, paid/cancelled/draft guards, partial balance, pagination and complete QR payment part passed.');

const financialJs=ts.transpileModule(await fs.readFile('lib/financial-status.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const financial=await import('data:text/javascript;base64,'+Buffer.from(financialJs).toString('base64'));
const readNodes=new Set(['DocumentReadView','useDocumentTotals','numberValue','money','dateOnly','isoToSwiss','invoiceDueDate']);
const readFragment=ast.statements.filter(node=>ts.isFunctionDeclaration(node)&&readNodes.has(node.name?.text)).map(node=>node.getText(ast)).join('\n')+'\nexport {DocumentReadView};';
const readCompiled=ts.transpileModule(readFragment,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const readExports={};
Function('require','exports','useMemo','Status','Link','financialStatus','financialStatusLabels',readCompiled)(require,readExports,callback=>callback(),({children})=>React.createElement('span',null,children),({children,href})=>React.createElement('a',{href},children),financial.financialStatus,financial.financialStatusLabels);
const paidRead=renderToStaticMarkup(React.createElement(readExports.DocumentReadView,{type:'Rechnung',draft:{...draft,status:'paid',total:216.2,paidAmount:216.2,paidOn:'2026-10-06'},directory}));
assert.ok(paidRead.includes('Rechnungsdatum'));assert.ok(paidRead.includes('Bezahlt am'));assert.ok(paidRead.includes('06.10.2026'));assert.ok(!paidRead.includes('Fällig am'));assert.ok(!paidRead.includes('Offener Betrag'));assert.equal((paidRead.match(/>Bezahlt</g)||[]).length,1);
const unprovenPaid=renderToStaticMarkup(React.createElement(readExports.DocumentReadView,{type:'Rechnung',draft:{...draft,status:'paid',total:216.2,paidAmount:216.2},directory}));assert.ok(!unprovenPaid.includes('Bezahlt am'),'No completion date is invented for legacy payments');
const openRead=renderToStaticMarkup(React.createElement(readExports.DocumentReadView,{type:'Rechnung',draft:{...draft,date:'2099-10-01'},directory}));assert.ok(openRead.includes('Offen'));assert.ok(openRead.includes('Fällig am'));assert.ok(openRead.includes('document-mobile-price'));assert.ok(openRead.includes('× CHF 100.00'));
for(const status of ['draft','cancelled']){
 const html=renderToStaticMarkup(React.createElement(readExports.DocumentReadView,{type:'Rechnung',draft:{...draft,status,total:216.2},directory}));
 assert.ok(!html.includes('Zahlungsstand')&&!html.includes('Offener Betrag'),status+' must not demand payment');
}
assert.equal(financial.financialStatus({kind:'invoice',status:'sent',total:100,paid_amount:0,due_date:'2026-10-20'},'2026-10-07'),'open');
assert.equal(financial.financialStatus({kind:'invoice',status:'partial',total:100,paid_amount:30,due_date:'2026-10-01'},'2026-10-07'),'overdue');
assert.equal(financial.financialStatus({kind:'invoice',status:'sent',total:100,paid_amount:100,due_date:'2026-10-01'},'2026-10-07'),'paid');
assert.equal(financial.financialStatus({kind:'invoice',status:'cancelled',total:100,paid_amount:0,due_date:'2026-10-01'},'2026-10-07'),'cancelled');
assert.equal(financial.documentDateLabel({kind:'invoice',status:'sent',total:100,paid_amount:0,due_date:'2026-09-29'},'2026-10-07'),'8 Tage überfällig');
assert.equal(financial.financialStatus({kind:'offer',status:'sent',valid_until:'2026-10-01'},'2026-10-07'),'expired');
console.log('Operational document details: real paid date, no fabricated legacy date, derived open/overdue/partial/paid states, cancellation and mobile quantity/unit/unit-price/amount passed.');

const listSource=await fs.readFile('components/document-list.tsx','utf8');
const listAst=ts.createSourceFile('document-list.tsx',listSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const listFragment=listAst.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='DocumentList').getText(listAst);
const listCompiled=ts.transpileModule(listFragment,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const listExports={};
Function('require','exports','RecordsView','RecordRow','financialStatus','financialStatusLabels','documentDateLabel','formatCurrency',listCompiled)(require,listExports,()=>null,()=>null,financial.financialStatus,financial.financialStatusLabels,financial.documentDateLabel,financial.formatCurrency);
const outstandingList=listExports.DocumentList({items:[],kind:'invoice',outstanding:true});
assert.deepEqual(outstandingList.props.chips,['Alle','Überfällig']);assert.equal(outstandingList.props.emptyLabel('Alle'),'Keine offenen Rechnungen');
assert.deepEqual(listExports.DocumentList({items:[],kind:'invoice'}).props.chips,['Alle','Entwurf','Offen','Überfällig','Bezahlt']);
console.log('Optional outstanding lists retain scoped filters; the full invoice list retains all main filters.');

const debtorData=qr.createQrBillData(company.raw,{number:'RE-QR-QA',total:116.20,currency:'CHF',debtor:{name:'Empfänger AG',street:'Bahnhofstrasse 24',postal_code:'8001',city:'Zürich'}});
assert.equal(debtorData.amount,116.20);assert.equal(debtorData.debtor.address,'Bahnhofstrasse');assert.equal(debtorData.debtor.buildingNumber,'24');
assert.equal(qr.createQrBillData(company.raw,{number:'RE-SCOR',total:100,reference:'RF18539007547034'}).reference,'RF18539007547034');
assert.throws(()=>qr.createQrBillData(company.raw,{number:'RE-SCOR',total:100,reference:'RF00539007547034'}));
assert.throws(()=>qr.createQrBillData({...company.raw,iban:'CH0000000000000000000'},{number:'RE-invalid',total:100}));
const employeeJs=ts.transpileModule(await fs.readFile('lib/employee-validation.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {employeeInputIssue}=await import('data:text/javascript;base64,'+Buffer.from(employeeJs).toString('base64'));
const employeeInput={email:'qa@example.invalid',entryDate:'2026-10-08',workloadPercent:80,weeklyHours:42,vacationDays:25};
assert.equal(employeeInputIssue(employeeInput),null);
for(const invalid of [{email:'invalid'},{entryDate:'2026-02-30'},{workloadPercent:101},{weeklyHours:0},{weeklyHours:81},{vacationDays:-1}])assert.ok(employeeInputIssue({...employeeInput,...invalid}));
console.log('QR debtor structured address, exact remaining amount, valid SCOR/invalid references and shared employee validation passed.');


// Guard the central PDF viewer against regressing to an endless multi-page list.
const pdfViewerSource=await fs.readFile('components/pdf-preview.tsx','utf8');
assert.match(pdfViewerSource,/data-viewer-mode="single-page"/,'Viewer must explicitly declare single-page mode');
assert.match(pdfViewerSource,/<PdfPage key=\{current\} pdf=\{pdf\} pageNumber=\{current\} zoomed=\{zoomed\}\/>/,'Exactly the selected PDF page is mounted');
assert.doesNotMatch(pdfViewerSource,/Array\.from\(\{length:pdf\.numPages\}/,'Do not render every PDF page simultaneously');
for(const label of ['Vorherige Seite','Nächste Seite','PDF-Seitennavigation'])assert.ok(pdfViewerSource.includes(label),label);
assert.match(pdfViewerSource,/disabled=\{current<=1\}/,'Previous page is disabled at first page');
assert.match(pdfViewerSource,/disabled=\{current>=pdf\.numPages\}/,'Next page is disabled at last page');
console.log('Single-page PDF viewer source contract and bounded navigation passed.');
