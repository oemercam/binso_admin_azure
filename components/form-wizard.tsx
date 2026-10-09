"use client";

import {useRef,type ReactNode} from "react";
import {Button,FormActions} from "./ui";

/** Keeps every step mounted: a step change never changes drafts or navigation. */
export function FormWizard({labels,step,onStep,children,action,busy=false,guided=true}:{labels:string[];step:number;onStep:(step:number)=>void;children:ReactNode;action:ReactNode;busy?:boolean;guided?:boolean}){
 const rootRef=useRef<HTMLDivElement>(null);
 const go=(next:number)=>{
  if(next>step){const invalid=Array.from(rootRef.current?.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('input,select,textarea')??[]).find(el=>el.getClientRects().length&&!el.disabled&&!el.checkValidity());if(invalid){invalid.reportValidity();return;}}
  onStep(next);rootRef.current?.scrollIntoView({block:"start"});
 };
 return <div ref={rootRef} className="form-wizard" aria-label="Geführte Erfassung">
  {guided&&<div className="wizard-progress" role="status">Schritt {step+1} von {labels.length} · {labels[step]}</div>}
  <div className="wizard-content">{children}</div>
  <FormActions>{guided&&<Button variant="secondary" disabled={step===0||busy} onClick={()=>go(step-1)}>Zurück</Button>}{!guided||step===labels.length-1?action:<Button disabled={busy} onClick={()=>go(step+1)}>Weiter</Button>}</FormActions>
 </div>;
}
