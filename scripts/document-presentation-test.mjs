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
const draft={number:'RE-2026-019',customer:'Acme AG',date:'2026-10-01',due:'30',vatRate:'8.1',currency:'CHF',note:'',status:'sent',positions:[{id:'one',description:'IT-Beratung',quantity:'2',price:'100',unit:'Stunde',vatRate:'8.1'}]};
const directory={'Acme AG':{address:'Bahnhofstrasse 123',zip:'8001',city:'Zürich'}};
const company={raw:{name:'Alpenblick Digital AG',street:'Seefeldstrasse',building_number:'73',postal_code:'8008',city:'Zürich',iban:'CH9300762011623852957',invoice_intro_text:'Individuelle Rechnungseinleitung',invoice_footer_text:'Individueller Rechnungsabschluss',quote_intro_text:'Individuelle Angebotseinleitung',quote_footer_text:'Individueller Angebotsabschluss',is_demo:true}};
assert.ok(!/export function (InvoicePreview|OfferPreview)/.test(source),'Unused HTML renderers must not reintroduce a second preview');

// Execute the production renderer used by the HTTP PDF endpoints; no alternative calculation.
const pdfModuleSource=(await fs.readFile('lib/server/document-pdf.ts','utf8')).replace('import "server-only";','').replace('"@/lib/qr-bill"',JSON.stringify('data:text/javascript;base64,'+Buffer.from(qrCompiled).toString('base64'))).replace('"pdfkit"',JSON.stringify(pathToFileURL(require.resolve('pdfkit')).href)).replace('"swissqrbill/pdf"',JSON.stringify(pathToFileURL(require.resolve('swissqrbill/pdf')).href));
const pdfModuleJs=ts.transpileModule(pdfModuleSource,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {documentPdf}=await import('data:text/javascript;base64,'+Buffer.from(pdfModuleJs).toString('base64'));
const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
const data={number:'RE-QR-QA',kind:'invoice',status:'sent',currency:'CHF',total:216.2,subtotal:200,vat_amount:16.2,paid_amount:100,issue_date:'2026-10-01',due_date:'2026-10-31',customer:{name:'Acme AG',street:'Bahnhofstrasse 123',postal_code:'8001',city:'Zürich'},items:[{description:'IT-Beratung',quantity:2,unit:'Stunde',unit_price:100,vat_rate:8.1}]};
async function inspectPdf(document){
 const bytes=await documentPdf(document,company.raw);assert.equal(bytes.subarray(0,5).toString(),'%PDF-');
 const pdf=await getDocument({data:new Uint8Array(bytes),isEvalSupported:false}).promise;
 const pages=[];for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i),box=page.getViewport({scale:1});assert.ok(Math.abs(box.width/box.height-210/297)<.01);pages.push((await page.getTextContent()).items.map(item=>item.str??'').join(' '));}
 await pdf.destroy();return {bytes,pages};
}
const generated=await inspectPdf(data),text=generated.pages.join(' ');
for(const value of ['IT-Beratung','Individuelle Rechnungseinleitung','Individueller Rechnungsabschluss','31.10.2026','216.20','116.20','Zahlteil','Empfangsschein'])assert.ok(text.includes(value),value);
for(const status of ['paid','cancelled','draft']){const result=await inspectPdf({...data,status});assert.ok(!result.pages.join(' ').includes('Empfangsschein'),status+' has no payable QR slip');}
const quote=await inspectPdf({...data,kind:'offer',number:'AN-TEST',valid_until:'2026-10-31'});assert.ok(quote.pages.join(' ').includes('Individuelle Angebotseinleitung'));assert.ok(!quote.pages.join(' ').includes('Empfangsschein'));
const multipage=await inspectPdf({...data,subtotal:2800,vat_amount:226.8,total:3026.8,items:Array.from({length:14},(_,i)=>({...data.items[0],description:'Position '+(i+1)+' – Prüfung des vollständigen Dokumentinhalts'}))});
assert.ok(multipage.pages.length>1);assert.ok(multipage.pages.at(-1).includes('Zahlteil'),'Separate QR page remains reachable through document page count');
await fs.writeFile(process.env.BINSO_PDF_FIXTURE_OUTPUT??'/tmp/binso-production-pdf-fixture.pdf',multipage.bytes);
await fs.writeFile('/tmp/binso-production-pdf-fixture.json',JSON.stringify({pages:multipage.pages.length,size:multipage.bytes.length}));
console.log('Production PDF: A4 pages, company texts, items, dates, totals, remaining-balance QR, paid/cancelled/draft suppression and multipage QR passed.');

const billingCompany={name:'Binso GmbH',street:'Weissbadstrasse',building_number:'8b',postal_code:'9050',city:'Appenzell',uid:'CHE-173.401.068'};
if(process.env.BINSO_BILLING_SAMPLE_DIR){
 await fs.mkdir(process.env.BINSO_BILLING_SAMPLE_DIR,{recursive:true});
 for(const month of ['09','10']){const bytes=await documentPdf({...data,number:'BO-2026-'+month,status:'paid',total:49,subtotal:49,vat_amount:0,paid_amount:49,issue_date:'2026-'+month+'-01',customer:{name:'Musterwerk AG',city:'Bern'},items:[{description:'Binso One Business · Demo-Abonnement',quantity:1,unit:'Monat',unit_price:49,vat_rate:0}]},billingCompany);await fs.writeFile(process.env.BINSO_BILLING_SAMPLE_DIR+'/billing-2026-'+month+'.pdf',bytes);}
}

const financialJs=ts.transpileModule(await fs.readFile('lib/financial-status.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const financial=await import('data:text/javascript;base64,'+Buffer.from(financialJs).toString('base64'));
const readNodes=new Set(['DocumentReadView','useDocumentTotals','numberValue','money','dateOnly','isoToSwiss','invoiceDueDate','documentPresentation']);
const readFragment=ast.statements.filter(node=>ts.isFunctionDeclaration(node)&&readNodes.has(node.name?.text)).map(node=>node.getText(ast)).join('\n')+'\nexport {DocumentReadView};';
const readCompiled=ts.transpileModule(readFragment,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const readExports={};
Function('require','exports','useMemo','Status','Link','financialStatus','financialStatusLabels',readCompiled)(require,readExports,callback=>callback(),({children})=>React.createElement('span',null,children),({children,href})=>React.createElement('a',{href},children),financial.financialStatus,financial.financialStatusLabels);
const paidRead=renderToStaticMarkup(React.createElement(readExports.DocumentReadView,{type:'Rechnung',draft:{...draft,status:'paid',total:216.2,paidAmount:216.2,paidOn:'2026-10-06'},directory}));
assert.ok(paidRead.includes('Rechnungsdatum'));assert.ok(paidRead.includes('Bezahlt am'));assert.ok(paidRead.includes('06.10.2026'));assert.ok(!paidRead.includes('Fällig am'));assert.ok(!paidRead.includes('Offener Betrag'));assert.equal((paidRead.match(/>Bezahlt</g)||[]).length,0);
const unprovenPaid=renderToStaticMarkup(React.createElement(readExports.DocumentReadView,{type:'Rechnung',draft:{...draft,status:'paid',total:216.2,paidAmount:216.2},directory}));assert.ok(!unprovenPaid.includes('Bezahlt am'),'No completion date is invented for legacy payments');
const openRead=renderToStaticMarkup(React.createElement(readExports.DocumentReadView,{type:'Rechnung',draft:{...draft,date:'2099-10-01'},directory}));assert.ok(openRead.includes('Offener Betrag'));assert.ok(openRead.includes('Fällig am'));assert.ok(openRead.includes('document-mobile-price'));assert.ok(openRead.includes('× CHF 100.00'));
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
