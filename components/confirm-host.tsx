"use client";
import {useEffect,useState} from "react";
import {AlertTriangle} from "lucide-react";
import ResponsiveOverlay from "@/components/ui/responsive-overlay";
import {Button} from "@/components/ui/button";

type State={title:string;message:string;confirmLabel:string;cancelLabel:string;tone:"default"|"danger";resolve:(v:boolean)=>void}|null;

export default function ConfirmHost(){
 const [state,setState]=useState<State>(null);
 useEffect(()=>{const handler=(event:Event)=>{const d=(event as CustomEvent).detail;setState({title:d.title||"Bestätigen",message:d.message,confirmLabel:d.confirmLabel||"Bestätigen",cancelLabel:d.cancelLabel||"Abbrechen",tone:d.tone||"default",resolve:d.resolve})};window.addEventListener("binso-confirm",handler);return()=>window.removeEventListener("binso-confirm",handler)},[]);
 const close=(value:boolean)=>{if(!state)return;state.resolve(value);setState(null)};
 return <ResponsiveOverlay
   open={Boolean(state)}
   title={state?.title||"Bestätigen"}
   onClose={()=>close(false)}
   size="sm"
   role="alertdialog"
   ariaDescription={state?.message}
   actions={<>
     <Button variant="secondary" onClick={()=>close(false)}>{state?.cancelLabel||"Abbrechen"}</Button>
     <Button variant={state?.tone==="danger"?"danger":"primary"} onClick={()=>close(true)}>{state?.confirmLabel||"Bestätigen"}</Button>
   </>}
 >
   {state&&<div className="confirm-content"><div className={`confirm-icon ${state.tone}`}><AlertTriangle size={22}/></div><p>{state.message}</p></div>}
 </ResponsiveOverlay>;
}
