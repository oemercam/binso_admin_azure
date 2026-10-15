import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {moduleUrl} from './data-test-modules.mjs';
const drafts=await import(moduleUrl(await fs.readFile('lib/client/process-draft.ts','utf8')));
const entries=new Map(),storage={get length(){return entries.size},key:i=>[...entries.keys()][i]??null,getItem:k=>entries.get(k)??null,setItem:(k,v)=>entries.set(k,v),removeItem:k=>entries.delete(k)};
const key=drafts.draftScope('user-a','tenant-a','owner','invoice');
const value={draft:{note:'Unfinished invoice'},step:2,replay:{key:'same-key',body:'same-payload'}};
assert.equal(drafts.writeProcessDraft(storage,key,value,1000),true);
assert.deepEqual(drafts.readProcessDraft(storage,key,2000),value,'Interruption preserves the input, step AND financial replay identity');
for(const scope of [['user-b','tenant-a','owner'],['user-a','tenant-b','owner'],['user-a','tenant-a','reader']])assert.equal(drafts.readProcessDraft(storage,drafts.draftScope(...scope,'invoice'),2000),null,'User, tenant and role isolation');
assert.equal(drafts.readProcessDraft(storage,key,1000+24*60*60*1000+1),null,'Expired draft cannot resume');assert.equal(storage.getItem(key),null);
storage.setItem(key,'broken JSON');assert.equal(drafts.readProcessDraft(storage,key),null);
drafts.writeProcessDraft(storage,key,value,1000);assert.equal(drafts.readProcessDraft(storage,key,999),null,'Future-dated stale input rejected');
assert.equal(drafts.writeProcessDraft({...storage,setItem(){throw Error('quota')}},key,value),false,'Storage failure cannot turn a save into fictional success');
drafts.writeProcessDraft(storage,key,value);storage.setItem('unrelated-preference','light');
globalThis.window={sessionStorage:storage};drafts.clearProcessDrafts();assert.equal(storage.getItem(key),null);assert.equal(storage.getItem('unrelated-preference'),'light');delete globalThis.window;
const events=await fs.readFile('lib/client/data-events.ts','utf8');assert.match(events,/resetClientData[^\n]*clearProcessDrafts\(\)/,'Every local and remote session fence clears drafts');
console.log('Process recovery: editable input/step/replay retained; user/tenant/role isolation, expiry, corruption, quota handling and session-fence purge passed.');

const channel=globalThis.BroadcastChannel;globalThis.BroadcastChannel=undefined;
const callbacks=new Map();globalThis.window={sessionStorage:storage,addEventListener(){}};globalThis.document={visibilityState:'visible',addEventListener:(name,callback)=>callbacks.set(name,callback)};
try{
 const draftModule=moduleUrl(await fs.readFile('lib/client/process-draft.ts','utf8')),listModule=moduleUrl(await fs.readFile('lib/client/list-state.ts','utf8'));
 const eventModule=await import(moduleUrl(events.replace("'./process-draft'",JSON.stringify(draftModule)).replace("'./list-state'",JSON.stringify(listModule))));
 eventModule.subscribeClientData(()=>{});const identityBefore=eventModule.dataRevision(['/api/auth/session']),sessionBefore=eventModule.dataRevision([]);
 drafts.writeProcessDraft(storage,key,value);callbacks.get('visibilitychange')();
 assert.notEqual(eventModule.dataRevision(['/api/auth/session']),identityBefore,'Returning to the app revalidates identity queries');assert.equal(eventModule.dataRevision([]),sessionBefore,'Routine revalidation is not a session fence');assert.deepEqual(drafts.readProcessDraft(storage,key),value,'Routine revalidation retains editable input');
 eventModule.resetClientData(false);assert.notEqual(eventModule.dataRevision([]),sessionBefore);assert.equal(storage.getItem(key),null,'An actual identity/tenant/role fence still clears private drafts');
 console.log('Draft ownership: app visibility revalidates queries without changing the private-session fence; actual session changes purge input.');
}finally{globalThis.BroadcastChannel=channel;delete globalThis.window;delete globalThis.document}
