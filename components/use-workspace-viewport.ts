"use client";
import {useEffect} from "react";
/** Keep conversations in the visual viewport while only messages scroll. */
export function useWorkspaceViewport(){
 useEffect(()=>{
  const root=document.documentElement,previous=root.style.overflow,bodyPrevious=document.body.style.overflow;
  root.style.overflow='hidden';document.body.style.overflow='hidden';
  const viewport=window.visualViewport;
  const update=()=>{root.style.setProperty('--workspace-viewport-height',`${viewport?.height??innerHeight}px`);root.style.setProperty('--workspace-viewport-top',`${viewport?.offsetTop??0}px`)};
  const resume=()=>{if(document.visibilityState==='visible')update()};
  update();viewport?.addEventListener('resize',update);viewport?.addEventListener('scroll',update);
  window.addEventListener('resize',update);window.addEventListener('pageshow',resume);document.addEventListener('visibilitychange',resume);
  return()=>{viewport?.removeEventListener('resize',update);viewport?.removeEventListener('scroll',update);window.removeEventListener('resize',update);window.removeEventListener('pageshow',resume);document.removeEventListener('visibilitychange',resume);root.style.overflow=previous;document.body.style.overflow=bodyPrevious;root.style.removeProperty('--workspace-viewport-height');root.style.removeProperty('--workspace-viewport-top')};
 },[]);
}
