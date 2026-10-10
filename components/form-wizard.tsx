"use client";

import {useEffect,useRef,type ReactNode} from "react";
import {Button,FormActions} from "./ui";

/** Keeps every step mounted: a step change never changes drafts or navigation. */
export function FormWizard({labels,step,onStep,children,action,cancelAction,busy=false,guided=true,backLabel="Zurück",nextLabel="Weiter",progressLabel,ariaLabel="Geführte Erfassung"}:{labels:string[];step:number;onStep:(step:number)=>void;children:ReactNode;action:ReactNode;cancelAction:ReactNode;busy?:boolean;guided?:boolean;backLabel?:string;nextLabel?:string;progressLabel?:(step:number,total:number,label:string)=>string;ariaLabel?:string}){
 const rootRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const root=rootRef.current;if(!guided||!root||root.closest('.bottom-sheet'))return;
  const viewport=window.visualViewport;
  const header=document.querySelector(window.innerWidth<=760?'.mobile-header':'.desktop-appbar');
  const update=()=>{
   // Session initialization mounts forms before the frame becomes visible.
   // A hidden rectangle cannot define the available viewport height.
   if(!root.getClientRects().length)return;
   const top=Math.max(root.getBoundingClientRect().top,header?.getBoundingClientRect().bottom??0);
   root.style.setProperty('--wizard-height',`${Math.max(120,(viewport?.height??window.innerHeight)+(viewport?.offsetTop??0)-top-20)}px`);
  };
  let frame=0;
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update)};
  const observer=new ResizeObserver(schedule);
  observer.observe(root);if(root.parentElement)observer.observe(root.parentElement);if(header)observer.observe(header);
  update();window.addEventListener('resize',schedule);viewport?.addEventListener('resize',schedule);viewport?.addEventListener('scroll',schedule);
  return()=>{observer.disconnect();cancelAnimationFrame(frame);window.removeEventListener('resize',schedule);viewport?.removeEventListener('resize',schedule);viewport?.removeEventListener('scroll',schedule);root.style.removeProperty('--wizard-height')};
 },[guided]);
 const go=(next:number)=>{
  if(next>step){const invalid=Array.from(rootRef.current?.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('input,select,textarea')??[]).find(el=>el.getClientRects().length&&!el.disabled&&!el.checkValidity());if(invalid){invalid.reportValidity();return;}}
  if(busy||next<0||next>=labels.length)return;
  onStep(next);rootRef.current?.querySelector(".wizard-content")?.scrollTo({top:0});
 };
 return <div ref={rootRef} className="form-wizard" data-guided={guided?"true":undefined} aria-label={ariaLabel}>
  {guided&&<div className="wizard-progress" role="status">{progressLabel?progressLabel(step+1,labels.length,labels[step]):`Schritt ${step+1} von ${labels.length} · ${labels[step]}`}</div>}
  <div className="wizard-content">{children}</div>
  <FormActions>{guided&&(step===0?cancelAction:<Button variant="secondary" disabled={busy} onClick={()=>go(step-1)}>{backLabel}</Button>)}{!guided||step===labels.length-1?action:<Button disabled={busy} onClick={()=>go(step+1)}>{nextLabel}</Button>}</FormActions>
 </div>;
}
