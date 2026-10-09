import {resetClientData,dataRevision,subscribeClientData} from "./data-events";
import type {PlanId} from "@/config/plan-access";

export type ClientSession={authenticated:boolean;demo?:boolean;tenant?:{id?:string;role?:string;plan?:PlanId;readOnly?:boolean}};
let cached:ClientSession|null=null;
let validUntil=0;
let pending:Promise<ClientSession>|null=null;
let revision=0;
let observedSessionRevision="",listening=false;
function observeSession(){if(listening||typeof window==="undefined")return;listening=true;observedSessionRevision=dataRevision([]);subscribeClientData(()=>{const next=dataRevision([]);if(next!==observedSessionRevision){observedSessionRevision=next;invalidateClientSession(false);}});}

/** Only retain permissions in memory; cookies and API authorization remain authoritative. */
export function cachedClientSession(){return typeof window!=="undefined"&&Date.now()<validUntil?cached:null;}
export function invalidateClientSession(notify=true){++revision;cached=null;validUntil=0;pending=null;if(notify)resetClientData();}
export function readClientSession():Promise<ClientSession>{
  observeSession();
  const saved=cachedClientSession();
  if(saved)return Promise.resolve(saved);
  if(pending)return pending;
  const startedRevision=revision;
  const request=(async()=>{
    const response=await fetch("/api/auth/session",{cache:"no-store",signal:AbortSignal.timeout(15000)}).catch(error=>{if(error instanceof DOMException&&["TimeoutError","AbortError"].includes(error.name))throw new Error("Die Sitzungsprüfung dauert zu lange. Bitte erneut versuchen.");throw error;});
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
