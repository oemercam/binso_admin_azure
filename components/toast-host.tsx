"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import {subscribeAppEvent,appEvents} from "@/lib/client/app-events";
import {useLocale} from "@/components/locale-provider";
type Toast={id:number;message:string;title?:string;tone:"success"|"info"|"danger"|"warning"};
export default function ToastHost(){
 const {t}=useLocale();
 const [toasts,setToasts]=useState<Toast[]>([]);
 useEffect(()=>{const handler=(e:Event)=>{const d=(e as CustomEvent).detail;const id=Date.now()+Math.random();const tone:Toast["tone"]=d.tone||"success";setToasts(t=>[...t,{id,message:d.message,title:d.title,tone}]);const dismissMs=tone==="danger"?8000:tone==="warning"?6000:tone==="success"?3500:4500;window.setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),dismissMs)};const unsubscribe=subscribeAppEvent(appEvents.toast,handler);return unsubscribe},[]);
 return <div className="toast-host" aria-live="polite">{toasts.map(toast=>{const Icon=toast.tone==="danger"?XCircle:toast.tone==="warning"?AlertTriangle:toast.tone==="info"?Info:CheckCircle2;return <div className={`toast ${toast.tone}`} key={toast.id}><Icon size={19}/><div className="toast-copy">{toast.title&&<strong>{toast.title}</strong>}<span>{toast.message}</span></div><button onClick={()=>setToasts(x=>x.filter(y=>y.id!==toast.id))} aria-label={t("Schliessen")}><X size={15}/></button></div>})}</div>
}
