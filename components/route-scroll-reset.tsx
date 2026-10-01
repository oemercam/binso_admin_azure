"use client";

import {useEffect,useRef} from "react";
import {usePathname} from "next/navigation";
import {storageKeys} from "@/config/storage-keys";
import {getBrowserStorage,readTextStorage,removeStorage,writeTextStorage} from "@/lib/client/browser-storage";

const prefix=`${storageKeys.uiPrefix}:scroll:`;
const popKey=`${storageKeys.uiPrefix}:history-pop`;

/** Restores list/detail scroll position only for browser/PWA back-forward navigation. */
export default function RouteScrollReset(){
 const pathname=usePathname();
 const previousPath=useRef(pathname);

 useEffect(()=>{
  const previous=window.history.scrollRestoration;
  window.history.scrollRestoration="manual";
  const storage=getBrowserStorage("session");
  const onPop=()=>writeTextStorage(popKey,"1",storage);
  window.addEventListener("popstate",onPop);
  return()=>{window.removeEventListener("popstate",onPop);window.history.scrollRestoration=previous};
 },[]);

 useEffect(()=>{
  const storage=getBrowserStorage("session");
  const oldPath=previousPath.current;
  if(oldPath!==pathname)writeTextStorage(`${prefix}${oldPath}`,String(window.scrollY),storage);
  const restore=readTextStorage(popKey,"",storage)==="1";
  removeStorage(popKey,storage);
  previousPath.current=pathname;
  const frame=window.requestAnimationFrame(()=>{
   const top=restore?Number(readTextStorage(`${prefix}${pathname}`,"0",storage)):0;
   window.scrollTo({top:Number.isFinite(top)?top:0,left:0,behavior:"auto"});
  });
  return()=>window.cancelAnimationFrame(frame);
 },[pathname]);

 return null;
}
