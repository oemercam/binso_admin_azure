import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
function load(file,deps={}){
 const result={};
 Function('require','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText)(name=>{
  if(Object.hasOwn(deps,name))return deps[name];
  if(name==='react/jsx-runtime')return require(name);
  return {};
 },result);
 return result;
}
function hooks(){
 let position=0,ready=false;const cells=[],effects=[];
 const react={useState(initial){const index=position++;if(!(index in cells))cells[index]=typeof initial==='function'?initial():initial;return [cells[index],next=>{cells[index]=typeof next==='function'?next(cells[index]):next}];},useRef(value){return cells[position++]??=( {current:value});},useMemo(fn){return fn();},useCallback(fn){return fn;},useEffect(fn){effects.push(fn);},useSyncExternalStore(_subscribe,client,server){return ready?client():server();}};
 return {react,effects,hydrate(){ready=true;},render(fn){position=0;return fn();}};
}

const originalWindow=globalThis.window,originalDocument=globalThis.document,originalFetch=globalThis.fetch;
try{
 // Execute the actual list hook before running any effect. No storage or API
 // access is permitted during SSR; navigation restores validated state at once.
 const h=hooks(),store=new Map();let routePath='/kunden',routeSearch='';
 const navigation={usePathname:()=>routePath,useSearchParams:()=>new URLSearchParams(routeSearch)};
 const statusOverride=(search,chips)=>{const value=new URLSearchParams(search).get('status');return chips.includes(value)?value:undefined;};
 const {useRecordsController}=load('components/records.tsx',{react:h.react,'next/navigation':navigation,'@/lib/client/list-state':{listStateStore:store},'@/lib/list-filter':{listStatusOverride:statusOverride}});
 const options={placeholder:'Kunden suchen...',chips:['Alle','Aktiv'],columns:[{index:0},{index:2}]};
 globalThis.window=undefined;
 assert.equal(h.render(()=>useRecordsController(options)).restored,false,'SSR does not read window or display a default query');
 globalThis.window={location:{pathname:'/kunden',search:''}};
 store.set('binso.list:/kunden:Kunden suchen...',JSON.stringify({query:'Acme',activeChip:'Aktiv',sort:'desc',sortIndex:2,page:3}));
 h.hydrate();let list=h.render(()=>useRecordsController(options));
 assert.deepEqual([list.restored,list.query,list.activeChip,list.sort,list.sortIndex,list.page],[true,'Acme','Aktiv','desc',2,3],'The first client render needs no restoration effect/microtask');
 list.setQuery('New');list.setSort('asc');list=h.render(()=>useRecordsController(options));
 assert.deepEqual([list.query,list.sort,list.page],['New','asc',0],'Batched control changes preserve each other and reset pagination');
 list=h.render(()=>useRecordsController({...options,chips:['Alle']}));assert.equal(list.activeChip,'Alle','Removed permission-driven filters cannot survive');
 routePath='/produkte';window.location.pathname='/produkte';list=h.render(()=>useRecordsController(options));assert.equal(list.query,'','A different destination never displays the previous search');
 const broken=hooks(),brokenHook=load('components/records.tsx',{react:broken.react,'next/navigation':navigation,'@/lib/client/list-state':{listStateStore:store},'@/lib/list-filter':{listStatusOverride:()=>undefined}}).useRecordsController;
 store.set('binso.list:/produkte:Kunden suchen...',JSON.stringify({query:42,activeChip:'Forbidden',sort:'random',sortIndex:999,page:-1}));broken.hydrate();list=broken.render(()=>brokenHook(options));
 assert.deepEqual([list.query,list.activeChip,list.sort,list.sortIndex,list.page],['','Alle','default',0,0]);
 // Next may render the new page before committing the browser address. The old
 // window URL must neither choose the wrong saved filter nor receive its writes.
 const lagging=hooks(),laggingHook=load('components/records.tsx',{react:lagging.react,'next/navigation':navigation,'@/lib/client/list-state':{listStateStore:store},'@/lib/list-filter':{listStatusOverride:statusOverride}}).useRecordsController;
 const previousPage=store.get('binso.list:/produkte:Kunden suchen...');routePath='/kunden';lagging.hydrate();
 list=lagging.render(()=>laggingHook(options));assert.equal(list.query,'Acme','Router destination restores its own state while window.location still names the source page');
 lagging.effects.at(-1)();assert.equal(store.get('binso.list:/produkte:Kunden suchen...'),previousPage,'A destination effect cannot overwrite the previous page state');
 assert.equal(JSON.parse(store.get('binso.list:/kunden:Kunden suchen...')).activeChip,'Aktiv');
 routeSearch='status=Aktiv';const drilldown=hooks(),drilldownHook=load('components/records.tsx',{react:drilldown.react,'next/navigation':navigation,'@/lib/client/list-state':{listStateStore:store},'@/lib/list-filter':{listStatusOverride:statusOverride}}).useRecordsController;drilldown.hydrate();
 assert.equal(drilldown.render(()=>drilldownHook(options)).activeChip,'Aktiv','A destination drilldown uses router search parameters rather than the old browser query');

 // Production version detection uses real component/effect code, bounded public
 // metadata reads and an explicit action; not a forced controllerchange reload.
 let dirty=false,busy=false,openForm=false,reloads=0,checkTimer,clock=100000,fetches=0,visible='visible';
 const events=new Map(),windowEvents=new Map();
 globalThis.document={get visibilityState(){return visible;},querySelector:()=>openForm?{}:null,addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name)};
 globalThis.window={setTimeout:fn=>{checkTimer=fn;return 1;},clearTimeout(){},addEventListener:(name,fn)=>windowEvents.set(name,fn),removeEventListener:name=>windowEvents.delete(name),location:{reload:()=>reloads++}};
 const noticeHooks=hooks(),originalDateNow=Date.now;Date.now=()=>clock;
 const oldBuild=process.env.BINSO_BUILD_SHA,oldMode=process.env.NODE_ENV;
 process.env.BINSO_BUILD_SHA='a'.repeat(40);process.env.NODE_ENV='production';
 let serverSha='a'.repeat(40),ok=true;
 globalThis.fetch=async()=>{fetches++;return {ok,json:async()=>({status:'ok',sha:serverSha})};};
 try{
  const notice=load('components/pwa-version-notice.tsx',{react:noticeHooks.react,'@/lib/client/backend':{hasPendingClientMutation:()=>busy},'./use-browser-back-guard':{hasProtectedDraft:()=>dirty},'./ui':{Toast:()=>null}});
  assert.equal(noticeHooks.render(notice.PwaVersionNotice),null);const cleanup=noticeHooks.effects.shift()();
  const settle=async()=>{await Promise.resolve();await Promise.resolve();};
  checkTimer();await settle();assert.equal(fetches,1);assert.equal(noticeHooks.render(notice.PwaVersionNotice),null);
  windowEvents.get('focus')();await settle();assert.equal(fetches,1,'Duplicate focus/visibility signals share a 60s throttle');
  serverSha='b'.repeat(40);clock+=60001;visible='hidden';events.get('visibilitychange')();await settle();assert.equal(fetches,1);
  visible='visible';events.get('visibilitychange')();await settle();let tree=noticeHooks.render(notice.PwaVersionNotice);assert.equal(tree.props.title,'Neue Version verfügbar');assert.equal(reloads,0);
  for(const reason of ['dirty','busy','form']){dirty=reason==='dirty';busy=reason==='busy';openForm=reason==='form';tree.props.onAction();assert.equal(reloads,0,'An explicit update still protects '+reason);}
  dirty=busy=openForm=false;tree.props.onAction();assert.equal(reloads,1,'A clean workspace can explicitly load the deployed build');
  clock+=60001;ok=false;events.get('visibilitychange')();await settle();assert.ok(noticeHooks.render(notice.PwaVersionNotice),'An unsuccessful health request cannot invent a new version or dismiss a verified update');
  cleanup();assert.equal(events.size,0);assert.equal(windowEvents.size,0);
 }finally{Date.now=originalDateNow;if(oldBuild===undefined)delete process.env.BINSO_BUILD_SHA;else process.env.BINSO_BUILD_SHA=oldBuild;if(oldMode===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=oldMode;}

 // The write guard covers fetch, JSON parsing, validation, failures and uploads.
 let releaseBody;
 globalThis.fetch=async()=>({ok:true,status:200,json:()=>new Promise(resolve=>releaseBody=resolve)});
 const backend=load('lib/client/backend.ts',{'./data-events':{dataRevision:()=> 'session-a',publishMutation(){}},'./session-cache':{}});
 for(const [method,args] of [['apiPost',['/api/settings/company',{}]],['apiPatch',['/api/settings/company',{}]],['apiDelete',['/api/settings/company']],['apiUpload',['/api/files',new FormData()]]]){
  const pending=backend[method](...args);await new Promise(resolve=>setImmediate(resolve));assert.equal(backend.hasPendingClientMutation(),true,'Response bodies remain protected for '+method);releaseBody({ok:true,item:{id:'fixture'}});await pending;assert.equal(backend.hasPendingClientMutation(),false);
 }
 globalThis.fetch=async()=>{throw new Error('Offline');};await assert.rejects(()=>backend.apiPost('/api/settings/company',{}));assert.equal(backend.hasPendingClientMutation(),false,'A failed write always releases its guard');
 console.log('Actual PWA transition owners: pre-paint list restoration, malformed/forbidden state, safe explicit version switching, resume throttling and complete mutation lifecycle passed.');
}finally{globalThis.window=originalWindow;globalThis.document=originalDocument;globalThis.fetch=originalFetch;}

// Dashboard plan entitlement must execute on the existing authorized snapshot
// before any business repositories; no cross-request authorization cache.
let plan='pro',finance=true,reads=0,planCalls=0;
const client={query:async()=>({rows:[{customer_count:null,project_count:null,employee_count:null}]})};
const dashboard=load('app/api/dashboard/route.ts',{
 '@/lib/server/business-readiness':{canConfigureSetup:()=>false},
 '@/lib/server/repositories/finance':{cashStatisticsData:async()=>{reads++;return {}; }},
 '@/lib/permissions':{tenantCan:(_role,permission)=>finance||!permission.startsWith('accounting:')&&permission!=='payments:read'},
 '@/lib/server/repositories/dashboard':{dashboardAttention:async()=>{reads++;return [];},dashboardWork:async()=>({})},
 '@/lib/server/repositories/business-api':{listApiBusiness:async()=>[]},
 '@/lib/server/plan-access':{organizationPlanInTransaction:async(c,org)=>{assert.equal(c,client);assert.equal(org,'tenant');planCalls++;return plan;},assertModuleEntitlement:value=>{if(value==='denied')throw Error('Plan denied');}},
 '@/config/plan-access':{planAllowsModule:()=>false},'@/lib/server/rbac':{authorize(){}},
 '@/lib/server/session':{requireSession:async()=>({organizationId:'tenant',userId:'person',role:'owner'})},
 '@/lib/server/db':{withTenant:async(org,user,fn,options)=>{assert.deepEqual([org,user,options.snapshot],['tenant','person',true]);return fn(client);}},
 '@/lib/server/http':{json:value=>value,apiError:error=>{throw error;}}
});
assert.ok(await dashboard.GET());assert.equal(planCalls,1);assert.equal(reads,2);
plan='denied';reads=0;await assert.rejects(()=>dashboard.GET(),/Plan denied/);assert.equal(reads,0,'Entitlement denial precedes financial and domain reads');
plan='pro';finance=false;const restricted=await dashboard.GET();assert.equal(restricted.cash,null);assert.equal(restricted.canPayments,false);
console.log('Actual dashboard handler: one snapshot connection, unchanged plan denial before domain reads and restricted financial projection passed.');

// Exercise the actual persistent-layout registration, not a copied cache model.
const ast=ts.createSourceFile('shell.tsx',fs.readFileSync('components/app-shell.tsx','utf8'),99,true,ts.ScriptKind.TSX);
const layoutSource=ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='AppShellLayout').getText(ast);
const shellHooks=hooks(),React=require('react'),result={};let route='/kunden',identity='one';
const RecordsControls=()=>null,AppShellFrame=()=>null;
Function('require','exports','usePathname','useDataRevision','useState','useCallback','isValidElement','RecordsControls','appSections','settingsGroups','ShellRegistration','AppShellFrame',ts.transpileModule(layoutSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText)(require,result,()=>route,()=>identity,shellHooks.react.useState,shellHooks.react.useCallback,React.isValidElement,RecordsControls,{kunden:'Kunden',produkte:'Produkte'},[],{Provider:()=>null},AppShellFrame);
const renderShell=()=>shellHooks.render(()=>result.AppShellLayout({children:'current route'}));
let tree=renderShell();const customerTools=React.createElement(RecordsControls,{owner:'customers'});
tree.props.value({pathname:'/kunden',title:'Kunden',active:'kunden',actions:customerTools});tree=renderShell();assert.equal(tree.props.children.props.loading,undefined);
route='/produkte';tree=renderShell();assert.equal(tree.props.children.props.actions,undefined,'A new destination cannot borrow the previous toolbar');
tree.props.value({pathname:'/produkte',title:'Produkte',active:'produkte',actions:React.createElement(RecordsControls,{owner:'products'})});renderShell();
route='/kunden';tree=renderShell();assert.equal(tree.props.children.props.actions,customerTools);assert.equal(tree.props.children.props.loading,true,'The returning toolbar is only a pending placeholder, made inert by the actual frame');
identity='two';tree=renderShell();assert.equal(tree.props.children.props.actions,undefined,'No toolbar or private search can survive the session fence');
console.log('Actual persistent shell: destination-specific toolbar retention, pending interaction lock and session eviction passed.');
