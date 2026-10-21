"use client";

import {useLayoutEffect,useRef} from "react";

type DraftGuard={blocked:()=>void;protectUnload:()=>boolean;navigate?:(url:string)=>void};
const guards=new Set<DraftGuard>();
let boundary:{release:()=>void;allow:()=>void;cleanup:()=>void}|null=null;

/** One same-URL boundary protects all active drafts before Next can unmount them on Safari back. */
function armBoundary(){
 const url=location.href,base={...history.state},owner=crypto.randomUUID();
 const existing=base.binsoDraftBoundary;delete base.binsoDraftBoundary;
 const state={...base,binsoDraftBoundary:owner};
 if(existing)history.replaceState(state,"",url);else history.pushState(state,"",url);
 let leaving=false;
 const unload=(event:BeforeUnloadEvent)=>{if(!leaving&&[...guards].some(guard=>guard.protectUnload())){event.preventDefault();event.returnValue=""}};
 const back=(event:PopStateEvent)=>{
  if(leaving||location.href!==url||event.state?.binsoDraftBoundary===owner)return;
  event.stopImmediatePropagation();history.pushState(state,"",url);[...guards].at(-1)?.blocked();
 };
 const click=(event:MouseEvent)=>{
  if(leaving||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const anchor=event.target instanceof Element?event.target.closest<HTMLAnchorElement>('a[href]'):null;
  if(!anchor||anchor.download||anchor.target&&anchor.target!=='_self')return;
  const target=new URL(anchor.href,location.href),guard=[...guards].at(-1);
  if(!guard?.navigate||!/^https?:$/.test(target.protocol)||target.href===location.href)return;
  event.preventDefault();event.stopImmediatePropagation();guard.navigate(target.href);
 };
 const detach=()=>{window.removeEventListener("popstate",back,true);window.removeEventListener("beforeunload",unload);document.removeEventListener('click',click,true)};
 window.addEventListener("popstate",back,true);window.addEventListener("beforeunload",unload);document.addEventListener('click',click,true);
 return {
  release:()=>{leaving=true;detach();history.go(-2)},
  allow:()=>{leaving=true;detach()},
  cleanup:()=>{
   detach();
   if(!leaving&&location.href===url&&history.state?.binsoDraftBoundary===owner){
    const removed=(event:PopStateEvent)=>{window.removeEventListener("popstate",removed,true);if(location.href===url)event.stopImmediatePropagation()};
    window.addEventListener("popstate",removed,true);history.back();
   }
  },
 };
}

export function useBrowserBackGuard(dirty:boolean,onBlocked:()=>void,protectUnload=true,onNavigate?:(url:string)=>void){
 // Register before paint: browser back may follow the input commit before passive effects run.
 const blocked=useRef(onBlocked);
 const unload=useRef(protectUnload);
 const navigate=useRef(onNavigate),supportsNavigation=Boolean(onNavigate);
 useLayoutEffect(()=>{navigate.current=onNavigate},[onNavigate]);
 useLayoutEffect(()=>{unload.current=protectUnload},[protectUnload]);
 useLayoutEffect(()=>{blocked.current=onBlocked},[onBlocked]);
 useLayoutEffect(()=>{
  if(!dirty)return;
  const guard:DraftGuard={blocked:()=>blocked.current(),protectUnload:()=>unload.current,...(supportsNavigation?{navigate:(url:string)=>navigate.current?.(url)}:{})};guards.add(guard);
  if(!boundary)boundary=armBoundary();
  return()=>{
   guards.delete(guard);
   if(!guards.size){
    const retiring=boundary;
    // React cleans the closed sheet before registering its newly dirty parent.
    // Keep that same history boundary until this commit's effect setups finish.
    queueMicrotask(()=>{if(!guards.size&&boundary===retiring){boundary=null;retiring?.cleanup()}});
   }
  };
 },[dirty,supportsNavigation]);
 return ()=>boundary?.release();
}

/** Use immediately before an explicitly confirmed navigation or successful session end. */
export function allowDraftNavigation(){boundary?.allow()}
