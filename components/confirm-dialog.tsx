"use client";

import { useEffect } from "react";
import { Button, Icon } from "@/components/ui";
import { useI18n } from "@/lib/i18n/provider";

export default function ConfirmDialog({
  open,title,message,confirmLabel,cancelLabel,danger=false,onConfirm,onCancel,
}:{
  open:boolean;title:string;message:string;confirmLabel?:string;cancelLabel?:string;danger?:boolean;
  onConfirm:()=>void;onCancel:()=>void;
}){
  const {messages:m}=useI18n();
  const resolvedConfirm=confirmLabel??(m.common.save);
  const resolvedCancel=cancelLabel??m.common.cancel;
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
      <header><h2 id="confirm-title">{title}</h2><button type="button" className="icon-button" onClick={onCancel} aria-label={m.common.close}><Icon name="close"/></button></header>
      <p id="confirm-message">{message}</p>
      <div className="confirm-actions"><Button variant="secondary" onClick={onCancel}>{resolvedCancel}</Button><Button variant={danger?"danger":"primary"} onClick={onConfirm}>{resolvedConfirm}</Button></div>
    </section>
  </div>;
}
