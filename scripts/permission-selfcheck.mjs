import {financialModuleUrl} from "./data-test-modules.mjs";
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=await fs.readFile('lib/permissions.ts','utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const permissionsUrl='data:text/javascript;base64,'+Buffer.from(js).toString('base64');
const {tenantCan,operatorCan,routePermission}=await import(permissionsUrl);
for(const role of ['owner','admin','finance'])assert.equal(tenantCan(role,'accounting:read'),true);
for(const role of ['member','reader','hr','project_manager'])assert.equal(tenantCan(role,'accounting:read'),false);
assert.equal(routePermission('/finanzen'),'documents:read');
assert.equal(routePermission('/finanzen/analyse'),'accounting:read');
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
 '../business-idempotency':moduleUrl('export async function idempotentBusiness(c,input,write){return write()}'),
 '../audit':moduleUrl('export async function audit(){}'),
 '../http':moduleUrl('export class ApiError extends Error {}'),
 '@/lib/permissions':permissionsUrl,
 '@/lib/financial-status':financialModuleUrl,
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
// Exercise both expense mutations: module write alone cannot grant approval.
for(const path of ['app/api/expenses/route.ts','app/api/expenses/[id]/route.ts']){
 for(const role of ['member','reader','hr','finance','owner','admin','project_manager']){
  let writes=0;
  const databaseUrl=moduleUrl(`export async function requireTenantFeature(){return {role:${JSON.stringify(role)}}} export async function tenantList(){return []} export async function tenantInsert(){globalThis.__expenseWrites++;return [{id:'expense'}]} export async function tenantUpdate(){globalThis.__expenseWrites++;return [{id:'expense'}]}`);
  const httpUrl=moduleUrl(`export class ApiError extends Error{constructor(status,code,message){super(message);this.status=status;this.code=code}} export const assertSameOrigin=()=>{};export const cleanText=(v)=>typeof v==='string'?v:'';export const readJson=async r=>r.body;export const json=(data,status=200)=>({data,status});export const apiError=e=>({status:e.status??500,data:{error:e.code}});`);
  let expenseSource=await fs.readFile(path,'utf8');
  expenseSource=expenseSource.replaceAll('"@/lib/server/http"',JSON.stringify(httpUrl)).replaceAll('"@/lib/server/database"',JSON.stringify(databaseUrl));
  const expense=await import(moduleUrl(ts.transpileModule(expenseSource,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText));
  for(const status of ['approved','rejected']){
   globalThis.__expenseWrites=0;
   const request={body:{merchant:'SBB',amount:42,vatRate:8.1,status}};
   const response=path.includes('[id]')?await expense.PATCH(request,{params:Promise.resolve({id:'expense'})}):await expense.POST(request);
   const allowed=['owner','admin','project_manager'].includes(role);
   assert.equal(response.status,allowed?(path.includes('[id]')?200:409):403,`${path} ${role} ${status}`);
   writes=globalThis.__expenseWrites;
   assert.equal(writes,allowed&&path.includes('[id]')?1:0,'Forbidden approval must not write');
  }
 }
}
delete globalThis.__expenseWrites;
console.log('Expense approval/rejection rejects unauthorized roles before either mutation writes.');

// Related links consume the real AppShell access context; denied records remain
// readable as text, while read-only users retain authorized read navigation.
const React=await import('react');
const {renderToStaticMarkup}=await import('react-dom/server');
const {createRequire}=await import('node:module');
const require=createRequire(import.meta.url);
const contextExports={};
Function('require','exports',ts.transpileModule(await fs.readFile('lib/client/page-access.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText)(require,contextExports);
const uiSource=await fs.readFile('components/ui.tsx','utf8');
const uiAst=ts.createSourceFile('ui.tsx',uiSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const accessLinkSource=uiAst.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='AccessLink').getText(uiAst);
const uiExports={};
Function('require','exports','usePageAccess','Link',ts.transpileModule(accessLinkSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText)(require,uiExports,contextExports.usePageAccess,({href,children,className})=>React.createElement('a',{href,className},children));
const related=allowed=>renderToStaticMarkup(React.createElement(contextExports.PageAccessContext.Provider,{value:{write:false,canOpen:()=>allowed}},React.createElement(uiExports.AccessLink,{href:'/kunden/related',fallback:'Kunde'},'Kunde')));
assert.equal(related(false),'Kunde','Denied related record must not expose a navigation link');
assert.equal(related(true),'<a href="/kunden/related">Kunde</a>','Authorized read navigation remains available without write access');
console.log('Related-record links respect the AppShell context and retain a text fallback.');
