"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
type State={title:string;message:string;confirmLabel:string;cancelLabel:string;tone:"default"|"danger";resolve:(v:boolean)=>void}|null;
export default function ConfirmHost(){
 const [state,setState]=useState<State>(null);
 useEffect(()=>{const h=(e:Event)=>{const d=(e as CustomEvent).detail;setState({title:d.title||"Bestätigen",message:d.message,confirmLabel:d.confirmLabel||"Bestätigen",cancelLabel:d.cancelLabel||"Abbrechen",tone:d.tone||"default",resolve:d.resolve})};window.addEventListener("binso-confirm",h);return()=>window.removeEventListener("binso-confirm",h)},[]);
 if(!state)return null;
 const close=(v:boolean)=>{state.resolve(v);setState(null)};
 return <div className="modal-backdrop confirm-backdrop" role="presentation" onMouseDown={e=>{if(e.currentTarget===e.target)close(false)}}>
  <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
   <div className={`confirm-icon ${state.tone}`}><AlertTriangle size={22}/></div>
   <button className="confirm-close" onClick={()=>close(false)} aria-label="Schliessen"><X size={18}/></button>
   <h2 id="confirm-title">{state.title}</h2><p>{state.message}</p>
   <div className="confirm-actions"><button onClick={()=>close(false)}>{state.cancelLabel}</button><button className={state.tone==="danger"?"danger-button":"primary-inline"} onClick={()=>close(true)}>{state.confirmLabel}</button></div>
  </div>
 </div>
}
