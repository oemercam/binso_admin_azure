"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
type Toast={id:number;message:string;title?:string;tone:"success"|"info"|"danger"|"warning"};
export default function ToastHost(){
 const [toasts,setToasts]=useState<Toast[]>([]);
 useEffect(()=>{const handler=(e:Event)=>{const d=(e as CustomEvent).detail;const id=Date.now()+Math.random();setToasts(t=>[...t,{id,message:d.message,title:d.title,tone:d.tone||"success"}]);window.setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),4500)};window.addEventListener("binso-toast",handler);return()=>window.removeEventListener("binso-toast",handler)},[]);
 return <div className="toast-host" aria-live="polite">{toasts.map(t=>{const Icon=t.tone==="danger"?XCircle:t.tone==="warning"?AlertTriangle:t.tone==="info"?Info:CheckCircle2;return <div className={`toast ${t.tone}`} key={t.id}><Icon size={19}/><div className="toast-copy">{t.title&&<strong>{t.title}</strong>}<span>{t.message}</span></div><button onClick={()=>setToasts(x=>x.filter(y=>y.id!==t.id))} aria-label="Schliessen"><X size={15}/></button></div>})}</div>
}
