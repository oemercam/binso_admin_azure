/** Editable, unsaved input only. Never persist API responses or credentials. */
const PREFIX='binso.process-draft.v1:';
const MAX_AGE=24*60*60*1000;
type StorageLike=Pick<Storage,'getItem'|'setItem'|'removeItem'|'key'|'length'>;
export function draftScope(userId:string,tenantId:string,role:string,process:string){
 return PREFIX+JSON.stringify([userId,tenantId,role,process]);
}
export function readProcessDraft<T>(storage:StorageLike,key:string,now=Date.now()):T|null{
 try{
  const raw=storage.getItem(key);if(!raw)return null;
  if(raw.length>1_000_000){storage.removeItem(key);return null;}
  const entry=JSON.parse(raw);
  if(entry.version!==1||!Number.isFinite(entry.at)||entry.at>now||now-entry.at>MAX_AGE){storage.removeItem(key);return null;}
  return entry.value as T;
 }catch{try{storage.removeItem(key)}catch{}return null;}
}
export function writeProcessDraft<T>(storage:StorageLike,key:string,value:T,now=Date.now()){
 try{storage.setItem(key,JSON.stringify({version:1,at:now,value}));return true}catch{return false}
}
export function removeProcessDraft(storage:StorageLike,key:string){try{storage.removeItem(key)}catch{}}
export function clearProcessDrafts(){
 if(typeof window==='undefined')return;
 try{const storage=window.sessionStorage;for(let i=storage.length-1;i>=0;i--){const key=storage.key(i);if(key?.startsWith(PREFIX))storage.removeItem(key)}}catch{}
}
