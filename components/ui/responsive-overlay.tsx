"use client";
import {useEffect,useId,useRef} from "react";
import {X} from "lucide-react";

type Props={open:boolean;title:string;onClose:()=>void;children:React.ReactNode;actions?:React.ReactNode;ariaDescription?:string};
export default function ResponsiveOverlay({open,title,onClose,children,actions,ariaDescription}:Props){
 const titleId=useId();const descId=useId();const closeRef=useRef<HTMLButtonElement>(null);const previous=useRef<HTMLElement|null>(null);
 useEffect(()=>{if(!open)return;previous.current=document.activeElement as HTMLElement|null;const old=document.body.style.overflow;document.body.style.overflow="hidden";const t=window.setTimeout(()=>closeRef.current?.focus(),0);const key=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose()};window.addEventListener("keydown",key);return()=>{window.clearTimeout(t);window.removeEventListener("keydown",key);document.body.style.overflow=old;previous.current?.focus?.()}},[open,onClose]);
 if(!open)return null;
 return <div className="responsive-overlay-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="responsive-overlay" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={ariaDescription?descId:undefined}><div className="responsive-overlay-handle" aria-hidden="true"/><header><h2 id={titleId}>{title}</h2><button ref={closeRef} className="ui-icon-button" type="button" aria-label="Schliessen" onClick={onClose}><X size={18}/></button></header>{ariaDescription&&<p id={descId} className="sr-only">{ariaDescription}</p>}<div className="responsive-overlay-body">{children}</div>{actions&&<footer>{actions}</footer>}</section></div>;
}
