"use client";

import {useEffect,useRef} from "react";

type DraftGuard={blocked:()=>void};
const guards=new Set<DraftGuard>();
let boundary:{release:()=>void;allow:()=>void;cleanup:()=>void}|null=null;

/** One same-URL boundary protects all active drafts before Next can unmount them on Safari back. */
function armBoundary(){
 const url=location.href,base={...history.state},owner=crypto.randomUUID();
 const existing=base.binsoDraftBoundary;delete base.binsoDraftBoundary;
 const state={...base,binsoDraftBoundary:owner};
 if(existing)history.replaceState(state,"",url);else history.pushState(state,"",url);
 let leaving=false;
 const unload=(event:BeforeUnloadEvent)=>{if(!leaving){event.preventDefault();event.returnValue=""}};
 const back=(event:PopStateEvent)=>{
  if(leaving||location.href!==url||event.state?.binsoDraftBoundary===owner)return;
  event.stopImmediatePropagation();history.pushState(state,"",url);[...guards].at(-1)?.blocked();
 };
 const detach=()=>{window.removeEventListener("popstate",back,true);window.removeEventListener("beforeunload",unload)};
 window.addEventListener("popstate",back,true);window.addEventListener("beforeunload",unload);
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

export function useBrowserBackGuard(dirty:boolean,onBlocked:()=>void){
 const blocked=useRef(onBlocked);
 useEffect(()=>{blocked.current=onBlocked},[onBlocked]);
 useEffect(()=>{
  if(!dirty)return;
  const guard:DraftGuard={blocked:()=>blocked.current()};guards.add(guard);
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
 },[dirty]);
 return ()=>boundary?.release();
}

/** Use immediately before an explicitly confirmed navigation or successful session end. */
export function allowDraftNavigation(){boundary?.allow()}
