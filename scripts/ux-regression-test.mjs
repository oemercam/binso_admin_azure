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
