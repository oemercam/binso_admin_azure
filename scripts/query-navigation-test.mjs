import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
const source=await fs.readFile('lib/client/use-api-query.ts','utf8');
const ast=ts.createSourceFile('query.ts',source,99,true);
const body=ast.statements.filter(node=>!ts.isImportDeclaration(node)).map(node=>node.getText(ast)).join('\n');
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const cache={};Function('exports',compile(await fs.readFile('lib/client/query-snapshot.ts','utf8')))(cache);
let state=[],effects=[],cursor=0,effectCursor=0,pending=[],requests=[],session='a',revision=0,clock=100;
const previousWindow=globalThis.window;
globalThis.window={setInterval(){return 1;},clearInterval(){}};
const exports={};
Function('exports','useState','useEffect','useRef','useSyncExternalStore','apiGet','dataRevision','subscribeClientData','clearQuerySnapshots','readQuerySnapshot','writeQuerySnapshot',compile(body))(
 exports,
 initial=>{const index=cursor++;if(!(index in state))state[index]=initial;return [state[index],value=>{state[index]=typeof value==='function'?value(state[index]):value;}];},
 (effect,deps)=>{const index=effectCursor++,old=effects[index];if(old&&deps.every((value,i)=>Object.is(value,old.deps[i])))return;old?.cleanup?.();effects[index]={deps,cleanup:null};pending.push(()=>{effects[index].cleanup=effect();});},
 initial=>{const index=cursor++;return state[index]??=({current:initial});},
 (_subscribe,snapshot)=>snapshot(),
 path=>new Promise((resolve,reject)=>requests.push({path,resolve,reject})),
 paths=>paths.length?session+':'+revision:session,()=>()=>{},
 cache.clearQuerySnapshots,
 (path,rev,owner,now,maxAge)=>cache.readQuerySnapshot(path,rev,owner,now??clock,maxAge),
 (path,rev,owner,data)=>cache.writeQuerySnapshot(path,rev,owner,data,clock),
);
const render=path=>{cursor=0;effectCursor=0;const result=exports.useApiQuery(path);pending.splice(0).forEach(effect=>effect());return result;};
const settle=async path=>{await Promise.resolve();await Promise.resolve();return render(path);};
try{
 assert.equal(render('/api/customers').loading,true);
 requests.shift().resolve({name:'Known customer'});
 assert.deepEqual((await settle('/api/customers')).data,{name:'Known customer'});
 render('/api/products');
 const before=requests.length;
 assert.deepEqual(render('/api/customers').data,{name:'Known customer'});
 await settle('/api/customers');
 assert.equal(requests.length,before,'Fresh return snapshots do not issue another request');
 render('/api/products');clock+=31000;
 const stale=render('/api/customers');
 assert.deepEqual(stale.data,{name:'Known customer'});
 assert.equal(stale.loading,false,'An expired freshness window does not flash empty content');
 assert.equal((await settle("/api/customers")).refreshing,true);
 const refresh=requests.at(-1);assert.equal(refresh.path,'/api/customers');
 revision++;const invalidated=render('/api/customers');
 assert.deepEqual(invalidated.data,{name:'Known customer'},'Mounted same-session content survives a pending background revision');
 refresh.resolve({name:'Obsolete result'});await settle('/api/customers');
 assert.deepEqual(render('/api/customers').data,{name:'Known customer'},'An obsolete response cannot replace confirmed content');
 assert.equal(render('/api/customers').refreshing,true,'The mounted view revalidates its mutation revision');
 render('/api/products');await settle('/api/products');
 assert.equal(render('/api/customers').data,undefined,'Navigation cannot reuse a cache snapshot from an invalidated revision');
 requests.at(-1).reject({status:403,message:'Access removed'});
 const denied=await settle('/api/customers');assert.equal(denied.data,undefined);assert.ok(denied.error);
 session='b';assert.equal(render('/api/customers').data,undefined,'A session transition cannot reuse another tenant response');
 // A previous manual/poll refresh must not permanently disable warm navigation.
 session='retry-session';revision=0;clock+=10;render('/api/customers');requests.at(-1).resolve({name:'Fresh before refresh'});await settle('/api/customers');
 render('/api/customers').refresh();render('/api/customers');requests.at(-1).resolve({name:'Refreshed customer'});await settle('/api/customers');
 render('/api/products');requests.at(-1).resolve({name:'Fresh product'});await settle('/api/products');
 const readsBefore=requests.length;assert.deepEqual(render('/api/customers').data,{name:'Refreshed customer'});await settle('/api/customers');
 assert.equal(requests.length,readsBefore,'A refresh on the previous visit cannot disable fresh return snapshots');
 render('/api/customers').refresh();render('/api/customers');assert.equal(requests.length,readsBefore+1,'A new explicit refresh still bypasses the fresh snapshot');
 // Intent preloading must obey the same revision/identity boundaries as hooks.
 const preload=exports.prefetchApiQuery('/api/dashboard');requests.at(-1).resolve({metric:1});await preload;
 assert.deepEqual(cache.readQuerySnapshot('/api/dashboard',session+':'+revision,session,clock),{metric:1});
 const warmRequests=requests.length;await exports.prefetchApiQuery('/api/dashboard');assert.equal(requests.length,warmRequests);
 const invalidatedPreload=exports.prefetchApiQuery('/api/projects');revision++;requests.at(-1).resolve({private:'obsolete'});await invalidatedPreload;
 assert.equal(cache.readQuerySnapshot('/api/projects',session+':'+revision,session,clock),undefined,'A preload cannot install data from before a mutation');
 const oldSessionPreload=exports.prefetchApiQuery('/api/employees');session='new-identity';requests.at(-1).resolve({private:'other person'});await oldSessionPreload;
 assert.equal(cache.readQuerySnapshot('/api/employees',session+':'+revision,session,clock),undefined,'A preloaded response cannot cross an identity boundary');
 console.log('Actual query hook: immediate returns, refresh, mutation/session fences, intent preloading and access-denial eviction passed.');
}finally{for(const effect of effects)effect.cleanup?.();globalThis.window=previousWindow;}
