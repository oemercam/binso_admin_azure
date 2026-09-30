"use client";
import {useEffect,useState} from "react";
import BrandLogo from "@/components/ui/brand-logo";

const MIN_VISIBLE_MS=1400;
const MAX_VISIBLE_MS=2600;

export default function AppBootLoader(){
 const [visible,setVisible]=useState(true);
 useEffect(()=>{
  const started=performance.now();
  let hideTimer:number|undefined;
  const hide=()=>{
   const remaining=Math.max(0,MIN_VISIBLE_MS-(performance.now()-started));
   window.clearTimeout(hideTimer);
   hideTimer=window.setTimeout(()=>setVisible(false),remaining);
  };
  const fallback=window.setTimeout(()=>setVisible(false),MAX_VISIBLE_MS);
  if(document.readyState==="complete")hide();
  else window.addEventListener("load",hide,{once:true});
  return()=>{
   window.clearTimeout(hideTimer);
   window.clearTimeout(fallback);
   window.removeEventListener("load",hide);
  };
 },[]);
 if(!visible)return null;
 return <div className="app-boot-loader" role="status" aria-label="Binso One wird geladen">
  <div className="app-boot-icon-reveal" aria-hidden="true"><BrandLogo compact priority/></div>
 </div>;
}
