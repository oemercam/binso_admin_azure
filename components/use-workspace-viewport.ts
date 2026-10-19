"use client";
import {useEffect} from "react";
/** Keep conversations in the visual viewport while only messages scroll. */
export function useWorkspaceViewport(){
 useEffect(()=>{
  const root=document.documentElement,previous=root.style.overflow,bodyPrevious=document.body.style.overflow;
  root.style.overflow='hidden';document.body.style.overflow='hidden';
  const viewport=window.visualViewport;
  const baseline=Math.max(root.clientHeight,innerHeight,viewport?.height??0);
  let frame=0;
  const update=()=>{root.style.setProperty('--workspace-viewport-height',`${viewport?.height??innerHeight}px`);root.style.setProperty('--workspace-viewport-top',`${viewport?.offsetTop??0}px`);const input=document.activeElement?.matches('input:not([type=hidden]),textarea,[contenteditable=true]');root.toggleAttribute('data-workspace-keyboard',Boolean(input&&(viewport?.scale??1)===1&&baseline-(viewport?.height??innerHeight)>120))};
  const focus=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update)};
  document.addEventListener('focusin',focus);document.addEventListener('focusout',focus);
  const resume=()=>{if(document.visibilityState==='visible')update()};
  update();viewport?.addEventListener('resize',update);viewport?.addEventListener('scroll',update);
  window.addEventListener('resize',update);window.addEventListener('pageshow',resume);document.addEventListener('visibilitychange',resume);
  return()=>{cancelAnimationFrame(frame);document.removeEventListener('focusin',focus);document.removeEventListener('focusout',focus);root.removeAttribute('data-workspace-keyboard');viewport?.removeEventListener('resize',update);viewport?.removeEventListener('scroll',update);window.removeEventListener('resize',update);window.removeEventListener('pageshow',resume);document.removeEventListener('visibilitychange',resume);root.style.overflow=previous;document.body.style.overflow=bodyPrevious;root.style.removeProperty('--workspace-viewport-height');root.style.removeProperty('--workspace-viewport-top')};
 },[]);
}
