import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=await fs.readFile('lib/permissions.ts','utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const permissionsUrl='data:text/javascript;base64,'+Buffer.from(js).toString('base64');
const {tenantCan,operatorCan,routePermission}=await import(permissionsUrl);
for(const role of ['owner','admin','finance'])assert.equal(tenantCan(role,'accounting:read'),true);
for(const role of ['member','reader','hr','project_manager'])assert.equal(tenantCan(role,'accounting:read'),false);
assert.equal(routePermission('/finanzen'),'accounting:read');
for(const [route,permission] of [['/angebote','sales:read'],['/zeit','time:read'],['/mitarbeiter','employees:read'],['/belege','documents:read']])assert.equal(routePermission(route),permission);
assert.equal(operatorCan('platform_support','subscriptions:read'),false);
assert.equal(operatorCan('platform_billing','subscriptions:read'),true);
for(const role of ['unknown','__proto__','constructor','']){
 assert.equal(tenantCan(role,'customers:read'),false);
 assert.equal(tenantCan(role,'support:write'),false);
 assert.equal(operatorCan(role,'platform:read'),false);
}
console.log('Finance and operator permission matrix passed.');
// Exercise the actual search handler; another employee's record must not leak
// through an endpoint that otherwise has module read permission.
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
let businessSource=(await fs.readFile('lib/server/repositories/business-api.ts','utf8')).replace('import "server-only";','');
const businessDependencies={
 '../audit':moduleUrl('export async function audit(){}'),
 '../http':moduleUrl('export class ApiError extends Error {}'),
 '@/lib/permissions':permissionsUrl,
 '@/lib/qr-bill':moduleUrl('export const invoicePaymentIssue=()=>null'),
};
for(const [specifier,url] of Object.entries(businessDependencies))businessSource=businessSource.replaceAll(JSON.stringify(specifier),JSON.stringify(url));
const businessUrl=moduleUrl(ts.transpileModule(businessSource,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText);
const searchContractUrl=moduleUrl(ts.transpileModule(await fs.readFile('lib/search.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText);
const dependencies={
 '@/lib/server/session':moduleUrl('export async function requireSession(){return {organizationId:"tenant",userId:"member",role:"member"}}'),
 '@/lib/permissions':permissionsUrl,
 '@/lib/server/http':moduleUrl('export const json=value=>value;export const apiError=error=>{throw error}'),
 '@/lib/server/plan-access':moduleUrl('export async function getOrganizationPlan(){return "business"}'),
 '@/config/plan-access':moduleUrl('export const planAllowsModule=()=>true'),
 '@/lib/server/db':moduleUrl('export async function withTenant(org,user,task){if(org!=="tenant"||user!=="member")throw Error("Missing tenant scope");return task({query:async(sql,values)=>{if(!sql.includes("from expenses"))return {rows:[]};const own=sql.includes("q.created_by_user_id=$2")&&values[1]==="member";return {rows:[{id:"own",merchant:"Probe own"},...(!own?[{id:"foreign",merchant:"Probe foreign"}]:[])]}}})}'),
 '@/lib/server/repositories/business-api':businessUrl,
 '@/lib/search':searchContractUrl,
};
let searchSource=await fs.readFile('app/api/search/route.ts','utf8');
for(const [specifier,url] of Object.entries(dependencies))searchSource=searchSource.replaceAll(JSON.stringify(specifier),JSON.stringify(url));
const handler=await import(moduleUrl(ts.transpileModule(searchSource,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText));
const results=await handler.GET({nextUrl:new URL('https://example.invalid/api/search?q=Probe')});
assert.deepEqual(results.items.map(item=>item.href),['/spesen/own']);
console.log('Search respects member record ownership.');
