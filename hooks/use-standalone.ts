"use client";
import {useEffect,useState} from "react";
export function useStandalone(){
 const [standalone,setStandalone]=useState(false);
 useEffect(()=>{const media=window.matchMedia("(display-mode: standalone)");const read=()=>setStandalone(media.matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone));read();media.addEventListener("change",read);return()=>media.removeEventListener("change",read)},[]);
 return standalone;
}
