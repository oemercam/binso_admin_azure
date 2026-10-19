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
Function('exports','useState','useEffect','useSyncExternalStore','apiGet','dataRevision','subscribeClientData','clearQuerySnapshots','readQuerySnapshot','writeQuerySnapshot',compile(body))(
 exports,
 initial=>{const index=cursor++;if(!(index in state))state[index]=initial;return [state[index],value=>{state[index]=typeof value==='function'?value(state[index]):value;}];},
 (effect,deps)=>{const index=effectCursor++,old=effects[index];if(old&&deps.every((value,i)=>Object.is(value,old.deps[i])))return;old?.cleanup?.();effects[index]={deps,cleanup:null};pending.push(()=>{effects[index].cleanup=effect();});},
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
 assert.equal(invalidated.data,undefined,'Mutation revisions cannot reuse mounted or navigation data');
 refresh.resolve({name:'Obsolete result'});await settle('/api/customers');
 assert.equal(render('/api/customers').data,undefined,'An obsolete response cannot refill the new revision');
 requests.at(-1).reject({status:403,message:'Access removed'});
 const denied=await settle('/api/customers');assert.equal(denied.data,undefined);assert.ok(denied.error);
 session='b';assert.equal(render('/api/customers').data,undefined,'A session transition cannot reuse another tenant response');
 console.log('Actual query hook: immediate fresh/stale returns, background refresh, mutation/session fences, stale responses and access-denial eviction passed.');
}finally{for(const effect of effects)effect.cleanup?.();globalThis.window=previousWindow;}
