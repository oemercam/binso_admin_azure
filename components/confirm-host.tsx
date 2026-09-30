"use client";
import {useEffect,useState} from "react";
import {AlertTriangle} from "lucide-react";
import ResponsiveOverlay from "@/components/ui/responsive-overlay";
import {Button} from "@/components/ui/button";
import {useLocale} from "@/components/locale-provider";
import {subscribeAppEvent,appEvents} from "@/lib/client/app-events";

type State={title:string;message:string;confirmLabel:string;cancelLabel:string;tone:"default"|"danger";resolve:(v:boolean)=>void}|null;

export default function ConfirmHost(){
 const {t}=useLocale();
 const [state,setState]=useState<State>(null);
 useEffect(()=>{const handler=(event:Event)=>{const d=(event as CustomEvent).detail;setState({title:d.title||"Bestätigen",message:d.message,confirmLabel:d.confirmLabel||"Bestätigen",cancelLabel:d.cancelLabel||"Abbrechen",tone:d.tone||"default",resolve:d.resolve})};const unsubscribe=subscribeAppEvent(appEvents.confirm,handler);return unsubscribe},[]);
 const close=(value:boolean)=>{if(!state)return;state.resolve(value);setState(null)};
 return <ResponsiveOverlay
   open={Boolean(state)}
   title={t(state?.title||"Bestätigen")}
   onClose={()=>close(false)}
   size="sm"
   role="alertdialog"
   ariaDescription={state?.message?t(state.message):undefined}
   actions={<>
     <Button variant="secondary" onClick={()=>close(false)}>{t(state?.cancelLabel||"Abbrechen")}</Button>
     <Button variant={state?.tone==="danger"?"danger":"primary"} onClick={()=>close(true)}>{t(state?.confirmLabel||"Bestätigen")}</Button>
   </>}
 >
   {state&&<div className="confirm-content"><div className={`confirm-icon ${state.tone}`}><AlertTriangle size={22}/></div><p>{t(state.message)}</p></div>}
 </ResponsiveOverlay>;
}
