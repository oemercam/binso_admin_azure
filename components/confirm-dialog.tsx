"use client";

import { useEffect } from "react";
import { Button, Icon } from "@/components/ui";

export default function ConfirmDialog({
  open,title,message,confirmLabel="Bestätigen",cancelLabel="Abbrechen",danger=false,onConfirm,onCancel,
}:{
  open:boolean;title:string;message:string;confirmLabel?:string;cancelLabel?:string;danger?:boolean;
  onConfirm:()=>void;onCancel:()=>void;
}){
  useEffect(()=>{
    if(!open)return;
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape")onCancel()};
    window.addEventListener("keydown",onKey);
    return()=>{document.body.style.overflow=previous;window.removeEventListener("keydown",onKey)};
  },[open,onCancel]);

  if(!open)return null;
  return <div className="confirm-layer" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)onCancel()}}>
    <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
      <header><h2 id="confirm-title">{title}</h2><button type="button" className="icon-button" onClick={onCancel} aria-label="Schliessen"><Icon name="close"/></button></header>
      <p id="confirm-message">{message}</p>
      <div className="confirm-actions"><Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button><Button variant={danger?"danger":"primary"} onClick={onConfirm}>{confirmLabel}</Button></div>
    </section>
  </div>;
}
