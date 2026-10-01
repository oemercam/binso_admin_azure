"use client";

import {useEffect,useId,useRef} from "react";
import {createPortal} from "react-dom";
import {X} from "lucide-react";
import {useOverlayLock} from "@/hooks/use-overlay-lock";
import {useLocale} from "@/components/locale-provider";

type OverlaySize="sm"|"md"|"lg"|"document";
type OverlayRole="dialog"|"alertdialog";

type Props={
  open:boolean;
  title:string;
  onClose:()=>void;
  children:React.ReactNode;
  actions?:React.ReactNode;
  ariaDescription?:string;
  size?:OverlaySize;
  role?:OverlayRole;
  closeOnBackdrop?:boolean;
  showHandle?:boolean;
  className?:string;
};

const focusableSelector=[
  "a[href]","button:not([disabled])","input:not([disabled])","select:not([disabled])",
  "textarea:not([disabled])","[tabindex]:not([tabindex='-1'])"
].join(",");

export default function ResponsiveOverlay({
  open,title,onClose,children,actions,ariaDescription,size="md",role="dialog",
  closeOnBackdrop=true,showHandle=true,className=""
}:Props){
  const {t}=useLocale();
  const titleId=useId();
  const descId=useId();
  const panelRef=useRef<HTMLElement>(null);
  const closeRef=useRef<HTMLButtonElement>(null);
  const previous=useRef<HTMLElement|null>(null);
  useOverlayLock(open);


  useEffect(()=>{
    if(!open)return;
    previous.current=document.activeElement as HTMLElement|null;
    const timer=window.setTimeout(()=>closeRef.current?.focus(),0);
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){
        event.preventDefault();
        onClose();
        return;
      }
      if(event.key!=="Tab"||!panelRef.current)return;
      const focusables=Array.from(panelRef.current.querySelectorAll<HTMLElement>(focusableSelector)).filter(el=>!el.hasAttribute("disabled")&&el.getAttribute("aria-hidden")!=="true");
      if(!focusables.length){event.preventDefault();closeRef.current?.focus();return}
      const first=focusables[0];
      const last=focusables[focusables.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
    };
    window.addEventListener("keydown",onKey);
    return()=>{
      window.clearTimeout(timer);
      window.removeEventListener("keydown",onKey);
      window.requestAnimationFrame(()=>previous.current?.focus?.());
    };
  },[open,onClose]);

  if(!open||typeof document==="undefined")return null;

  const overlay=<div className="ui-overlay-backdrop" onMouseDown={event=>{if(closeOnBackdrop&&event.target===event.currentTarget)onClose()}}>
    <section
      ref={panelRef}
      className={`ui-overlay ui-overlay-${size}${className?` ${className}`:""}`}
      role={role}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={ariaDescription?descId:undefined}
    >
      {showHandle&&<div className="ui-overlay-handle" aria-hidden="true"/>}
      <header className="ui-overlay-header">
        <h2 id={titleId}>{title}</h2>
        <button ref={closeRef} className="ui-overlay-close" type="button" aria-label={t("Schliessen")} onClick={onClose}><X size={18}/></button>
      </header>
      {ariaDescription&&<p id={descId} className="sr-only">{ariaDescription}</p>}
      <div className="ui-overlay-body">{children}</div>
      {actions&&<footer className="ui-overlay-actions">{actions}</footer>}
    </section>
  </div>;

  return createPortal(overlay,document.body);
}
