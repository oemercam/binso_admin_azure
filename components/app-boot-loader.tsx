"use client";
import {useEffect,useState} from "react";
import BrandLogo from "@/components/ui/brand-logo";
export default function AppBootLoader(){const [visible,setVisible]=useState(true);useEffect(()=>{const min=window.setTimeout(()=>setVisible(false),520);const onLoad=()=>window.setTimeout(()=>setVisible(false),220);if(document.readyState==="complete")onLoad();else window.addEventListener("load",onLoad,{once:true});return()=>{window.clearTimeout(min);window.removeEventListener("load",onLoad)}},[]);if(!visible)return null;return <div className="app-boot-loader" role="status" aria-live="polite"><div className="app-boot-mark"><BrandLogo compact/></div><span>Binso One wird geladen …</span></div>}
