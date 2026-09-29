"use client";
import {useEffect,useState} from "react";
import BrandLogo from "@/components/ui/brand-logo";

export default function AppBootLoader(){
 const [visible,setVisible]=useState(true);
 useEffect(()=>{
  const min=window.setTimeout(()=>setVisible(false),900);
  const onLoad=()=>window.setTimeout(()=>setVisible(false),120);
  if(document.readyState==="complete")onLoad();
  else window.addEventListener("load",onLoad,{once:true});
  return()=>{window.clearTimeout(min);window.removeEventListener("load",onLoad)};
 },[]);
 if(!visible)return null;
 return <div className="app-boot-loader" role="status" aria-label="Binso One wird geladen">
  <div className="app-boot-icon-reveal" aria-hidden="true"><BrandLogo compact priority/></div>
 </div>;
}
