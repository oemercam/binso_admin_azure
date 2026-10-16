"use client";

import {useEffect,useState} from "react";
import {LocalizedElement,LocalizedText} from "@/lib/client/locale";
import {Icon} from "./ui";

/** Desktop preference is independent of the protected mobile navigation. */
export function useDesktopNavigation(){
 const [navigationCollapsed,setCollapsed]=useState(true);
 useEffect(()=>{
  const restore=()=>{try{setCollapsed(localStorage.getItem('binso.desktop-navigation')!=='expanded')}catch{/* Storage may be blocked; the control still works. */}};
  queueMicrotask(restore);
  const sync=(event:StorageEvent)=>{if(event.key==='binso.desktop-navigation')restore()};
  window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);
 },[]);
 useEffect(()=>{
  if(navigationCollapsed||window.innerWidth<=1100)return;
  const toggle=document.querySelector<HTMLButtonElement>('.desktop-navigation-toggle');
  const sidebar=document.getElementById(toggle?.getAttribute('aria-controls')??'');
  const frame=requestAnimationFrame(()=>sidebar?.querySelector<HTMLAnchorElement>('nav a')?.focus());
  const outside=(event:FocusEvent)=>{if(event.target instanceof Node&&!sidebar?.contains(event.target)&&event.target!==toggle)setCollapsed(true)};
  document.addEventListener('focusin',outside);
  return()=>{cancelAnimationFrame(frame);document.removeEventListener('focusin',outside)};
 },[navigationCollapsed]);
 const toggleNavigation=()=>{
  const next=!navigationCollapsed;setCollapsed(next);
  if(next)document.querySelector<HTMLButtonElement>('.desktop-navigation-toggle')?.focus();
  try{localStorage.setItem('binso.desktop-navigation',next?'collapsed':'expanded')}catch{/* Keep the current in-memory preference. */}
 };
 return {navigationCollapsed,toggleNavigation};
}

export function DesktopNavigationToggle({collapsed,onToggle,controls}:{collapsed:boolean;onToggle:()=>void;controls:string}){
 return <LocalizedElement as="button" type="button" className="icon-button desktop-navigation-toggle" aria-label="Navigation" title="Navigation" aria-expanded={!collapsed} aria-controls={controls} onClick={onToggle}><Icon name="menu"/><span><LocalizedText>{"Bereiche"}</LocalizedText></span></LocalizedElement>;
}
