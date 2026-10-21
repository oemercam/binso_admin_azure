/** Editable, unsaved input only. Never persist API responses or credentials. */
const PREFIX='binso.process-draft.v1:';
const MAX_AGE=24*60*60*1000;
type StorageLike=Pick<Storage,'getItem'|'setItem'|'removeItem'|'key'|'length'>;
/** Presentation language is not a new financial operation. All source/customer/
 * return parameters remain part of the scope; other process formats stay intact. */
export function canonicalDraftProcess(process:string){
 const split=process.indexOf(':');if(split<0||!['Angebot','Rechnung'].includes(process.slice(0,split)))return process;
 const query=new URLSearchParams(process.slice(split+1));query.delete('lang');query.sort();
 return process.slice(0,split)+':'+query.toString();
}
export function draftScope(userId:string,tenantId:string,role:string,process:string){
 return PREFIX+JSON.stringify([userId,tenantId,role,canonicalDraftProcess(process)]);
}
function canonicalScopeKey(key:string){
 try{if(!key.startsWith(PREFIX))return key;const scope=JSON.parse(key.slice(PREFIX.length));return Array.isArray(scope)&&scope.length===4&&scope.every(value=>typeof value==='string')?draftScope(scope[0],scope[1],scope[2],scope[3]):key;}catch{return key;}
}
function aliases(storage:StorageLike,key:string){
 const result=new Set([key]);for(let i=0;i<storage.length;i++){const candidate=storage.key(i);if(candidate?.startsWith(PREFIX)&&canonicalScopeKey(candidate)===key)result.add(candidate);}return [...result];
}
export function readProcessDraft<T>(storage:StorageLike,key:string,now=Date.now()):T|null{
 try{
  key=canonicalScopeKey(key);let newest:{raw:string;at:number;value:T;key:string}|null=null;
  const candidates=aliases(storage,key);
  for(const candidate of candidates){
   const raw=storage.getItem(candidate);if(!raw)continue;
   try{const entry=raw.length<=1_000_000?JSON.parse(raw):null;
    if(!entry||entry.version!==1||!Number.isFinite(entry.at)||entry.at>now||now-entry.at>MAX_AGE){storage.removeItem(candidate);continue;}
    if(!newest||entry.at>newest.at||entry.at===newest.at&&candidate===key)newest={raw,at:entry.at,value:entry.value,key:candidate};
   }catch{storage.removeItem(candidate);}
  }
  if(!newest)return null;
  // Keep the original timestamp. A storage quota failure must neither lose the
  // recoverable legacy draft nor extend its expiry.
  if(newest.key!==key)try{storage.setItem(key,newest.raw);for(const candidate of candidates)if(candidate!==key)storage.removeItem(candidate);}catch{}
  return newest.value;
 }catch{try{storage.removeItem(key)}catch{}return null;}
}
export function writeProcessDraft<T>(storage:StorageLike,key:string,value:T,now=Date.now()){
 try{storage.setItem(key,JSON.stringify({version:1,at:now,value}));return true}catch{return false}
}
export function removeProcessDraft(storage:StorageLike,key:string){try{for(const candidate of aliases(storage,canonicalScopeKey(key)))storage.removeItem(candidate)}catch{}}
export function clearProcessDrafts(){
 if(typeof window==='undefined')return;
 try{const storage=window.sessionStorage;for(let i=storage.length-1;i>=0;i--){const key=storage.key(i);if(key?.startsWith(PREFIX))storage.removeItem(key)}}catch{}
}
