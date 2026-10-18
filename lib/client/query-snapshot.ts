/** Short-lived navigation snapshots. Memory only, bounded and fenced by session/domain revision. */
const snapshots=new Map<string,{revision:string;data:unknown;at:number}>();
let owner='';
export function clearQuerySnapshots(){snapshots.clear();owner='';}
function fence(session:string){if(owner!==session){snapshots.clear();owner=session;}}
export function readQuerySnapshot<T>(path:string,revision:string,session:string,now=Date.now()):T|undefined{
 fence(session);const entry=snapshots.get(path);
 if(!entry||entry.revision!==revision||now-entry.at>=30000){snapshots.delete(path);return undefined;}
 return entry.data as T;
}
export function writeQuerySnapshot(path:string,revision:string,session:string,data:unknown,now=Date.now()){
 fence(session);snapshots.delete(path);snapshots.set(path,{revision,data,at:now});
 while(snapshots.size>60)snapshots.delete(snapshots.keys().next().value!);
}
