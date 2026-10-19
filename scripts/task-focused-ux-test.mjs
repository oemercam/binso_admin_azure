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

const {pageOrientation}=await import(moduleUrl(await fs.readFile('lib/page-orientation.ts','utf8')));
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
