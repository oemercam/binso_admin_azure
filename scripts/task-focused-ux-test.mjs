import {planAccessModuleUrl} from './data-test-modules.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const cache=await import(moduleUrl(await fs.readFile('lib/client/query-snapshot.ts','utf8')));
cache.writeQuerySnapshot('/api/customers','r1','tenant-a',{items:['a']},100);
assert.deepEqual(cache.readQuerySnapshot('/api/customers','r1','tenant-a',30099),{items:['a']});
assert.equal(cache.readQuerySnapshot('/api/customers','r1','tenant-a',30100),undefined,'Expired data is not reused');
cache.writeQuerySnapshot('/api/customers','r1','tenant-a',{items:['a']},100);
assert.equal(cache.readQuerySnapshot('/api/customers','r2','tenant-a',101),undefined,'A domain mutation invalidates the navigation snapshot');
cache.writeQuerySnapshot('/api/customers','r2','tenant-a',{items:['private']},100);
assert.equal(cache.readQuerySnapshot('/api/customers','r2','tenant-b',101),undefined,'A different session cannot reuse tenant data');
assert.equal(cache.readQuerySnapshot('/api/customers','r2','tenant-a',101),undefined,'Changing session also removes the old values');
for(let i=0;i<61;i++)cache.writeQuerySnapshot('/api/customers/'+i,'r','tenant-a',i,100);
assert.equal(cache.readQuerySnapshot('/api/customers/0','r','tenant-a',101),undefined,'Memory is bounded');
assert.equal(cache.readQuerySnapshot('/api/customers/60','r','tenant-a',101),60);
cache.clearQuerySnapshots();assert.equal(cache.readQuerySnapshot('/api/customers/60','r','tenant-a',101),undefined);

const readFunction=async(file,names)=>{const source=await fs.readFile(file,'utf8'),ast=ts.createSourceFile(file,source,99,true);return ast.statements.filter(node=>ts.isFunctionDeclaration(node)&&names.includes(node.name?.text)).map(node=>node.getText(ast)).join('\n')};
const customerSource=await readFunction('lib/server/repositories/customers.ts',['customerInput']);
const exports={};class ApiError extends Error{constructor(status,code,message){super(message);this.status=status;this.code=code;}}
Function('exports','ApiError',ts.transpileModule(customerSource,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(exports,ApiError);
const input=exports.customerInput({name:' Test AG ',contactFirstName:' Ada ',contactLastName:' Example '});assert.equal(input.contact,'Ada Example');
for(const body of [{name:'Test AG'},{name:'Test AG',contactFirstName:'Ada'},{name:'Test AG',contactFirstName:' ',contactLastName:'Example'}])assert.throws(()=>exports.customerInput(body),error=>error.code==='contact_required');
assert.throws(()=>exports.customerInput({name:'Test AG',contactFirstName:'a'.repeat(121),contactLastName:'Example'}),error=>error.code==='invalid_field');
assert.deepEqual(exports.customerInput({city:'Bern'},true),{city:'Bern'},'Legacy customer edits do not require invented contact data');
assert.throws(()=>exports.customerInput({contact:''},true),error=>error.code==='contact_required');
let contacts=[{id:'first',is_primary:true}],writes=[],audits=0;
const archive={};
const withTenant=async(org,user,fn)=>{assert.equal(org,'tenant-a');assert.equal(user,'actor');return fn({query:async(sql,params)=>{
 if(sql.startsWith('select id from customers'))return {rowCount:1,rows:[{id:'customer'}]};
 if(sql.startsWith('select id,is_primary'))return {rows:contacts};
 writes.push({sql,params});return {rowCount:1,rows:[{id:'first'}]};
}})};
Function('exports','withTenant','ApiError','audit',ts.transpileModule(await readFunction('lib/server/repositories/contacts.ts',['archiveCustomerContact']),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(archive,withTenant,ApiError,async()=>{audits++});
await assert.rejects(()=>archive.archiveCustomerContact({organizationId:'tenant-a',userId:'actor'},'customer','first'),error=>error.code==='contact_required');assert.equal(writes.length,0,'Last-contact rejection cannot archive or promote anything');
contacts=[{id:'first',is_primary:true},{id:'second',is_primary:false}];
await archive.archiveCustomerContact({organizationId:'tenant-a',userId:'actor'},'customer','first');assert.equal(writes.length,2);assert.ok(writes[1].sql.includes('is_primary=true'));assert.deepEqual(writes[1].params,['tenant-a','second']);assert.equal(audits,1);
writes=[];await assert.rejects(()=>archive.archiveCustomerContact({organizationId:'tenant-a',userId:'actor'},'customer','unknown'),error=>error.status===404);assert.equal(writes.length,0);
const {activityDays}=await import(moduleUrl(await readFunction('lib/display-format.ts',['messageDay','activityDays'])));
const activity=[{at:'2026-03-28T22:30:00Z',id:1},{at:'2026-03-29T00:30:00Z',id:2},{at:'2026-03-28T23:30:00Z',id:3}];
assert.deepEqual(activityDays(activity).map(group=>[group.day,group.events.map(item=>item.id)]),[['29.03.2026',[2,3]],['28.03.2026',[1]]]);assert.deepEqual(activity.map(item=>item.id),[1,2,3],'Grouping does not mutate the source');

const previous={document:globalThis.document,window:globalThis.window,Node:globalThis.Node,scrollX:globalThis.scrollX,scrollY:globalThis.scrollY};
class TestNode extends EventTarget{constructor(parent=null){super();this.parent=parent;}contains(node){return node===this||!!node?.parent&&this.contains(node.parent);}}
try{
 const document=new TestNode(),root=new TestNode(),child=new TestNode(root),nested=new TestNode(),nestedChild=new TestNode(nested);let restored=0;
 document.body={style:{overflow:'visible'}};document.documentElement={style:{overflow:'auto'}};
 Object.assign(globalThis,{document,Node:TestNode,scrollX:10,scrollY:240,window:{scrollTo(x,y){assert.deepEqual([x,y],[10,240]);restored++;}}});
 const {lockPageScroll}=await import(moduleUrl(await fs.readFile('components/page-scroll-lock.ts','utf8')));
 const wheel=target=>{const event=new Event('wheel',{cancelable:true});Object.defineProperty(event,'target',{value:target});document.dispatchEvent(event);return event.defaultPrevented;};
 const first=lockPageScroll(()=>root);assert.equal(wheel(child),false);assert.equal(wheel(document),true);
 const second=lockPageScroll(()=>nested);assert.equal(wheel(child),true);assert.equal(wheel(nestedChild),false);second();assert.equal(document.documentElement.style.overflow,'hidden');assert.equal(wheel(child),false);
 first();first();assert.equal(restored,1);assert.equal(document.body.style.overflow,'visible');assert.equal(document.documentElement.style.overflow,'auto');assert.equal(wheel(document),false);
}finally{Object.assign(globalThis,previous);}
console.log('Navigation cache TTL/domain/session/bounds, required contact validation, legacy edit safety, Swiss activity groups and nested background scroll locks passed.');

const orientationPermissions=moduleUrl(await fs.readFile('lib/permissions.ts','utf8')),orientationPlans=planAccessModuleUrl;
const {pageOrientation}=await import(moduleUrl((await fs.readFile('lib/page-orientation.ts','utf8')).replace("'./permissions'",JSON.stringify(orientationPermissions)).replace("'@/config/plan-access'",JSON.stringify(orientationPlans))));
for(const route of ['/dashboard','/kunden','/zeit','/finanzen','/finanzen/analyse','/einstellungen','/einstellungen/konto']){assert.equal(typeof pageOrientation(route),'string');assert.equal(pageOrientation(route,true),undefined,'Editing keeps its usable space');}
for(const route of ['/kunden/neu','/kunden/id','/kunden/id/bearbeiten','/support/id','/rechnungen/neu','/login','constructor'])assert.equal(pageOrientation(route),undefined,'No generic caption on records, chats, forms or unknown routes');
console.log('Exact page orientation routes and compact edit/detail/chat exclusions passed.');

// Execute the production lifecycle observer with deferred authoritative reads.
{
 const previous={document:globalThis.document,window:globalThis.window};
 const document=new EventTarget(),window=new EventTarget();document.visibilityState='visible';Object.assign(globalThis,{document,window});
 const settle=()=>new Promise(resolve=>setImmediate(resolve));let requests=0,pending=[],notices=[];
 try{
  const {watchTimerResume}=await import(moduleUrl(await readFunction('components/timer-resume-notice.tsx',['watchTimerResume'])));
  const stop=watchTimerResume(()=>{requests++;return new Promise((resolve,reject)=>pending.push({resolve,reject}))},running=>notices.push(running));
  assert.equal(requests,1);assert.deepEqual(notices,[],'No guessed running state before the server replies');
  window.dispatchEvent(new Event('pageshow'));assert.equal(requests,1,'Initial pageshow does not duplicate the read');
  pending.shift().resolve({running:true});await settle();assert.deepEqual(notices,[true]);
  window.dispatchEvent(new Event('pageshow'));assert.equal(requests,1,'Dismissal lasts for the current foreground visit');
  document.visibilityState='hidden';document.dispatchEvent(new Event('visibilitychange'));assert.equal(notices.at(-1),false);
  document.visibilityState='visible';document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('pageshow'));assert.equal(requests,2);
  pending.shift().resolve({running:false});await settle();assert.equal(notices.at(-1),false,'Paused/stopped timers never produce a reminder');
  document.visibilityState='hidden';document.dispatchEvent(new Event('visibilitychange'));document.visibilityState='visible';document.dispatchEvent(new Event('visibilitychange'));
  pending.shift().reject(new Error('offline'));await settle();assert.equal(notices.at(-1),false,'Network failures never invent running time');
  document.visibilityState='hidden';document.dispatchEvent(new Event('visibilitychange'));document.visibilityState='visible';document.dispatchEvent(new Event('visibilitychange'));
  document.visibilityState='hidden';document.dispatchEvent(new Event('visibilitychange'));document.visibilityState='visible';document.dispatchEvent(new Event('visibilitychange'));
  const count=notices.length;pending.shift().resolve({running:true});await settle();assert.equal(notices.length,count,'A reply from a previous visit is ignored');assert.equal(requests,5,'A pending old reply is followed by one fresh read');
  window.dispatchEvent(new Event('binso-timer-change'));pending.shift().resolve({running:true});await settle();assert.equal(notices.at(-1),false,'Timer changes invalidate an in-flight reminder');
  stop();document.visibilityState='hidden';document.dispatchEvent(new Event('visibilitychange'));document.visibilityState='visible';document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('pageshow'));assert.equal(requests,5,'Unmount removes every lifecycle listener');
 }finally{Object.assign(globalThis,previous);}
 console.log('Timer resume: authoritative state, one check per visit, paused/offline negatives, stale replies, timer changes and listener cleanup passed.');
}

const defaults=await import(moduleUrl((await fs.readFile('lib/document-defaults.ts','utf8')).replace('@/config/domain',moduleUrl(await fs.readFile('config/domain.ts','utf8')))));
assert.deepEqual(defaults.documentDefaults({payment_terms_days:45,vat_rate:0,invoice_intro_text:'Company'},undefined,'Rechnung'),{due:'45',vatRate:'0',note:'Company'});
assert.equal(defaults.documentDefaults({payment_terms_days:45},{paymentDays:10},'Rechnung').due,'10','Customer terms take precedence over company terms');
assert.equal(defaults.documentDefaults({payment_terms_days:45},{paymentDays:0},'Rechnung').due,'0','Immediate payment is not replaced with a truthy fallback');
assert.deepEqual(defaults.documentDefaults({payment_terms_days:-1,vat_rate:NaN},undefined,'Rechnung'),{due:'30',vatRate:'8.1',note:''});
assert.equal(defaults.documentDefaults({invoice_intro_text:'Invoice',quote_intro_text:'Offer'},undefined,'Angebot').note,'Offer');
cache.writeQuerySnapshot('/api/customers','r1','tenant-a',{items:['return']},100);
assert.equal(cache.readQuerySnapshot('/api/customers','r1','tenant-a',30100),undefined);
assert.deepEqual(cache.readQuerySnapshot('/api/customers','r1','tenant-a',30100,300000),{items:['return']},'A same-revision return can show its memory snapshot while refreshing');
assert.equal(cache.readQuerySnapshot('/api/customers','r2','tenant-a',30101,300000),undefined,'Extended return reuse cannot cross a mutation revision');
cache.writeQuerySnapshot('/api/customers','r1','tenant-a',{items:['return']},100);
assert.equal(cache.readQuerySnapshot('/api/customers','r1','tenant-a',300100,300000),undefined,'Extended navigation memory is bounded in time');
console.log('Company/customer draft defaults, explicit zeroes, invalid values and session/revision-fenced stale navigation passed.');

{
 class Element{constructor(name,children=[]){this.name=name;this.children=children;this.inert=false;}contains(target){return this===target||this.children.some(child=>child.contains(target));}}
 const app=new Element('app'),dialogA=new Element('a'),layerA=new Element('layer-a',[dialogA]),dialogB=new Element('b'),layerB=new Element('layer-b',[dialogB]);
 const script=new Element('script');script.tagName='SCRIPT';const style=new Element('style');style.tagName='STYLE';
 const doc={body:{children:[app,layerA,script,style]}};
 const body=ts.transpileModule(await readFunction('components/use-dialog-focus.ts',['lockDialogBackground']),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const lock=Function('backgroundLocks','document','HTMLElement',body+';return lockDialogBackground;')(new Map(),doc,Element);
 const releaseA=lock(dialogA);assert.equal(script.inert,false,'Executable SSR metadata is never mutated by the accessibility lock');assert.equal(style.inert,false,'Styles are not focusable background');assert.equal(app.inert,true);assert.equal(layerA.inert,false);doc.body.children.push(layerB);const releaseB=lock(dialogB);assert.equal(layerA.inert,true);releaseA();assert.equal(app.inert,true,'Closing a parent cannot expose the page under its child');releaseB();assert.equal(app.inert,false);assert.equal(layerA.inert,false);
 app.inert=true;const release=lock(dialogA);release();assert.equal(app.inert,true,'Pre-existing inert state is retained');
 console.log('Modal background ownership: nested dialogs, out-of-order close and pre-existing inert state passed.');
}

assert.equal(defaults.documentDefaults({},undefined,'Angebot','2026-10-19').due,'2026-11-18','Offer validity uses the existing central policy');
assert.equal(defaults.documentDefaults({},undefined,'Angebot','2026-02-30').due,'','Invalid dates are never normalized into fabricated validity');

assert.equal(exports.customerInput({name:'Supplied organization',customerType:'person',contactFirstName:'Ada',contactLastName:'Example'}).name,'Ada Example','Private customers use their own identity, not a hidden company name');
for(const customerType of ['unknown',[],['person'],{},false])assert.throws(()=>exports.customerInput({name:'Test AG',customerType,contactFirstName:'Ada',contactLastName:'Example'}),error=>error.code==='invalid_customer_type');
assert.equal(exports.customerInput({name:'Legacy API',contactFirstName:'Ada',contactLastName:'Example'}).customerType,'company','Existing API callers retain company creation semantics');

const {sameCustomerCreation}=await import(moduleUrl(await fs.readFile('lib/customer-replay.ts','utf8')));
const oldCustomerBody=JSON.stringify({name:'Test AG',allowDuplicate:true,contactFirstName:'Ada',contactLastName:'Example'});
assert.equal(sameCustomerCreation(oldCustomerBody,JSON.stringify({name:'Test AG',customerType:'company',allowDuplicate:true,contactFirstName:'Ada',contactLastName:'Example'})),true,'A recovered pre-V25 request keeps its old key; the server can reject conflicts instead of creating another customer');
for(const next of [{name:'Changed',customerType:'company'},{name:'Test AG',customerType:'person'},null,[]])assert.equal(sameCustomerCreation(oldCustomerBody,JSON.stringify(next)),false);
assert.equal(sameCustomerCreation('invalid',oldCustomerBody),false);
assert.equal(sameCustomerCreation(oldCustomerBody,oldCustomerBody),true);

assert.equal(sameCustomerCreation(oldCustomerBody,JSON.stringify({customerType:"company",contactLastName:"Example",contactFirstName:"Ada",allowDuplicate:true,name:"Test AG"})),true,"Object field order cannot manufacture a new request key");

// Shared remote selection encodes scope/search and never increases the API limit.
const directory=await import(moduleUrl(await fs.readFile('lib/directory-query.ts','utf8')));
const directoryPath=new URL(directory.directoryQuery('/api/customers',{query:'Kunde & Co',page:21,id:'chosen'}),'https://fixture.invalid');
assert.equal(directoryPath.searchParams.get('limit'),'50');assert.equal(directoryPath.searchParams.get('offset'),'1050');assert.equal(directoryPath.searchParams.get('q'),'Kunde & Co');assert.equal(directoryPath.searchParams.get('id'),'eq.chosen');
assert.equal(new URL(directory.directoryQuery('/api/projects',{customerId:'tenant-customer'}),'https://fixture.invalid').searchParams.get('customerId'),'tenant-customer');
console.log('Remote selection: encoded search, stable paging beyond 1000 and exact selected/context IDs passed.');

const acceptedOffer={id:'offer-id',number:'AN-1',date:'2026-01-01',status:'accepted',positions:[{description:'Agreed work',price:125}],note:'Negotiated text',customerId:'customer'};
for(const days of [0,10,45]){
 const converted=defaults.invoiceDraftFromOffer(acceptedOffer,{number:'',date:'2026-10-20'},{payment_terms_days:45},{paymentDays:days});
 assert.equal(converted.due,String(days));assert.deepEqual(converted.positions,acceptedOffer.positions);assert.equal(converted.note,'Negotiated text');assert.equal(converted.id,undefined);assert.equal(converted.status,'draft');assert.equal(converted.number,'');assert.equal(converted.date,'2026-10-20');
}
assert.equal(defaults.invoiceDraftFromOffer(acceptedOffer,{number:'',date:'2026-10-20'},{payment_terms_days:45},undefined).due,'45');
assert.equal(acceptedOffer.status,'accepted','Conversion never mutates the issued offer');
console.log('Offer conversion: central zero/customer/company terms, negotiated content, new identity and immutable source passed.');

assert.match(pageOrientation('/dashboard',false,'member'),/Deine Arbeitszeit/);
assert.match(pageOrientation('/dashboard',false,'project_manager'),/Freigaben/);
assert.match(pageOrientation('/kunden',false,'reader'),/finden/);
assert.match(pageOrientation('/einstellungen/abonnement',false,'admin'),/ansehen/);
assert.match(pageOrientation('/einstellungen/abonnement',false,'owner'),/verwalten/);
assert.equal(pageOrientation('/kunden/one',false,'reader'),undefined,'Record details keep their own context');

const listQueries=await import(moduleUrl(await fs.readFile('lib/business-list-query.ts','utf8')));
const publicQuery=listQueries.businessListQuery('documents',new URLSearchParams({customer_id:'eq.customer-a',id:'eq.invoice-a',display_status:'open',untrusted:'ignore'}));
assert.equal(publicQuery.get('customer_id'),'eq.customer-a');assert.equal(publicQuery.get('id'),'eq.invoice-a');assert.equal(publicQuery.get('display_status'),'eq.open');assert.equal(publicQuery.has('untrusted'),false);
const independentPayment=listQueries.businessListQuery('documents',new URLSearchParams({payment_status:'partial',due_status:'eq.overdue',payment_candidates:'1'}));assert.equal(independentPayment.get('payment_status'),'eq.partial');assert.equal(independentPayment.get('due_status'),'eq.overdue');assert.equal(independentPayment.get('payment_candidates'),'1');
assert.equal(listQueries.businessListQuery('customers',new URLSearchParams({payment_status:'partial',payment_candidates:'1'})).has('payment_status'),false,'Invoice-only filters cannot leak into other directories');
assert.equal(listQueries.businessListQuery('expenses',new URLSearchParams({employee_id:'attacker',review:'1'}),'created_at.desc',{employee_id:'route-owned'}).get('employee_id'),'eq.route-owned','Route-owned scope overrides query input');
assert.equal(listQueries.businessListQuery('customers',new URLSearchParams({id:'eq.saved-customer'})).get('id'),'eq.saved-customer','A selected ID survives a reload beyond the loaded page');

const timeFilters=await import(moduleUrl(await fs.readFile('lib/time-entry-filter.ts','utf8')));
const timePage=timeFilters.timeEntryQuery({query:'Ada & Co',from:'2026-01-01',to:'2026-10-20',status:'Zur Prüfung',customerId:'customer',projectId:'order'},{page:22,employeeId:'employee',review:true});
assert.equal(timePage.get('offset'),'1100');assert.equal(timePage.get('limit'),'50');assert.equal(timePage.get('status'),'submitted');assert.equal(timePage.get('q'),'Ada & Co');assert.equal(timePage.get('customerId'),'customer');assert.equal(timePage.get('projectId'),'order');assert.equal(timePage.get('employeeId'),'employee');assert.equal(timePage.get('review'),'1');assert.equal(timePage.get('own'),null);
const ownTime=timeFilters.timeEntryQuery({query:'',from:'2026-10-20',to:'2026-10-20',status:'Alle'},{own:true,internal:true,projectLabel:'Weiterbildung'});
assert.equal(ownTime.get('own'),'1');assert.equal(ownTime.get('internal'),'1');assert.equal(ownTime.get('projectLabel'),'Weiterbildung');assert.equal(ownTime.get('review'),null);
console.log('Time history query: bounded pages, full context, encoded search and separate own/review modes passed.');