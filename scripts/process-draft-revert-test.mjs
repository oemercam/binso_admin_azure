import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {moduleUrl} from './data-test-modules.mjs';
const draftsUrl=moduleUrl(await fs.readFile('lib/client/process-draft.ts','utf8')),drafts=await import(draftsUrl);
const reactUrl=moduleUrl(`const h=()=>globalThis.__draftHookHarness;export const useState=v=>h().state(v);export const useRef=v=>h().ref(v);export const useCallback=(fn,deps)=>h().memo(fn,deps);export const useEffect=(fn,deps)=>h().effect(fn,deps);`);
const sessionUrl=moduleUrl('export const readClientSession=()=>globalThis.__draftHookHarness.identity();');
const revisionUrl=moduleUrl('export const useDataRevision=()=>globalThis.__draftHookHarness.revision;');
let source=await fs.readFile('components/use-process-draft.ts','utf8');
for(const [name,url] of Object.entries({'react':reactUrl,'@/lib/client/session-cache':sessionUrl,'@/lib/client/process-draft':draftsUrl,'@/lib/client/use-api-query':revisionUrl}))source=source.replaceAll("'"+name+"'",JSON.stringify(url));
const {useProcessDraft:renderDraftHook}=await import(moduleUrl(source));
const owner={authenticated:true,user:{id:'draft-user'},tenant:{id:'draft-tenant',role:'owner',readOnly:false}};
const key=drafts.draftScope('draft-user','draft-tenant','owner','company:setup');
const beforeWindow=globalThis.window;
function harness(identity=()=>Promise.resolve(owner)){
 const entries=new Map(),events=new EventTarget();
 const storage={get length(){return entries.size},key:i=>[...entries.keys()][i]??null,getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,value),removeItem:key=>entries.delete(key)};
 globalThis.window={sessionStorage:storage,addEventListener:events.addEventListener.bind(events),removeEventListener:events.removeEventListener.bind(events)};
 const h={cells:[],cursor:0,effects:[],pending:true,value:{street:''},dirty:false,revision:'identity-one',restores:0,identity};
 const same=(a,b)=>a&&b&&a.length===b.length&&a.every((value,i)=>Object.is(value,b[i]));
 h.state=initial=>{const index=h.cursor++;const cell=h.cells[index]??=( {value:typeof initial==='function'?initial():initial});return [cell.value,next=>{const value=typeof next==='function'?next(cell.value):next;if(!Object.is(value,cell.value)){cell.value=value;h.pending=true}}]};
 h.ref=initial=>{const index=h.cursor++;return h.cells[index]??=({current:initial})};
 h.memo=(callback,deps)=>{const index=h.cursor++,old=h.cells[index];if(old&&same(old.deps,deps))return old.callback;h.cells[index]={callback,deps};return callback};
 h.effect=(callback,deps)=>{const index=h.cursor++,old=h.cells[index];if(old&&same(old.deps,deps))return;const cell={deps,cleanup:old?.cleanup};h.cells[index]=cell;h.effects.push(()=>{cell.cleanup?.();cell.cleanup=callback()})};
 h.flush=async()=>{for(let turn=0;turn<20;turn++){if(h.pending){h.pending=false;h.cursor=0;h.api=renderDraftHook({process:'company:setup',value:h.value,dirty:h.dirty,enabled:true,onRestore:value=>{h.restores++;h.value=value;h.dirty=value.street!=='';h.pending=true}})}for(const effect of h.effects.splice(0))effect();await Promise.resolve();if(!h.pending&&!h.effects.length)return;}throw Error('Hook fixture failed to settle')};
 h.change=async(value,dirty)=>{h.value=value;h.dirty=dirty;h.pending=true;await h.flush()};
 h.unmount=()=>{for(const cell of h.cells)cell?.cleanup?.()};
 h.storage=storage;globalThis.__draftHookHarness=h;return h;
}
try{
 const h=harness();drafts.writeProcessDraft(h.storage,key,{street:'Recovered before hydration'});await h.flush();assert.equal(h.restores,1);assert.equal(h.value.street,'Recovered before hydration','Initial pristine hydration cannot delete a recoverable draft');
 await h.change({street:''},false);assert.equal(drafts.readProcessDraft(h.storage,key),null,'A genuine revert removes the previous dirty snapshot');
 await h.change({street:'A later edit'},true);assert.deepEqual(drafts.readProcessDraft(h.storage,key),{street:'A later edit'},'Reverting does not disable later recovery writes');
 h.api.clear();await h.change({street:'Stale pending render'},true);assert.equal(drafts.readProcessDraft(h.storage,key),null,'A confirmed completion/discard cannot recreate the old draft');h.unmount();
 let resolveIdentity;const late=harness(()=>new Promise(resolve=>{resolveIdentity=resolve}));drafts.writeProcessDraft(late.storage,key,{street:'Older stored input'});await late.flush();await late.change({street:'New input before identity resolved'},true);resolveIdentity(owner);await late.flush();assert.equal(late.restores,0);assert.equal(late.value.street,'New input before identity resolved');assert.deepEqual(drafts.readProcessDraft(late.storage,key),late.value,'Late identity cannot overwrite current input');late.unmount();
 for(const identity of [{authenticated:false},{...owner,tenant:{...owner.tenant,readOnly:true}},{...owner,tenant:{...owner.tenant,role:'reader'}}]){const denied=harness(()=>Promise.resolve(identity));drafts.writeProcessDraft(denied.storage,key,{street:'Owner private input'});await denied.flush();assert.equal(denied.restores,0,'Unauthenticated/read-only/other-role context cannot restore an owner draft');denied.unmount();}
 const fenced=harness();await fenced.flush();await fenced.change({street:'Owned draft'},true);fenced.revision='identity-two';fenced.pending=true;await fenced.flush();await fenced.change({street:'Late obsolete form input'},true);assert.deepEqual(drafts.readProcessDraft(fenced.storage,key),{street:'Owned draft'},'A private-session fence stops late writes from the obsolete editor');fenced.unmount();
}finally{if(beforeWindow===undefined)delete globalThis.window;else globalThis.window=beforeWindow;delete globalThis.__draftHookHarness;}
console.log('Actual draft hook: initial recovery, genuine revert/no resurrection, later edits, confirmed clear, late identity input, role/read-only denial and session-fenced writes passed.');
