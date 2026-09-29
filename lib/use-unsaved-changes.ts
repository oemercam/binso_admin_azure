"use client";
import { useEffect } from "react";
export function useUnsavedChanges(dirty:boolean){
 useEffect(()=>{
   if(!dirty)return;
   const h=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue=""};
   window.addEventListener("beforeunload",h);
   return()=>window.removeEventListener("beforeunload",h);
 },[dirty]);
}
