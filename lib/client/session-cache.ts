import type {PlanId} from "@/config/plan-access";

export type ClientSession={authenticated:boolean;demo?:boolean;tenant?:{id?:string;role?:string;plan?:PlanId;readOnly?:boolean}};
let cached:ClientSession|null=null;
let validUntil=0;
let pending:Promise<ClientSession>|null=null;
let revision=0;

/** Only retain permissions in memory; cookies and API authorization remain authoritative. */
export function cachedClientSession(){return typeof window!=="undefined"&&Date.now()<validUntil?cached:null;}
export function invalidateClientSession(){++revision;cached=null;validUntil=0;pending=null;}
export function readClientSession():Promise<ClientSession>{
  const saved=cachedClientSession();
  if(saved)return Promise.resolve(saved);
  if(pending)return pending;
  const startedRevision=revision;
  const request=(async()=>{
    const response=await fetch("/api/auth/session",{cache:"no-store"});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(typeof payload.message==="string"?payload.message:"Zugang konnte nicht geprüft werden.");
    if(typeof payload.authenticated!=="boolean")throw new Error("Zugang konnte nicht geprüft werden.");
    if(startedRevision!==revision)throw new Error("Die Sitzung wurde geändert. Bitte erneut versuchen.");
    cached=payload;validUntil=Date.now()+30000;
    return payload as ClientSession;
  })();
  pending=request;
  void request.finally(()=>{if(pending===request)pending=null;}).catch(()=>{});
  return request;
}
