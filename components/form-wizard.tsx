"use client";

import {useEffect,useRef,useState,type ReactNode} from "react";
import {Button,FormActions} from "./ui";

/** Keeps every step mounted: a step change never changes drafts or navigation. */
export function FormWizard({labels,step,onStep,children,action,busy=false,guided=true}:{labels:string[];step:number;onStep:(step:number)=>void;children:ReactNode;action:ReactNode;busy?:boolean;guided?:boolean}){
 const rootRef=useRef<HTMLDivElement>(null);
 const [height,setHeight]=useState<number|null>(null);
 useEffect(()=>{
  const root=rootRef.current;if(!guided||!root||root.closest('.bottom-sheet'))return;
  const viewport=window.visualViewport;
  const update=()=>{const header=document.querySelector(window.innerWidth<=760?'.mobile-header':'.desktop-appbar');const top=Math.max(root.getBoundingClientRect().top,header?.getBoundingClientRect().bottom??0);setHeight(Math.max(120,(viewport?.height??innerHeight)+(viewport?.offsetTop??0)-top-16))};
  const frame=requestAnimationFrame(update);window.addEventListener('resize',update);viewport?.addEventListener('resize',update);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',update);viewport?.removeEventListener('resize',update)};
 },[guided]);
 const go=(next:number)=>{
  if(next>step){const invalid=Array.from(rootRef.current?.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('input,select,textarea')??[]).find(el=>el.getClientRects().length&&!el.disabled&&!el.checkValidity());if(invalid){invalid.reportValidity();return;}}
  onStep(next);const content=rootRef.current?.querySelector(".wizard-content");if(content)content.scrollTop=0;
 };
 return <div ref={rootRef} className="form-wizard" data-frame={guided&&height!==null||undefined} style={guided&&height!==null?{height}:undefined} aria-label="Geführte Erfassung">
  {guided&&<div className="wizard-progress" role="status">Schritt {step+1} von {labels.length} · {labels[step]}</div>}
  <div className="wizard-content">{children}</div>
  <FormActions>{guided&&<Button variant="secondary" disabled={step===0||busy} onClick={()=>go(step-1)}>Zurück</Button>}{!guided||step===labels.length-1?action:<Button disabled={busy} onClick={()=>go(step+1)}>Weiter</Button>}</FormActions>
 </div>;
}
