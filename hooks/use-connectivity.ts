"use client";
import {useEffect,useState} from "react";
export type ConnectivityState="online"|"offline"|"reconnecting";
export function useConnectivity(){
 const [state,setState]=useState<ConnectivityState>(typeof navigator!=="undefined"&&navigator.onLine===false?"offline":"online");
 useEffect(()=>{
  let timer:number|undefined;
  const online=()=>{setState("reconnecting");timer=window.setTimeout(()=>setState("online"),700)};
  const offline=()=>{if(timer)window.clearTimeout(timer);setState("offline")};
  window.addEventListener("online",online);window.addEventListener("offline",offline);
  return()=>{if(timer)window.clearTimeout(timer);window.removeEventListener("online",online);window.removeEventListener("offline",offline)};
 },[]);
 return state;
}
