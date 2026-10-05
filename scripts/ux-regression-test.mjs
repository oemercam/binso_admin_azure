import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';

const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
let source=await fs.readFile('lib/server/repositories/business-api.ts','utf8');
source=source.replace('import "server-only";','');
const dependencies={
 '../audit':'export async function audit(){}',
 '../http':'export class ApiError extends Error {constructor(status,code,message){super(message);this.status=status;this.code=code}}',
 '@/lib/permissions':'export const ownRecordOnly=()=>false;export const tenantCan=()=>true;',
 '@/lib/qr-bill':'export const invoicePaymentIssue=()=>null;',
};
for(const [specifier,stub] of Object.entries(dependencies))source=source.replace(JSON.stringify(specifier),JSON.stringify(moduleUrl(stub)));
const {listApiBusiness}=await import(moduleUrl(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText));
const session={organizationId:'tenant-under-test',userId:'owner',role:'owner'};
const calls=[];
const client={query:async(sql,values)=>{calls.push({sql,values});return {rows:[]}}};
await listApiBusiness(client,session,'documents','kind=eq.invoice&order=issue_date.desc&limit=5');
assert.match(calls[0].sql,/order by q\.issue_date desc,q\.id desc limit 5/);
assert.match(calls[0].sql,/organization_id=\$1/);
assert.deepEqual(calls[0].values,['tenant-under-test']);
await listApiBusiness(client,session,'payments','order=paid_on.desc&limit=5');
assert.match(calls[1].sql,/order by q\.paid_on desc,q\.id desc limit 5/);
for(const order of ['paid_on.desc;drop table payments','paid_on.sideways','secret.desc','issue_date.desc','created_at.desc.nullslast']){
 await assert.rejects(()=>listApiBusiness(client,session,'payments','order='+encodeURIComponent(order)),error=>error.code==='invalid_order');
}
assert.equal(calls.length,2,'Invalid sort values must never execute SQL');
await listApiBusiness(client,session,'expenses','order=expense_date.desc');
assert.match(calls[2].sql,/order by q\.expense_date desc,q\.id desc/);
await listApiBusiness(client,session,'customer_contacts','order=is_primary.desc,created_at.asc');
assert.match(calls[3].sql,/order by q\.is_primary desc,q\.created_at asc,q\.id desc/);
console.log('Recent document/payment ordering preserves tenant scope and rejects SQL sort injection.');

const searchSource=await fs.readFile('lib/search.ts','utf8');
const {searchSources,searchItem}=await import(moduleUrl(ts.transpileModule(searchSource,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText));
for(const source of searchSources){
 const result=searchItem(source,{id:'canonical-uuid',name:'Acme AG',number:source.table==='documents'?'AN-2026-000001':undefined,total:135.67,customer:{name:'Acme AG'}});
 assert.ok(result.title&&result.type&&result.icon,'Search links need an accessible text label');
 assert.ok(await fs.stat('app'+source.href+'/[id]/page.tsx'),'Search may only link to existing detail routes');
 assert.equal(result.href,source.href+'/'+(source.table==='documents'?'AN-2026-000001':'canonical-uuid'));
}
assert.equal(searchItem(searchSources[5],{id:'employee-id',first_name:'Anna',last_name:'Muster'}).title,'Anna Muster');
console.log('Search results use visible labels, canonical record IDs and existing detail routes.');


const [tokensCss,baseCss,responsiveCss]=await Promise.all([
  fs.readFile('app/styles/tokens.css','utf8'),
  fs.readFile('app/styles/base.css','utf8'),
  fs.readFile('app/styles/responsive.css','utf8'),
]);
for(const token of ['--desktop-section-y:24px','--desktop-surface-x:24px','--desktop-action-h:40px']){
  assert.ok(tokensCss.includes(token),'Missing canonical desktop layout token: '+token);
}
assert.ok(baseCss.includes('.icon-action'),'Section icon actions must use the shared icon control contract');
assert.ok(responsiveCss.includes('.form-section>.section-title'),'Form section headings must use the canonical desktop section rhythm');
assert.ok(responsiveCss.includes('.invoice-form>.form-section'),'Document editors must use the shared inset form-section layout');
assert.ok(responsiveCss.includes('var(--desktop-action-h)'),'Desktop actions must derive from the shared action height token');
console.log('Desktop workspace spacing, form sections and icon actions use canonical shared layout rules.');
