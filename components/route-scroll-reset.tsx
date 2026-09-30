"use client";

import {useLayoutEffect} from "react";
import {usePathname} from "next/navigation";

export default function RouteScrollReset(){
 const pathname=usePathname();
 useLayoutEffect(()=>{
  const previous=window.history.scrollRestoration;
  window.history.scrollRestoration="manual";
  window.scrollTo({top:0,left:0,behavior:"auto"});
  const frame=window.requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:"auto"}));
  return()=>{
   window.cancelAnimationFrame(frame);
   window.history.scrollRestoration=previous;
  };
 },[pathname]);
 return null;
}
