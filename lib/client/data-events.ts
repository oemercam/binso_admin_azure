import {clearProcessDrafts} from './process-draft';
/** Metadata-only invalidation; business responses are never persisted in the browser. */
export type DataDomain = 'customers'|'documents'|'payments'|'finance'|'dashboard'|'projects'|'time'|'timer'|'expenses'|'employees'|'files'|'support'|'notifications'|'settings'|'billing'|'operator'|'records'|'session'|'products'|'identity';
const revisions=new Map<DataDomain,number>();
const listeners=new Set<()=>void>();
let channel:BroadcastChannel|null=null;
let listening=false;
export function dataDomains(path:string):DataDomain[]{
 const url=new URL(path,'https://binso.invalid');
 const name=url.pathname.split('/')[2];
 if(name==='demo')return dataDomains('/api/'+(url.searchParams.get('collection')||url.pathname.split('/')[3]||'session'));
 const map:Record<string,DataDomain>={'time-entries':'time','time-tracker':'timer',auth:'identity',business:'records'};
 return [map[name]??(name as DataDomain)];
}
export function affectedDomains(path:string):DataDomain[]{
 const [domain]=dataDomains(path);
 if(domain==='identity')return ['identity','session'];
 if(path.startsWith('/api/settings/team/'))return ['settings','session','identity'];
 if(path.startsWith('/api/settings/notifications'))return ['settings','notifications'];
 if(path.startsWith('/api/settings/profile'))return ['settings'];
 const dependents:Partial<Record<DataDomain,DataDomain[]>>={
 customers:['documents','payments','projects','time','finance','dashboard'],
 documents:['customers','finance','dashboard','time','expenses','projects'],
 payments:['documents','customers','finance','dashboard'],
 time:['customers','projects','finance'],timer:['time'],expenses:['customers','employees','projects','finance','documents'],
 employees:['time','expenses'],files:['settings','expenses','employees','support','customers','documents','projects'],projects:['customers','time','documents'],
 products:['documents'],settings:['documents'],billing:['settings'],records:['customers','documents','payments','finance','dashboard','projects','time','expenses','employees'],
 };
 return [domain,...(dependents[domain]??[])];
}
function apply(domains:DataDomain[]){for(const domain of domains)revisions.set(domain,(revisions.get(domain)??0)+1);for(const listener of listeners)listener();}
function connect(){
 if(listening||typeof window==='undefined')return;
 listening=true;
 if(typeof BroadcastChannel!=='undefined'){
  channel=new BroadcastChannel('binso-data-events');
  channel.onmessage=event=>{if(event.data?.type==='changed'&&Array.isArray(event.data.domains))apply(event.data.domains);if(event.data?.type==='session')resetClientData(false);};
 }
 window.addEventListener('storage',event=>{if(event.key==='binso.session.changed')resetClientData(false);});
 const refresh=()=>{if(document.visibilityState==='visible'){apply([...revisions.keys()].filter(domain=>domain!=='session'));}};
 window.addEventListener('online',refresh);
 document.addEventListener('visibilitychange',refresh);
}
export function subscribeClientData(listener:()=>void){connect();listeners.add(listener);return()=>{listeners.delete(listener);};}
export function dataRevision(paths:readonly string[]){return paths.flatMap(dataDomains).concat('session').map(domain=>{if(!revisions.has(domain))revisions.set(domain,0);return revisions.get(domain)??0;}).join(':');}
export function publishMutation(path:string){connect();const domains=affectedDomains(path);apply(domains);channel?.postMessage({type:'changed',domains});}
export function resetClientData(broadcast=true){connect();clearProcessDrafts();apply(['session','identity']);if(broadcast)channel?.postMessage({type:'session'});}
