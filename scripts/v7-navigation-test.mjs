import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const dummy=new Proxy(()=>null,{get:()=>()=>null});
function load(file,deps={}){const result={};Function('require','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText)(name=>Object.hasOwn(deps,name)?deps[name]:name==='react/jsx-runtime'?require(name):dummy,result);return result;}
const navigation=load('config/workspace-navigation.ts');
assert.deepEqual(navigation.moreNavigation[0].items.map(item=>item.href),['/angebote','/rechnungen','/zahlungen','/spesen','/finanzen','/produkte','/lieferanten','/vertraege']);
assert.equal(navigation.mainNavigation.length,4);assert.equal(navigation.primaryNavigationSection('/kunden/one'),'kunden');

let params=new URLSearchParams('customerId=customer-one&returnTo=%2Fkunden%2Fcustomer-one&q=kept&status=Offen'),path='/rechnungen',destination,readPath;
const routing={useSearchParams:()=>params,usePathname:()=>path,useRouter:()=>({replace:href=>{destination=href;}})};
const safe=load('lib/navigation.ts');
const {useCustomerScope:customerScopeHook}=load('lib/client/customer-scope.ts',{'next/navigation':routing,'@/lib/navigation':safe,'./use-api-query':{useApiQuery:path=>{readPath=path;return {data:{item:{name:'Stored company'}},error:null};}}});
const scope=customerScopeHook();assert.equal(readPath,'/api/customers/customer-one');assert.equal(scope.scope.value,'Stored company');assert.equal(scope.returnTo,'/kunden/customer-one');
const detail=new URL(scope.detailHref('/rechnungen/RE-1'),'https://fixture.invalid');assert.equal(detail.searchParams.get('returnTo'),'/rechnungen?'+params.toString());
scope.scope.onClear();assert.equal(destination,'/rechnungen?q=kept&status=Offen','Clearing the customer preserves search/status and removes the obsolete hub back-link');
params=new URLSearchParams();assert.equal(customerScopeHook().scope,undefined);assert.equal(readPath,null,'A global list adds neither a customer filter nor a customer request');
params=new URLSearchParams('customerId=customer-one&returnTo=https%3A%2F%2Fforeign.invalid');assert.equal(customerScopeHook().returnTo,'/kunden/customer-one');

// Execute the actual ActionRow declaration with real React markup.
const ux=ts.createSourceFile('ux.tsx',fs.readFileSync('components/binso-ux.tsx','utf8'),99,true,4);
const rowSource=ux.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='ActionRow').getText(ux);
let permitted=true;const row={};const Text=({children})=>children;
Function('require','exports','usePageAccess','Icon','LocalizedText','Link',ts.transpileModule(rowSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText)(require,row,()=>({canOpen:()=>permitted,write:true}),({name,size})=>React.createElement('svg',{'data-icon':name,width:size,height:size}),Text,({children,...props})=>React.createElement('a',props,children));
const html=renderToStaticMarkup(React.createElement(row.ActionRow,{title:'Rechnungen',icon:'receipt',href:'/rechnungen?customerId=one',value:7}));
assert.match(html,/action-row-label/);assert.match(html,/action-row-value">7/);assert.match(html,/data-icon="arrow" width="16"/);assert.equal((html.match(/<a /g)??[]).length,1);assert.ok(!html.includes('<button'));
permitted=false;assert.equal(renderToStaticMarkup(React.createElement(row.ActionRow,{title:'Rechnungen',icon:'receipt',href:'/rechnungen',value:7})),'','Denied destinations disclose no count or link');

const react={useState:initial=>[typeof initial==='function'?initial():initial,()=>{}],useRef:value=>({current:value}),useEffect(){},useId:()=>':v7:'};
const ActionRow=()=>null,AppShell=()=>null;let queryPath;
params=new URLSearchParams();
const customer=load('components/pages/customers.tsx',{
 react,'next/navigation':routing,'@/lib/navigation':safe,'@/lib/client/page-access':{usePageAccess:()=>({write:true,canOpen:()=>true})},
 '@/lib/client/locale':{useLocale:()=>({locale:'de'}),LocalizedText:Text},'@/lib/locales/config':{localeTags:{de:'de-CH'}},
 '@/lib/client/use-api-query':{useApiQuery:path=>{queryPath=path;return {data:{item:{id:'one',name:'Stored company',status:'active'},counts:{projects:2,offers:3,invoices:4,payments:5,contacts:1,files:0},capabilities:{offers:true,invoices:true,files:true}},error:null};}},
 '../app-shell':{AppShell},'../binso-ux':new Proxy({ActionRow},{get:(target,key)=>target[key]??dummy}),
});
const tree=customer.CustomerDetail({customerId:'one'}),nodes=[];function walk(node){if(!node)return;if(Array.isArray(node))return node.forEach(walk);if(React.isValidElement(node)){nodes.push(node);walk(node.props.children);}}walk(tree);
assert.equal(queryPath,'/api/customers/one?include=hub');assert.equal(tree.props.headingPlacement,'header');
const rows=nodes.filter(node=>node.type===ActionRow&&node.props.value!==undefined||node.type===ActionRow&&['Verlauf','Stammdaten'].includes(node.props.title));
assert.deepEqual(rows.map(node=>node.props.title),['Aufträge','Angebote','Rechnungen','Zahlungen','Kontakte','Dateien','Verlauf','Stammdaten']);
assert.equal(nodes.some(node=>node.props.role==='tabpanel'),false);assert.equal(nodes.some(node=>node.props.label==='Kundenbereiche'),false,'Hub has no old tabs');
assert.equal(new URL(rows[2].props.href,'https://fixture.invalid').searchParams.get('customerId'),'one');assert.equal(new URL(rows[2].props.href,'https://fixture.invalid').searchParams.get('returnTo'),'/kunden/one');

let allowed=new Set(['projects:read','sales:read','invoices:read','payments:read','documents:read']),foreign=false,queries=[];
const apiError=class extends Error{constructor(status){super(String(status));this.status=status;}};
const backend=load('lib/server/repositories/customer-workspace.ts',{
 'server-only':{},'@/lib/permissions':{tenantCan:(_role,permission)=>allowed.has(permission)},'../http':{ApiError:apiError},
 './business-api':{listApiBusiness:async(_c,_s,table,filter)=>{queries.push({table,filter});if(table==='customers')return foreign?[]:[{id:'one',name:'Stored company'}];return [{total_count:table==='documents'?filter.includes('kind=invoice')?4:3:2}];}},
});
const client={query:async(sql,values)=>{assert.deepEqual(values,['tenant','one']);return {rows:sql.includes('count(*)')?[{count:'6'}]:[]};}},session={organizationId:'tenant',userId:'person',role:'owner'};
const data=await backend.customerWorkspace(client,session,'one','hub');assert.deepEqual(data.counts,{projects:2,offers:3,invoices:4,payments:2,contacts:2,files:6});
assert.ok(queries.filter(query=>query.table!=='customers').every(query=>query.filter.startsWith('customer_id=eq.one')&&query.filter.endsWith('limit=1')));
allowed.clear();queries=[];const restricted=await backend.customerWorkspace(client,session,'one','hub');assert.equal(restricted.counts.invoices,null);assert.equal(restricted.counts.files,null);assert.deepEqual(queries.map(query=>query.table),['customers','customer_contacts'],'Denied modules never run count queries');
foreign=true;await assert.rejects(()=>backend.customerWorkspace(client,session,'one','hub'),error=>error.status===404);
params=new URLSearchParams();const support=load('components/pages/support.tsx',{react,'next/navigation':routing});assert.equal(support.SupportTicketPage({ticketId:'one'}).type.name,'SupportTicketDetail');params=new URLSearchParams('view=conversation');assert.equal(support.SupportTicketPage({ticketId:'one'}).type.name,'SupportChat');
console.log('V7 actual owners: scoped/global list boundaries, safe return/reset, eight-row hub, real bounded counts, permission/foreign-tenant negatives, one-row semantics and support detail-before-chat passed.');

const filteredList='/projekte?customerId=customer-one&returnTo='+encodeURIComponent('/kunden/customer-one');
const projectReturn=safe.withAppReturnTo('/projekte/one',filteredList);
const relatedDocument=safe.withAppReturnTo('/rechnungen/one?returnTo=obsolete',projectReturn);
const parsedReturn=new URL(relatedDocument,'https://fixture.invalid');assert.deepEqual(parsedReturn.searchParams.getAll('returnTo'),[projectReturn]);assert.equal(new URL(projectReturn,'https://fixture.invalid').searchParams.get('returnTo'),filteredList);
assert.equal(new URL(safe.withAppReturnTo('/kunden/one','//foreign.invalid'),'https://fixture.invalid').searchParams.get('returnTo'),'/dashboard');
assert.equal(new URL(safe.withAppReturnTo('/kunden/one#context','/projekte'),'https://fixture.invalid').hash,'#context');
console.log('V7 nested return chains: customer-scoped list → project → related record, unique return parameter, fragment preservation and foreign-return denial passed.');
