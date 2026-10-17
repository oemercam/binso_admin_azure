"use client";

import {useEffect,useState} from "react";
import {LocalizedElement} from "@/lib/client/locale";
import {Icon} from "./ui";

/** Desktop preference is independent of the protected mobile navigation. */
export function useDesktopNavigation(){
 const [navigationCollapsed,setCollapsed]=useState(false);
 useEffect(()=>{
  const restore=()=>{try{setCollapsed(localStorage.getItem('binso.desktop-navigation')==='collapsed')}catch{/* Storage may be blocked; the control still works. */}};
  queueMicrotask(restore);
  const sync=(event:StorageEvent)=>{if(event.key==='binso.desktop-navigation')restore()};
  window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);
 },[]);
 const toggleNavigation=()=>{
  const next=!navigationCollapsed;setCollapsed(next);
  try{localStorage.setItem('binso.desktop-navigation',next?'collapsed':'expanded')}catch{/* Keep the current in-memory preference. */}
 };
 return {navigationCollapsed,toggleNavigation};
}

export function DesktopNavigationToggle({collapsed,onToggle,controls}:{collapsed:boolean;onToggle:()=>void;controls:string}){
 const label=collapsed?"Navigation öffnen":"Navigation einklappen";
 return <LocalizedElement as="button" type="button" className="icon-button desktop-navigation-toggle" aria-label={label} title={label} aria-expanded={!collapsed} aria-controls={controls} onClick={onToggle}><Icon name="menu"/></LocalizedElement>;
}
