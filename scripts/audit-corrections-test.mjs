import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const stub=()=>null;
const fallback=new Proxy({__esModule:true,default:stub},{get:(target,key)=>target[key]??stub});
const compile=(file,deps={})=>{
 const result={};
 Function('require','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText)(key=>Object.hasOwn(deps,key)?deps[key]:key==='react/jsx-runtime'?require(key):fallback,result);
 return result;
};
const react={useState:initial=>[typeof initial==='function'?initial():initial,()=>{}],useRef:value=>({current:value}),useEffect:()=>{},useLayoutEffect:()=>{},useId:()=>':audit:'};
const {safeAppPath}=compile('lib/navigation.ts');
let params=new URLSearchParams(),destination;
const {CustomerForm}=compile('components/pages/customers.tsx',{
 react,'next/navigation':{useSearchParams:()=>params,useRouter:()=>({push:value=>{destination=value}})},
 '@/lib/navigation':{safeAppPath},'../use-dirty-snapshot':{useDirtySnapshot:()=>({dirty:false,markPristine:()=>{}})},
 '../use-process-draft':{useProcessDraft:()=>({ready:true,clear:()=>{}})},
 '@/lib/client/use-api-query':{useApiQuery:()=>({loading:false,data:undefined,error:null})}
});
for(const [id,query,expected] of [
 ['customer-one','returnTo='+encodeURIComponent('/kunden/customer-one?tab=activity'),'/kunden/customer-one?tab=activity'],
 ['customer-one','','/kunden/customer-one'],
 ['customer-one','returnTo='+encodeURIComponent('https://outside.invalid/'),'/kunden/customer-one'],
 [undefined,'','/kunden'],
 [undefined,'returnTo=%2Fdashboard','/dashboard']
]){
 params=new URLSearchParams(query);destination=undefined;
 const tree=CustomerForm({customerId:id});
 tree.props.children[0].props.onClose();
 assert.equal(destination,expected,'The actual customer editor returns to its safe caller');
}
const declaration=(file,name)=>{
 const ast=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let found;
 const visit=node=>{if(ts.isVariableDeclaration(node)&&node.name.getText(ast)===name&&!found)found=node.getText(ast);ts.forEachChild(node,visit)};visit(ast);
 assert.ok(found,'Actual declaration exists: '+name);return found;
};
const docReturn=declaration('components/documents.tsx','returnTo');
for(const [query,expected] of [['returnTo=%2Fkunden%2Fc1%3Ftab%3Ddocuments','/kunden/c1?tab=documents'],['','/angebote'],['returnTo=%2F%2Fevil.invalid','/angebote']]){
 const actual=Function('searchParams','safeAppPath','plural','existing',`return (${docReturn.slice(docReturn.indexOf('=')+1)})`)(new URLSearchParams(query),safeAppPath,'angebote',true);
 assert.equal(actual,expected,'Existing documents retain safe context as well as new documents');
}
const resetSource=ts.transpileModule('const '+declaration('components/pages/time.tsx','resetContext')+'; export {resetContext};',{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const resets={},searchParams=new URLSearchParams('projectId=p1&customerId=c1&manual=1&q=analysis&from=2026-10-01&to=2026-10-25&status=submitted');
Function('searchParams','router','exports',resetSource)(searchParams,{replace:value=>{destination=value}},resets);
resets.resetContext('projectId');
const resetParams=new URL(destination,'https://fixture.invalid').searchParams;
assert.equal(resetParams.has('projectId'),false);assert.equal(resetParams.get('customerId'),'c1');assert.equal(resetParams.get('q'),'analysis');assert.equal(resetParams.get('from'),'2026-10-01');assert.equal(resetParams.get('status'),'submitted');assert.equal(resetParams.get('tab'),'entries');assert.equal(resetParams.has('manual'),false);
{
 const file='components/documents.tsx',ast=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),99,true,ts.ScriptKind.TSX);let handoff;
 const visit=node=>{if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(ast)==='Button'&&node.getText(ast).includes('recovery.persist')&&node.getText(ast).includes('setupDestination'))handoff=node.getText(ast);ts.forEachChild(node,visit)};visit(ast);
 assert.ok(handoff,'Draft recovery uses an explicit action, not a link intercepted before its onClick');
 const {setupDestination}=compile('lib/action-readiness.ts',{'./navigation':{safeAppPath}}),calls=[],exports={};
 const code=ts.transpileModule('export function ActualSetupAction(){return '+handoff+';}',{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const savedDraft={positions:[{description:'Keep input'}]};
 Function('require','exports','Button','LocalizedText','recovery','dirty','draft','wizardStep','draftReplay','allowDraftNavigation','router','setupDestination','paymentRequirement','plural','searchParams',code)(require,exports,stub,stub,{ready:true,persist:value=>calls.push(['persist',value])},true,savedDraft,2,null,()=>calls.push(['allow']),{push:url=>calls.push(['navigate',url])},setupDestination,{field:'iban'},'rechnungen',new URLSearchParams('customerId=c1'));
 exports.ActualSetupAction().props.onClick();
 assert.deepEqual(calls.map(call=>call[0]),['persist','allow','navigate'],'Input is secured before releasing the guard and navigating');
 assert.deepEqual(calls[0][1],{draft:savedDraft,step:2,replay:null});
 assert.equal(new URL(calls[2][1],'https://fixture.invalid').searchParams.get('returnTo'),'/rechnungen/neu?customerId=c1');
}
{
 let cursor=0,recoveryArgs;const cells=[],effects=[];
 const settingsHooks={useState:initial=>{const i=cursor++;if(!(i in cells))cells[i]=initial;return [cells[i],value=>{cells[i]=value}]},useRef:value=>{const i=cursor++;return cells[i]??=({current:value})},useEffect:effect=>effects.push(effect)};
 const loadedItem={vat_rate:'8.10',payment_terms_days:30,invoice_intro_text:'Existing company text'};
 const {DocumentSettingsPage}=compile('components/document-settings.tsx',{
  react:settingsHooks,'next/navigation':{useRouter:()=>({push:()=>{}})},'@/lib/client/page-access':{usePageAccess:()=>({write:true})},
  '@/lib/client/use-api-query':{useApiQuery:()=>({loading:false,error:null,data:{item:loadedItem}})},
  './use-setup-field':{useSetupField:(...args)=>{recoveryArgs=args;return {field:'iban',returnTo:'/rechnungen/neu'}}},
  '@/config/domain':{domainConfig:{vatRates:[0,2.6,8.1]}}
 });
 const render=()=>{cursor=0;return DocumentSettingsPage()};
 render();assert.equal(recoveryArgs[1],false,'A query response alone cannot open the editor before its normalized values commit');
 for(const effect of effects.splice(0))effect();await new Promise(resolve=>queueMicrotask(resolve));
 render();assert.equal(recoveryArgs[1],true);recoveryArgs[3]();
 const editing=render();assert.equal(editing.props.unsavedChanges,false,'Auto-opening loaded values never creates a false dirty guard');
}

let result={items:[],total:0},loading=false,error=null;
const {DirectorySelect}=compile('components/directory-select.tsx',{
 react,'@/lib/client/page-access':{usePageAccess:()=>({write:true})},
 '@/lib/client/use-api-query':{useDataRevision:()=>'session-a',useApiQuery:()=>({data:result,loading,error})},
 '@/lib/directory-query':{directoryQuery:value=>value}
});
const selection=()=>DirectorySelect({endpoint:'/api/documents?payment_candidates=1',value:'',label:'Rechnung',onChange:()=>{},emptyResultLabel:'Keine ausgestellte Rechnung verfügbar',emptyHref:'/rechnungen',emptyAction:'Rechnungen öffnen'}).props.search;
assert.deepEqual(selection().empty,{message:'Keine ausgestellte Rechnung verfügbar',href:'/rechnungen',action:'Rechnungen öffnen'});
loading=true;assert.equal(selection().empty,undefined,'Pending is not an empty result');loading=false;
error='offline';assert.equal(selection().empty,undefined,'A request failure is not an empty result');error=null;
result={items:[{id:'issued-one',number:'RE-1'}],total:1};assert.equal(selection().empty,undefined);
const {SelectSearchPagination}=compile('components/select-control.tsx',{react});
assert.equal(SelectSearchPagination({search:{page:0,hasNext:false},onPage:()=>{}}),null,'A single/empty page has no paging controls');
assert.ok(SelectSearchPagination({search:{page:0,hasNext:true},onPage:()=>{}}));
assert.ok(SelectSearchPagination({search:{page:1,hasNext:false},onPage:()=>{}}),'The last page still permits returning');
const pendingPages=SelectSearchPagination({search:{page:1,hasNext:true,loading:true},onPage:()=>{throw Error('Unexpected page mutation')}});
assert.equal(pendingPages.props.children.length,2);
assert.ok(pendingPages.props.children.every(button=>button.props.disabled===true),'Actual previous/next controls remain locked while a populated directory loads');

const display=compile('lib/display-format.ts');
for(const [minutes,expected] of [[0,'0:00 h'],[0.01,'< 1 Min.'],[0.99,'< 1 Min.'],[1,'0:01 h'],[60,'1:00 h'],[1500,'25:00 h'],[-1,'—'],[NaN,'—']])assert.equal(display.formatTimeDuration(minutes),expected);
assert.equal(display.formatTimeDuration(0.5,()=>'< 1 min'),'< 1 min');
assert.equal(display.timeMetadata('Arbeitszeit','Arbeitszeit','Person','25.10.2026'),'Person · 25.10.2026');

const {customerActivity}=compile('lib/server/repositories/customer-activity.ts',{'@/lib/display-format':display,'@/lib/permissions':{tenantCan:()=>true,ownRecordOnly:()=>false}});
let sql,bindings;
const activity=await customerActivity({query:async(text,values)=>{sql=text;bindings=values;return {rows:[{title:'Angebot versendet',detail:'AN-1 · Version 2',at:'2026-10-24'},{title:'Angebot versendet',detail:'AN-legacy',at:'2026-10-23'}]}}},{organizationId:'org-one',userId:'user-one'},'customer-one');
assert.equal(activity[0].version,2);assert.equal(activity[0].documentNumber,'AN-1');
assert.equal(activity[0].href,'/angebote/AN-1?historyVersion=2&returnTo=%2Fkunden%2Fcustomer-one%3Ftab%3Dactivity');
assert.equal(activity[1].href,undefined,'Never invent a version for old deliveries');
assert.equal(activity[1].version,undefined);
assert.ok(sql.includes('v.organization_id=x.organization_id and v.quote_id=d.id'),'Version association remains tenant/document bound');
assert.deepEqual(bindings,['org-one','customer-one']);
console.log('Audit corrections: real editor return callbacks, remote empty/error/loading states, paging, duration display and historical version links passed.');

// Internal returns keep the shell/FAB while heading and data resolve together.
let dashboardLoading=true,dashboardGreeting='Guten Tag, Fixture';
const {DashboardPage}=compile('components/pages/dashboard.tsx',{
 '@/lib/client/user-profile':{useDashboardGreeting:()=>dashboardGreeting},
 '@/lib/client/locale':{useTranslation:()=>value=>value,LocalizedText:stub},
 '@/lib/client/use-api-query':{useApiQuery:()=>({loading:dashboardLoading,data:{}})},
});
for(const state of [[true,'Guten Tag, Fixture'],[false,'']]){
 [dashboardLoading,dashboardGreeting]=state;
 const page=DashboardPage();assert.equal(page.props.loading,true);assert.equal(page.props.title,'');assert.equal(page.props.subtitle,undefined);assert.ok(page.props.actions,'Create action remains mounted');
}
dashboardLoading=false;dashboardGreeting='Guten Tag, Fixture';
assert.equal(DashboardPage().props.title,dashboardGreeting);

// The historical preview must be a sibling of the collapsible history body.
const {OfferHistory}=compile('components/offer-history.tsx',{
 react,'next/navigation':{useSearchParams:()=>new URLSearchParams('historyVersion=1')},
 '@/lib/client/locale':{useLocale:()=>({locale:'de'}),useTranslation:()=>value=>value},
 '@/lib/client/use-api-query':{useApiQuery:()=>({loading:false,data:{versions:[{version:1,created_at:'2026-10-24'}],deliveries:[],events:[]}})},
});
const historyView=OfferHistory({number:'AN-1',canWrite:false});
assert.ok(Array.isArray(historyView.props.children),'Historical preview is outside the collapsed disclosure');
assert.equal(historyView.props.children[1].props.fileUrl,'/api/documents/AN-1/versions?version=1');

// Guided setup uses the actual canonical validator and real component handlers.
const qr=compile('lib/qr-bill.ts',{'swissqrbill/utils':require('swissqrbill/utils')});
const readiness=compile('lib/setup-readiness.ts',{'./qr-bill':qr,'./navigation':{safeAppPath}});
const original={name:'Fixture Company',street:'',building_number:'',postal_code:'',city:'',country_code:'CH',iban:'',qr_iban:'',vat_rate:0,payment_terms_days:0,invoice_intro_text:'Keep authored text'};
assert.equal(readiness.requiredSetupTasks(original).filter(task=>task.complete).length,1);
assert.equal(readiness.setupStepIssues({...original,street:'Testweg'},'address')[0].field,'postalCode');
assert.equal(readiness.requiredSetupTasks({...original,street:'Testweg',postal_code:'8000',city:'Zürich'}).filter(task=>task.complete).length,2);
assert.ok(readiness.setupProcessDestination('bank','https://evil.invalid').includes('returnTo=%2Fdashboard'));
const walk=node=>Array.isArray(node)?node.flatMap(walk):node&&typeof node==='object'&&node.props?[node,...walk(node.props.children)]:[];
const oldDocument=globalThis.document;globalThis.document={getElementById:()=>({focus(){}})};
try{
 for(const scenario of ['partial','address','invalid-bank','bank','bank-read-error','bank-stale-address','logo-return','clean-exit','dirty-exit']){
  let cursor=0;const cells=[],calls=[],routes=[];
  const hooks={useState:initial=>{const i=cursor++;if(!(i in cells))cells[i]=typeof initial==='function'?initial():initial;return [cells[i],next=>{cells[i]=typeof next==='function'?next(cells[i]):next}]},useRef:value=>{const i=cursor++;return cells[i]??=({current:value})},useEffect:()=>{}};
  const bank=scenario.includes('bank'),base={...original,...(bank?{street:'Testweg',postal_code:'8000',city:'Zürich'}:{})};
  const params=new URLSearchParams('setupStep='+(bank?'bank':'address'));if(scenario==='logo-return')params.set('returnTo','/rechnungen/neu?customerId=c1');
  const {SetupProcess}=compile('components/setup-process.tsx',{
   react:hooks,'next/navigation':{useSearchParams:()=>params,useRouter:()=>({push:path=>routes.push(path),replace:path=>routes.push(path)})},
   '@/lib/client/use-api-query':{useApiQuery:()=>({loading:false,data:{item:base},refresh(){}})},
   '@/lib/client/page-access':{usePageAccess:()=>({write:true})},'@/lib/client/locale':{useTranslation:()=>value=>value},
   '@/lib/navigation':{safeAppPath},'@/lib/setup-readiness':readiness,'@/lib/action-readiness':compile('lib/action-readiness.ts',{'./navigation':{safeAppPath}}),
   '@/config/domain':{domainConfig:{vatRates:[0,8.1]}},'./use-browser-back-guard':{allowDraftNavigation(){},useBrowserBackGuard:()=>()=>{}},
   '@/lib/client/backend':{apiGet:async()=>{if(scenario==='bank-read-error')throw Error('Reload failed');return {item:{...base,iban:'CH9300762011623852957',...(scenario==='bank-stale-address'?{street:''}:{})}}},apiPatch:async(path,payload)=>{calls.push({path,payload});return {item:{...base,...(bank?{iban:payload.iban}:{name:payload.name,street:payload.street,postal_code:payload.postalCode,city:payload.city})}}}},
  });
  const render=()=>{cursor=0;return SetupProcess()};
  let tree=render();assert.equal(tree.props.orientationText,null,'Guided steps omit the unrelated generic settings description');
  if(scenario==='logo-return'){const href=walk(tree).find(node=>node.props.title==='Firmenlogo').props.href;const back=new URL(href,'https://fixture.invalid').searchParams.get('returnTo');assert.equal(new URL(back,'https://fixture.invalid').searchParams.get('returnTo'),'/rechnungen/neu?customerId=c1');continue;}
  const input=(id,value)=>{const node=walk(tree).find(node=>node.props.id===id);assert.ok(node,id);node.props.onChange({target:{value}});tree=render()};
  if(scenario==='clean-exit'||scenario==='dirty-exit'){
   if(scenario==='dirty-exit')input('setup-street','Changed');
   walk(tree).find(node=>node.props.children==='Später fortsetzen').props.onClick();tree=render();
   assert.equal(routes.length,scenario==='clean-exit'?1:0);
   if(scenario==='dirty-exit')assert.ok(walk(tree).some(node=>node.props.open===true&&node.props.title==='Änderungen verwerfen?'));
   continue;
  }
  if(bank)input('setup-iban',scenario==='invalid-bank'?'CH123':'CH9300762011623852957');
  else{input('setup-street','Testweg');if(scenario==='address'){input('setup-postal-code','8000');input('setup-city','Zürich')}}
  const submit=walk(tree).find(node=>node.type==='form').props.onSubmit;await Promise.all([submit({preventDefault(){}}),submit({preventDefault(){}})]);tree=render();
  if(scenario==='invalid-bank'){assert.equal(calls.length,0,'Invalid IBAN never opens fresh authentication');assert.equal(routes.length,0);continue;}
  assert.equal(calls.length,1);
  if(scenario==='partial'){assert.equal(routes.length,0,'Partial address remains in its area');assert.ok(walk(tree).some(node=>Array.isArray(node.props.children)&&node.props.children.some(child=>child?.props?.children==='Teilstand gespeichert. Für Rechnungen fehlen noch gültige Pflichtangaben.')))}
  if(scenario==='address')assert.ok(routes[0].includes('setupStep=bank'));
  if(scenario==='bank-read-error'){assert.equal(routes.length,0);assert.equal(tree.props.title,'Zahlungskonto');assert.ok(walk(tree).some(node=>node.props.children==='Reload failed'));}
  if(scenario==='bank-stale-address'){assert.ok(routes[0].includes('setupStep=address'));assert.notEqual(tree.props.title,'Rechnungsangaben vollständig');}
  if(scenario==='bank'){
   assert.equal(calls[0].path,'/api/settings/documents');assert.equal(calls[0].payload.vatRate,0);assert.equal(calls[0].payload.paymentTermsDays,0);assert.equal(calls[0].payload.invoiceIntroText,'Keep authored text');
   assert.equal(tree.props.title,'Rechnungsangaben vollständig','Completion is shown only after confirmed persistence');
  }
 }
}finally{globalThis.document=oldDocument;}
console.log('Guided setup: canonical area readiness, partial/complete saves, safe return, actual clean/dirty exit, invalid-bank preflight and confirmed completion passed; no security bypass.');

// Optional setup content starts collapsed even on desktop and remains operable.
{
 let current=false;const effects=[];
 const {DetailDisclosure}=compile('components/binso-ux.tsx',{react:{...react,useState:initial=>[current??initial,next=>{current=next}],useLayoutEffect:effect=>effects.push(effect)}});
 let disclosure=DetailDisclosure({label:'Optional ergänzen',defaultOpen:false,children:'Fields'});
 effects.forEach(effect=>effect());assert.equal(disclosure.props.open,false);
 disclosure.props.onToggle({currentTarget:{open:true}});
 disclosure=DetailDisclosure({label:'Optional ergänzen',defaultOpen:false,children:'Fields'});assert.equal(disclosure.props.open,true);
 disclosure.props.onToggle({currentTarget:{open:false}});assert.equal(current,false);
}

// The persistent layout must receive route-level orientation overrides.
{
 const file='components/app-shell.tsx',ast=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),99,true,4);
 const node=ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='AppShell');
 const exported={};let registered;
 const code=ts.transpileModule(node.getText(ast),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const actualReact=require('react'),recordsControls=()=>null;
 Function('require','exports','useContext','usePathname','useLayoutEffect','ShellRegistration','Children','isValidElement','RecordsControls',code)(require,exported,()=>configuration=>{registered=configuration},()=>'/einstellungen/firma',effect=>effect(),{},actualReact.Children,actualReact.isValidElement,recordsControls);
 exported.AppShell({title:'Firma',active:'einstellungen',orientationText:null,children:'Body'});
 assert.equal(registered.orientationText,null,'The mounted shared shell respects the guided step description');
 const controls=actualReact.createElement(recordsControls,{controller:'Actual controller'},actualReact.createElement('a',{href:'/kunden/neu'},'Neuer Kunde'));
 const body=actualReact.createElement('section',null,'Customer rows');
 const rendered=exported.AppShell({title:'Kunden',active:'kunden',children:[controls,body]});
 assert.equal(registered.actions,controls,'Inline list controls reach the persistent command bar with their creation action');
 assert.equal(walk(rendered).filter(node=>node.type===recordsControls).length,0,'Transferred controls do not render twice in page content');
 assert.equal(walk(rendered).filter(node=>node.type==='section').length,1,'The actual list body remains in the route');
 const explicit=actualReact.createElement('button',null,'Explicit action');
 const explicitBody=exported.AppShell({title:'Details',active:'kunden',actions:explicit,children:[controls,body]});
 assert.equal(registered.actions,explicit,'Explicit detail actions retain ownership');
 assert.equal(walk(explicitBody).filter(node=>node.type===recordsControls).length,1,'Nested controls stay in detail content when the header already has actions');
}
