import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const compile=(file,deps={})=>{
 const result={};
 Function('require','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText)(key=>Object.hasOwn(deps,key)?deps[key]:require(key),result);
 return result;
};
const {formSnapshot,formControlSnapshot}=compile('lib/client/form-snapshot.ts');
assert.equal(formSnapshot({name:'A\r\nB',nested:{b:2,a:1}}),formSnapshot({nested:{a:1,b:2},name:'A\nB'}));
assert.notEqual(formSnapshot({text:' A'}),formSnapshot({text:'A'}),'Meaningful whitespace remains an edit');
const a=new File(['receipt'],'receipt.pdf',{lastModified:1}),b=new File(['changed'],'receipt.pdf',{lastModified:1});
assert.equal(formSnapshot([a]),formSnapshot([a]));
assert.notEqual(formSnapshot([a]),formSnapshot([b]),'Same metadata cannot hide a replaced file');
assert.notEqual(formSnapshot({attachments:['a']}),formSnapshot({attachments:[]}),'Removing an attachment is an edit');
assert.notEqual(formSnapshot({lines:[{price:'1'}]}),formSnapshot({lines:[{price:'2'}]}));
const savedInput=globalThis.HTMLInputElement,savedSelect=globalThis.HTMLSelectElement;
try{
 globalThis.HTMLInputElement=class {constructor(type,value,owner){this.type=type;this.value=value;this.owner=owner;this.name='field';this.id='';}closest(){return this.owner;}};
 globalThis.HTMLSelectElement=class {};
 const parent={},child={},field=new HTMLInputElement('text','loaded',parent),nested=new HTMLInputElement('text','child',child),file=new HTMLInputElement('file','fakepath',parent);file.files=[a];
 const root={closest:()=>parent,querySelectorAll:()=>[field,nested,file]};
 const initial=formControlSnapshot(root);nested.value='opened child';assert.equal(formControlSnapshot(root),initial,'Nested dialog controls belong to their own baseline');
 file.files=[b];assert.notEqual(formControlSnapshot(root),initial);
 file.files=[a];assert.equal(formControlSnapshot(root),initial,'Restoring the original file clears dirty state');
}finally{globalThis.HTMLInputElement=savedInput;globalThis.HTMLSelectElement=savedSelect;}

/** Exercise the actual hook/component functions through state/effect transitions. */
function hooks(){
 let hydrated=false;
 let position=0;const cells=[],effects=[];
 const react={Fragment:Symbol('Fragment'),useState(initial){const index=position++;if(!(index in cells))cells[index]=typeof initial==='function'?initial():initial;return [cells[index],next=>{cells[index]=typeof next==='function'?next(cells[index]):next}];},useRef(value){const index=position++;return cells[index]??=({current:value});},useEffect(callback,deps){const index=position++,previous=cells[index];if(!previous||!deps||deps.some((value,i)=>!Object.is(value,previous[i]))){cells[index]=deps;effects.push(callback);}}};
 react.useMemo=callback=>callback();react.useCallback=callback=>callback;react.useSyncExternalStore=(_subscribe,client,server)=>hydrated?client():server();
 return {react,hydrate(){hydrated=true;},render(fn){position=0;return fn();},async flush(){for(const effect of effects.splice(0))effect();await new Promise(resolve=>queueMicrotask(resolve));}};
}
let session,boundaryPath="/dashboard";const boundaryRedirects=[],boundaryRouter={replace:path=>boundaryRedirects.push(path)};
const boundaryHooks=hooks(),{SessionDataBoundary}=compile('components/session-data-boundary.tsx',{react:boundaryHooks.react,'next/navigation':{usePathname:()=>boundaryPath,useRouter:()=>boundaryRouter},'./ui':{ErrorState:()=>null},'@/lib/client/use-api-query':{useApiQuery:()=>({data:session})}});
const page={type:'private-page'};
const startupHooks=hooks(),realElements=require('react');
const {WorkspaceStartup}=compile('components/workspace-startup.tsx',{react:{...startupHooks.react,cloneElement:realElements.cloneElement},'./app-start':{AppStart:()=>null}});
const shellElement=realElements.createElement('div',{className:'app-root',key:'persistent-shell'},'existing page');
const startup=(identityReady,contentReady)=>startupHooks.render(()=>WorkspaceStartup({identityReady,contentReady,children:shellElement}));
assert.equal(startup(false,false).props.children[1].props.hidden,true,'Private shell stays hidden before identity');
assert.equal(startup(true,false).props.children[1].props.hidden,true,'Known identity cannot reveal an empty first dashboard while profile/data are pending');
const readyShell=startup(true,true).props.children[1];assert.equal(readyShell.props.hidden,false,'The first complete page is revealed immediately, without a timeout');assert.equal(readyShell.key,shellElement.key);await startupHooks.flush();
assert.equal(startup(true,false).props.children[1].props.hidden,false,'Later navigation and background refresh retain the mounted shell');
assert.equal(startup(false,false).props.children[1].props.hidden,true,'Losing identity always hides the private workspace');await startupHooks.flush();
assert.equal(startup(true,false).props.children[1].props.hidden,true,'A new authenticated start waits for its own content');
assert.equal(startup(true,true).props.children[1].props.children,'existing page','Content and drafts remain mounted instead of being cloned into a different owner');
let greetingProfile=null;
const greetingHooks=hooks(),greetingRules=compile('lib/dashboard-greeting.ts');
const {useDashboardGreeting}=compile('lib/client/user-profile.tsx',{react:{...greetingHooks.react,createContext:()=>({}),useContext:()=>greetingProfile},'@/lib/dashboard-greeting':greetingRules,'./locale':{useTranslation:()=>value=>value}});
assert.equal(greetingHooks.render(useDashboardGreeting),'','SSR never guesses a private greeting');greetingHooks.hydrate();
assert.equal(greetingHooks.render(useDashboardGreeting),'','An unknown profile never becomes an anonymous placeholder');
greetingProfile={first_name:'Stored',timezone:'Europe/Zurich'};
assert.match(greetingHooks.render(useDashboardGreeting),/^Guten (Morgen|Tag|Abend), Stored$/,'A warm client visit has the real greeting before any effect, not an empty heading');
greetingProfile={first_name:'Stored',timezone:'Pacific/Honolulu'};
assert.equal(greetingHooks.render(useDashboardGreeting),greetingRules.greetingPeriod(new Date(),'Pacific/Honolulu')+', Stored','A loaded profile zone applies in the same render');
assert.equal(boundaryHooks.render(()=>SessionDataBoundary({children:page})),null,'Initial identity must not mount then remount a page');
session={authenticated:true,user:{id:'one'},tenant:{id:'tenant'}};
const first=boundaryHooks.render(()=>SessionDataBoundary({children:page}));await boundaryHooks.flush();
assert.equal(boundaryHooks.render(()=>SessionDataBoundary({children:page})).key,first.key);
session={...session,tenant:{...session.tenant,role:'admin'}};
assert.equal(boundaryHooks.render(()=>SessionDataBoundary({children:page})).key,first.key,'Same-person permission refresh preserves draft identity');
session={...session,user:{id:'two'}};
assert.notEqual(boundaryHooks.render(()=>SessionDataBoundary({children:page})).key,first.key,'A new person resets private page state');

const verifiedSession=session;session=undefined;assert.equal(boundaryHooks.render(()=>SessionDataBoundary({children:page})),null,'An invalidated identity cannot retain the previous private subtree');session={authenticated:false};assert.equal(boundaryHooks.render(()=>SessionDataBoundary({children:page})),null,'A signed-out response cannot mount private pages or their reads');session=verifiedSession;
session={...session,security:{enrollmentRequired:true}};
assert.equal(boundaryHooks.render(()=>SessionDataBoundary({children:page})),null,'Mandatory enrollment never mounts a private business page');await boundaryHooks.flush();assert.equal(boundaryRedirects.at(-1),'/einstellungen/sicherheit?next=%2Fdashboard');
boundaryPath='/einstellungen/sicherheit';assert.ok(boundaryHooks.render(()=>SessionDataBoundary({children:page})),'Existing security setup remains accessible');
session={...session,security:{enrollmentRequired:false}};boundaryPath='/dashboard';assert.ok(boundaryHooks.render(()=>SessionDataBoundary({children:page})),'Enrolled session can resume without a new sign-in');

const storage=new Map([['binso.statistics:finance',JSON.stringify({months:6,from:'',to:''})]]),savedStorage=globalThis.sessionStorage;
try{
 globalThis.sessionStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};
 const periodHooks=hooks(),{useStatisticPeriod}=compile('lib/client/statistic-period.ts',{react:periodHooks.react,'@/lib/financial-status':{businessDate:()=> '2026-10-24'},'@/lib/statistics-period':{statisticBounds:value=>[1,3,6,12].includes(value.months)?{}:null}});
 assert.equal(periodHooks.render(()=>useStatisticPeriod('finance'))[2],false);
 periodHooks.hydrate();const restored=periodHooks.render(()=>useStatisticPeriod('finance'));assert.equal(restored[0].months,6,'The first client render restores the saved period before painting any KPI');assert.equal(restored[2],true);await periodHooks.flush();
 assert.equal(JSON.parse(storage.get('binso.statistics:finance')).months,6,'Default period cannot overwrite the stored selection during startup');
 assert.equal(periodHooks.render(()=>useStatisticPeriod('other'))[2],true,'A client-side evaluation change restores before its first paint');
 await periodHooks.flush();assert.equal(periodHooks.render(()=>useStatisticPeriod('other'))[0].months,1);
 restored[1](previous=>({...previous,months:3}));assert.equal(periodHooks.render(()=>useStatisticPeriod('finance'))[0].months,3,'Functional updates keep the current evaluation');await periodHooks.flush();
 assert.equal(JSON.parse(storage.get('binso.statistics:finance')).months,3);
 storage.set('binso.statistics:invalid','{"months":99}');assert.equal(periodHooks.render(()=>useStatisticPeriod('invalid'))[0].months,1,'Invalid persisted bounds never reach KPI calculations');
 storage.set('binso.statistics:legacy','12');assert.equal(periodHooks.render(()=>useStatisticPeriod('legacy'))[0].months,12,'Legacy numeric selections remain supported');
 const realReact=await import('react'),{renderToStaticMarkup}=await import('react-dom/server');let serverReads=0;
 globalThis.sessionStorage={getItem(){serverReads++;throw Error('No server storage')},setItem(){throw Error('No server storage')}};
 const serverHook=compile('lib/client/statistic-period.ts',{react:realReact,'@/lib/financial-status':{businessDate:()=> '2026-10-24'},'@/lib/statistics-period':{statisticBounds:()=>({})}});
 function ServerPeriod(){const [value,,ready]=serverHook.useStatisticPeriod('finance');return realReact.createElement('span',{'data-ready':ready},value.months);}
 assert.equal(renderToStaticMarkup(realReact.createElement(ServerPeriod)),'<span data-ready="false">1</span>','Server and hydration keep the unresolved initial surface');assert.equal(serverReads,0,'SSR never reads browser storage');
}finally{globalThis.sessionStorage=savedStorage;}

const verified={organizationId:'tenant-one',userId:'person-one'};let authCalls=0,profileSession;
const profile=compile('app/api/settings/profile/route.ts',{'next/server':{},'@/lib/server/http':{json:value=>value,apiError:error=>{throw error}},'@/lib/server/auth':{requireUser:async()=>{authCalls++;return {user:{email:'fixture@example.invalid'},session:verified}}},'@/lib/server/database':{currentProfile:async session=>{profileSession=session;return {first_name:'Fixture'}}}});
assert.equal((await profile.GET()).item.first_name,'Fixture');assert.equal(authCalls,1);assert.equal(profileSession,verified,'Only the already verified request session is reused');

// Evaluate the consolidated count query against real PostgreSQL semantics.
const {PGlite}=await import('@electric-sql/pglite');const db=new PGlite();
try{
 await db.exec("create table customers(organization_id text,archived_at text);create table projects(organization_id text,archived_at text,status text);create table employees(organization_id text,archived_at text,active boolean);insert into customers values('a',null),('a','archived'),('b',null);insert into projects values('a',null,'active'),('a',null,'in_progress'),('a',null,'closed'),('b',null,'active');insert into employees values('a',null,true),('a',null,false),('b',null,true)");
 const source=fs.readFileSync('app/api/dashboard/route.ts','utf8'),sql=source.match(/const counts=[\s\S]*?\(\x60([\s\S]*?)\x60,/)[1];
 assert.deepEqual((await db.query(sql,['a',true,true,true])).rows[0],{customer_count:1,project_count:2,employee_count:1});
 assert.deepEqual((await db.query(sql,['a',false,false,false])).rows[0],{customer_count:null,project_count:null,employee_count:null});
 assert.deepEqual((await db.query(sql,['empty',true,true,true])).rows[0],{customer_count:0,project_count:0,employee_count:0});
}finally{await db.close();}
console.log('Global UX/startup: normalized dirty values/files/nested forms, stable first identity, restored period readiness, verified profile session reuse, and tenant-scoped PostgreSQL counts passed.');
