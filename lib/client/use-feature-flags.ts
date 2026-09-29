"use client";

import {useCallback,useEffect,useState} from "react";
import {apiFetch,isProductionMode} from "@/lib/client/runtime";
import {localFeatureFlags} from "@/lib/pilot-store";

export type FeatureFlags=Record<string,boolean>;

export function useFeatureFlags(){
  const [flags,setFlags]=useState<FeatureFlags>(localFeatureFlags);
  const [ready,setReady]=useState(!isProductionMode());

  const load=useCallback(async()=>{
    if(!isProductionMode()){
      setFlags(localFeatureFlags);
      setReady(true);
      return;
    }
    try{
      const result=await apiFetch<{flags:FeatureFlags}>("/api/features");
      setFlags({...localFeatureFlags,...result.flags});
    }catch{
      setFlags(localFeatureFlags);
    }finally{
      setReady(true);
    }
  },[]);

  useEffect(()=>{
    const timer=window.setTimeout(()=>{void load()},0);
    return()=>window.clearTimeout(timer);
  },[load]);

  const enabled=useCallback((key:string)=>flags[key]!==false,[flags]);
  return {flags,ready,enabled,reload:load};
}
